import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_DIR = path.resolve(__dirname, '../../../database');

// Los scripts SQL son idempotentes (CREATE TABLE IF NOT EXISTS / ON CONFLICT DO NOTHING)
const SQL_FILES = ['inicializacion/schema.sql', 'datos-iniciales/seed.sql'];

function createClientConfig(targetDatabase) {
  const sslConfig = config.db.ssl ? { rejectUnauthorized: false } : false;

  if (config.db.connectionString) {
    return {
      connectionString: config.db.connectionString,
      ssl: sslConfig,
    };
  }

  return {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: targetDatabase || config.db.database,
    ssl: sslConfig,
  };
}

async function withClient(targetDatabase, fn) {
  const client = new pg.Client(createClientConfig(targetDatabase));
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function ensureDatabaseExists() {
  // En bases de datos en la nube (Supabase, Neon, etc.), la BD ya existe y no se tienen permisos de superusuario
  if (config.db.skipDbCreate || config.db.connectionString) {
    console.log('ℹ️ Base de datos en la nube o existente detectada. Omitiendo paso de CREATE DATABASE.');
    return;
  }

  const { database } = config.db;
  if (!database || database === 'postgres') {
    return;
  }

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
  await withClient(null, async (client) => {
    for (const file of SQL_FILES) {
      console.log(`📄 Ejecutando ${file}...`);
      const sql = await fs.readFile(path.join(DATABASE_DIR, file), 'utf-8');
      await client.query(sql);
    }
  });
}

try {
  await ensureDatabaseExists();
  await runSqlFiles();
  console.log('🎉 Inicialización de base de datos completada exitosamente.');
} catch (err) {
  console.error('❌ Error durante la inicialización:', err.message || err);
  process.exit(1);
}
