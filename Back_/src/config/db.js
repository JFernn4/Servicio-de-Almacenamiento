import pg from 'pg';
import { config } from './env.js';

/**
 * Fábrica de configuración del Pool (Principio Open/Closed):
 * - Extensible: Soporta conexión por URI en la nube (Supabase, Neon, Render) con TLS/SSL.
 * - Cerrada a modificación: Preserva los parámetros locales si no hay URI, asegurando
 *   que ningún compañero de equipo sufra incompatibilidades en su entorno.
 */
function createPoolConfig() {
  const isCloud = Boolean(config.db.connectionString);
  const sslConfig = config.db.ssl ? { rejectUnauthorized: false } : false;

  if (isCloud) {
    return {
      connectionString: config.db.connectionString,
      ssl: sslConfig,
      max: config.db.poolMax,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  return {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    ssl: sslConfig,
    max: config.db.poolMax,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new pg.Pool(createPoolConfig());

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

export const query = (text, params) => pool.query(text, params);

/**
 * Ejecuta un bloque de operaciones SQL dentro de una transacción ACID (BEGIN / COMMIT / ROLLBACK).
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export const getPool = () => pool;
export default pool;
