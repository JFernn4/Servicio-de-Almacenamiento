const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'vincloud_token';
const USER_KEY = 'vincloud_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Llamada a la API. Lanza Error con el mensaje del backend; `status` queda
 * indefinido cuando el servidor no respondió (error de red).
 */
export async function request(path, { method = 'GET', body, token = getToken(), isFormData = false } = {}) {
  let response;
  const headers = {};

  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : body && JSON.stringify(body),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Ocurrió un error inesperado.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function login(correo, contrasena) {
  const data = await request('/auth/login', { method: 'POST', body: { correo, contrasena }, token: null });
  saveSession(data);
  return data.user;
}

export async function register(nombre, correo, contrasena) {
  const data = await request('/auth/register', { method: 'POST', body: { nombre, correo, contrasena }, token: null });
  saveSession(data);
  return data.user;
}

/**
 * Usuario guardado localmente (puede estar desactualizado).
 */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

/**
 * Valida la sesión guardada contra el backend. Si el token ya no es válido
 * cierra la sesión; si el servidor no responde conserva el usuario guardado.
 */
export async function getProfile() {
  const token = getToken();
  if (!token) return null;

  try {
    const { user } = await request('/auth/me', { token });
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    if (error.status) {
      clearSession();
      return null;
    }
    return getCurrentUser();
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Solicitar enlace de recuperación de contraseña. Devuelve { message }.
 */
export function forgotPassword(correo) {
  return request('/auth/forgot-password', { method: 'POST', body: { correo }, token: null });
}

/**
 * Restablecer la contraseña con el token del correo. Devuelve { message }.
 */
export function resetPassword(token, nuevaContrasena) {
  return request('/auth/reset-password', { method: 'POST', body: { token, nuevaContrasena }, token: null });
}

/**
 * Verificar el correo con el token del enlace. Devuelve { message, user }.
 */
export async function verifyEmail(token) {
  const data = await request('/auth/verify-email', { method: 'POST', body: { token }, token: null });

  const currentUser = getCurrentUser();
  if (currentUser && data.user && currentUser.id === data.user.id) {
    localStorage.setItem(USER_KEY, JSON.stringify({ ...currentUser, correoVerificado: true }));
  }

  return data;
}
