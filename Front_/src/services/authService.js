const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
