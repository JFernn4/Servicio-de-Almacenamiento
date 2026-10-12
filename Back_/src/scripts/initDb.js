import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_DIR = path.resolve(__dirname, '../../../database');

// Los scripts SQL son idempotentes, así que este proceso puede ejecutarse varias veces.
const SQL_FILES = ['inicializacion/schema.sql', 'datos-iniciales/seed.sql'];

async function withClient(database, fn) {
  const client = new pg.Client({ ...config.db, database });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function ensureDatabaseExists() {
  const { database } = config.db;

  await withClient('postgres', async (client) => {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (rowCount > 0) {
      console.log(`ℹ️ La base de datos "${database}" ya existe.`);
      return;
    }
    await client.query(`CREATE DATABASE "${database}"`);
    console.log(`✅ Base de datos "${database}" creada.`);
  });
}

async function runSqlFiles() {
  await withClient(config.db.database, async (client) => {
    for (const file of SQL_FILES) {
      console.log(`📄 Ejecutando ${file}...`);
      await client.query(await fs.readFile(path.join(DATABASE_DIR, file), 'utf-8'));
    }
  });
}

try {
  await ensureDatabaseExists();
  await runSqlFiles();
  console.log('🎉 Inicialización de base de datos completada.');
} catch (err) {
  console.error('❌ Error durante la inicialización:', err.message);
  process.exit(1);
}
