const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'vincloud_token';
const USER_KEY = 'vincloud_user';

/**
 * Llamada a la API. Lanza Error con el mensaje del backend; `status` queda
 * indefinido cuando el servidor no respondió (error de red).
 */
async function request(path, { method = 'GET', body, token } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && JSON.stringify(body),
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
  const data = await request('/auth/login', { method: 'POST', body: { correo, contrasena } });
  saveSession(data);
  return data.user;
}

export async function register(nombre, correo, contrasena) {
  const data = await request('/auth/register', { method: 'POST', body: { nombre, correo, contrasena } });
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
  const token = localStorage.getItem(TOKEN_KEY);
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
