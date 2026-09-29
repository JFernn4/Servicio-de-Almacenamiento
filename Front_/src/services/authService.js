const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Iniciar sesión con correo y contraseña
 */
export async function login(correo, contrasena) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ correo, contrasena }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error al iniciar sesión.');
  }

  setSession(data.token, data.user);
  return data;
}

/**
 * Registrar un nuevo usuario
 */
export async function register(nombre, correo, contrasena) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nombre, correo, contrasena }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error al registrar la cuenta.');
  }

  setSession(data.token, data.user);
  return data;
}

/**
 * Obtener perfil del usuario con token
 */
export async function getProfile() {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    clearSession();
    return null;
  }

  const data = await response.json();
  if (data.user) {
    localStorage.setItem('vincloud_user', JSON.stringify(data.user));
  }
  return data.user;
}

/**
 * Guardar datos de sesión localmente
 */
export function setSession(token, user) {
  if (token) localStorage.setItem('vincloud_token', token);
  if (user) localStorage.setItem('vincloud_user', JSON.stringify(user));
}

/**
 * Obtener token almacenado
 */
export function getToken() {
  return localStorage.getItem('vincloud_token');
}

/**
 * Obtener usuario almacenado
 */
export function getCurrentUser() {
  const raw = localStorage.getItem('vincloud_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Limpiar sesión (Logout)
 */
export function clearSession() {
  localStorage.removeItem('vincloud_token');
  localStorage.removeItem('vincloud_user');
}
