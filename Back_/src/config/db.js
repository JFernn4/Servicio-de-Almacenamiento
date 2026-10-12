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
