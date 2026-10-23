// Reglas de negocio compartidas entre servicios y plantillas
export const DEFAULT_ROLE = 'Usuario';
export const DEFAULT_ACCESS_LEVEL = 'estandar';
export const ADMIN_ROLE = 'Administrador';
export const ADMIN_ACCESS_LEVEL = 'administrador';
export const DEFAULT_STORAGE_QUOTA_GB = 5;
export const DEFAULT_STORAGE_QUOTA_BYTES = DEFAULT_STORAGE_QUOTA_GB * 1024 ** 3;
export const MIN_PASSWORD_LENGTH = 6;

// Tokens de un solo propósito que viajan en los enlaces de los correos
export const TOKEN_PURPOSES = {
  EMAIL_VERIFICATION: 'verificacion_correo',
  PASSWORD_RESET: 'recuperacion_contrasena',
  FILE_SHARE: 'compartir_archivo',
};
export const EMAIL_VERIFICATION_EXPIRES_IN = '24h';
export const PASSWORD_RESET_EXPIRES_IN = '30m';
export const FILE_SHARE_EXPIRES_IN = '7d';

// Parámetros del módulo de almacenamiento y políticas dinámicas de Multer según Suscripción (Patrón Decorator)
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB valor de referencia general
export const FORBIDDEN_FILE_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.vbs', '.com', '.msi'];

export const PLAN_UPLOAD_POLICIES = {
  PlanGratuito: {
    maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB por archivo
    maxFiles: 1, // 1 archivo por carga
    shareExpiresIn: '24h',
    features: [
      '5 GB de almacenamiento base gratuito',
      'Tamaño máximo por archivo en Multer: 10 MB',
      'Subida de 1 archivo a la vez',
      'Enlaces compartidos con vigencia de 24 horas',
    ],
  },
  PlanBasico: {
    maxFileSizeBytes: 50 * 1024 * 1024, // 50 MB por archivo
    maxFiles: 3, // hasta 3 archivos simultáneos
    shareExpiresIn: '7d',
    features: [
      '50 GB de almacenamiento total (5 GB base + 45 GB decorador Básico)',
      'Tamaño máximo por archivo en Multer: 50 MB',
      'Subida múltiple de hasta 3 archivos simultáneos',
      'Enlaces compartidos con vigencia de 7 días',
    ],
  },
  Profesional: {
    maxFileSizeBytes: 250 * 1024 * 1024, // 250 MB por archivo
    maxFiles: 10, // hasta 10 archivos simultáneos
    shareExpiresIn: '30d',
    features: [
      '200 GB de almacenamiento total (5 GB base + 195 GB decorador Profesional)',
      'Tamaño máximo por archivo en Multer: 250 MB',
      'Subida múltiple de hasta 10 archivos simultáneos',
      'Enlaces compartidos con vigencia extendida de 30 días',
    ],
  },
  Empresarial: {
    maxFileSizeBytes: 1024 * 1024 * 1024, // 1 GB por archivo
    maxFiles: 25, // hasta 25 archivos simultáneos
    shareExpiresIn: '365d',
    features: [
      '1 TB de almacenamiento total (5 GB base + 1,019 GB decorador Empresarial)',
      'Tamaño máximo por archivo en Multer: 1 GB (1,024 MB)',
      'Subida masiva de hasta 25 archivos simultáneos',
      'Enlaces compartidos corporativos con vigencia de 365 días',
    ],
  },
};
