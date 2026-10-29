import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Único punto donde se cargan las variables de entorno (Back_/.env)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = process.env;

// Detección de base de datos en la nube (Supabase, Neon, Render, Railway, etc.)
const rawDatabaseUrl = env.DATABASE_URL || env.DB_CONNECTION_STRING || null;
const isRemoteDatabase = Boolean(
  rawDatabaseUrl &&
  !rawDatabaseUrl.includes('localhost') &&
  !rawDatabaseUrl.includes('127.0.0.1')
);
const sslEnabled = env.DB_SSL !== undefined
  ? env.DB_SSL === 'true'
  : isRemoteDatabase;

export const config = {
  port: Number(env.PORT) || 5000,
  nodeEnv: env.NODE_ENV || 'development',
  corsOrigin: env.CORS_ORIGIN || 'http://localhost:5173',
  // URL del frontend para los enlaces de los correos (verificación y recuperación)
  frontendUrl: env.FRONTEND_URL || 'http://localhost:5173',

  db: {
    // Modo Cloud / URI (Supabase, Neon, etc.) - Si está presente tiene prioridad
    connectionString: rawDatabaseUrl,
    ssl: sslEnabled,
    poolMax: Number(env.DB_POOL_MAX) || (rawDatabaseUrl ? 10 : 20),
    skipDbCreate: env.SKIP_DB_CREATE === 'true' || Boolean(rawDatabaseUrl),

    // Modo Local (fallback retrocompatible para compañeros en sus ramas)
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT) || 5432,
    user: env.DB_USER || 'postgres',
    password: env.DB_PASSWORD || 'postgres',
    database: env.DB_NAME || 'almacenamiento_db',
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN || '7d',
  },

  mail: {
    host: env.SMTP_HOST || 'live.smtp.mailtrap.io',
    port: Number(env.SMTP_PORT) || 587,
    user: env.SMTP_USER || 'api',
    pass: env.SMTP_PASS,
    from: env.EMAIL_FROM || 'VinCloud <no-reply@vincloud.com>',
  },

  storage: {
    uploadDir: env.UPLOAD_DIR ? path.resolve(env.UPLOAD_DIR) : path.resolve(__dirname, '../../uploads'),
  },
};
