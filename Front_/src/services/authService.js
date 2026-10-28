const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'vincloud_token';
const USER_KEY = 'vincloud_user';
const ADMIN_USERS_STORAGE_KEY = 'vincloud_admin_users';
const ADMIN_LOGS_STORAGE_KEY = 'vincloud_admin_logs';

function recordRegisteredClientInAdmin(user, fallbackName, fallbackEmail) {
  try {
    const list = JSON.parse(localStorage.getItem(ADMIN_USERS_STORAGE_KEY) || '[]');
    const correo = user?.correo || fallbackEmail;
    if (!correo || list.some((item) => item.correo === correo)) return;

    const entry = {
      id: user?.id || `usr_${Date.now()}`,
      nombre: user?.nombre || fallbackName,
      correo,
      rol: user?.rol || 'usuario',
      plan: 'Básico',
      usadoGb: 0,
      limiteGb: 15,
      estado: user?.correoVerificado ? 'Activo' : 'Pendiente',
      verificado: Boolean(user?.correoVerificado),
    };
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify([entry, ...list]));

    const logs = JSON.parse(localStorage.getItem(ADMIN_LOGS_STORAGE_KEY) || '[]');
    const newLog = {
      id: `log_${Date.now()}`,
      time: 'Reciente',
      action: `Nuevo cliente registrado en la web: ${correo}`,
      type: 'info',
      actor: 'Registro Web',
    };
    localStorage.setItem(ADMIN_LOGS_STORAGE_KEY, JSON.stringify([newLog, ...logs]));
  } catch {
    // Ignorar errores de almacenamiento local
  }
}

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
  recordRegisteredClientInAdmin(data.user, nombre, correo);
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

/**
 * Solicitar enlace de recuperación de contraseña. Devuelve { message }.
 */
export function forgotPassword(correo) {
  return request('/auth/forgot-password', { method: 'POST', body: { correo } });
}

/**
 * Restablecer la contraseña con el token del correo. Devuelve { message }.
 */
export function resetPassword(token, nuevaContrasena) {
  return request('/auth/reset-password', { method: 'POST', body: { token, nuevaContrasena } });
}

/**
 * Verificar el correo con el token del enlace. Devuelve { message, user }.
 */
export async function verifyEmail(token) {
  const data = await request('/auth/verify-email', { method: 'POST', body: { token } });

  // Si es el usuario con sesión abierta en este navegador, reflejarlo en lo guardado
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === data.user.id) {
    localStorage.setItem(USER_KEY, JSON.stringify({ ...currentUser, correoVerificado: true }));
  }

  return data;
}
