const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'vincloud_token';
const USER_KEY = 'vincloud_user';

/**
 * Iniciar sesión con correo y contraseña (y tipo de cuenta opcional)
 */
export async function login(correo, contrasena, tipoCuenta) {
  const payload = { correo, contrasena };
  if (tipoCuenta) {
    payload.tipoCuenta = tipoCuenta;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al iniciar sesión.');
    }

    setSession(data.token, data.user);
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor de VinCloud. Verifica que el backend esté activo.');
    }
    throw error;
  }
}

/**
 * Registrar un nuevo usuario (con tipo de cuenta / rol opcional)
 */
export async function register(nombre, correo, contrasena, tipoCuenta) {
  const payload = { nombre, correo, contrasena };
  if (tipoCuenta) {
    payload.tipoCuenta = tipoCuenta;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al registrar la cuenta.');
    }

    setSession(data.token, data.user);
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor de VinCloud. Verifica que el backend esté activo.');
    }
    throw error;
  }
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
 * Solicitar enlace de recuperación de contraseña (¿Olvidaste tu contraseña?)
 */
export async function forgotPassword(correo) {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al solicitar recuperación de contraseña.');
    }
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor de VinCloud. Verifica que el backend esté activo.');
    }
    throw error;
  }
}

/**
 * Restablecer contraseña utilizando el token recibido
 */
export async function resetPassword(token, nuevaContrasena) {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, nuevaContrasena }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al restablecer contraseña.');
    }
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor de VinCloud. Verifica que el backend esté activo.');
    }
    throw error;
  }
}

/**
 * Reenviar correo de verificación de cuenta
 */
export async function resendVerification(correo) {
  try {
    const response = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al reenviar correo de verificación.');
    }
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor de VinCloud. Verifica que el backend esté activo.');
    }
    throw error;
  }
}

/**
 * Guardar datos de sesión localmente
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
