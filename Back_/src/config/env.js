import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Único punto donde se cargan las variables de entorno (Back_/.env)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = process.env;

export const config = {
  port: Number(env.PORT) || 5000,
  nodeEnv: env.NODE_ENV || 'development',
  corsOrigin: env.CORS_ORIGIN || 'http://localhost:5173',

  db: {
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
};
