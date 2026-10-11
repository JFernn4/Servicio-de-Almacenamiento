// Reglas de negocio compartidas entre servicios y plantillas
export const DEFAULT_ROLE = 'Usuario';
export const DEFAULT_ACCESS_LEVEL = 'estandar';
export const DEFAULT_STORAGE_QUOTA_GB = 5;
export const DEFAULT_STORAGE_QUOTA_BYTES = DEFAULT_STORAGE_QUOTA_GB * 1024 ** 3;
export const MIN_PASSWORD_LENGTH = 6;

// Tokens de un solo propósito que viajan en los enlaces de los correos
export const TOKEN_PURPOSES = {
  EMAIL_VERIFICATION: 'verificacion_correo',
  PASSWORD_RESET: 'recuperacion_contrasena',
};
export const EMAIL_VERIFICATION_EXPIRES_IN = '24h';
export const PASSWORD_RESET_EXPIRES_IN = '30m';
