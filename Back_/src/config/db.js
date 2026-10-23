import pg from 'pg';
import { config } from './env.js';

const pool = new pg.Pool({
  ...config.db,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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
