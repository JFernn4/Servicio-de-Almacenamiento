import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde Back_/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const targetDbName = process.env.DB_NAME || 'almacenamiento_db';

async function initDatabase() {
  console.log('🔄 Iniciando verificación y configuración de base de datos...');

  // 1. Conectar a postgres default para verificar y crear almacenamiento_db
  const defaultClient = new pg.Client({
    ...dbConfig,
    database: 'postgres',
  });

  try {
    await defaultClient.connect();
    const checkDb = await defaultClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDbName]
    );

    if (checkDb.rows.length === 0) {
      console.log(`📦 Creando base de datos "${targetDbName}"...`);
      await defaultClient.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Base de datos "${targetDbName}" creada exitosamente.`);
    } else {
      console.log(`ℹ️ La base de datos "${targetDbName}" ya existe.`);
    }
  } catch (error) {
    console.error('❌ Error al verificar o crear la base de datos:', error.message);
    throw error;
  } finally {
    await defaultClient.end();
  }

  // 2. Conectar a almacenamiento_db para ejecutar schema.sql y seed.sql
  const targetClient = new pg.Client({
    ...dbConfig,
    database: targetDbName,
  });

  try {
    await targetClient.connect();

    // Leer schema.sql
    const schemaPath = path.resolve(__dirname, '../../../database/inicializacion/schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Ejecutando schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await targetClient.query(schemaSql);
      console.log('✅ Tablas creadas correctamente según schema.sql.');
    } else {
      console.warn('⚠️ No se encontró el archivo schema.sql en:', schemaPath);
    }

    // Leer seed.sql
    const seedPath = path.resolve(__dirname, '../../../database/datos-iniciales/seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Ejecutando seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      await targetClient.query(seedSql);
      console.log('✅ Datos iniciales insertados correctamente según seed.sql.');
    } else {
      console.warn('⚠️ No se encontró el archivo seed.sql en:', seedPath);
    }

    console.log('🎉 Inicialización de Base de Datos completada con éxito.');
  } catch (error) {
    if (error.code === '42P07') {
      console.log('ℹ️ Las tablas ya estaban creadas en la base de datos.');
    } else {
      console.error('❌ Error al ejecutar schema/seed:', error.message);
      throw error;
    }
  } finally {
    await targetClient.end();
  }
}

initDatabase().catch((err) => {
  console.error('Error fatal durante la inicialización:', err);
  process.exit(1);
});
