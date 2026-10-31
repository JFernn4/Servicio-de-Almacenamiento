import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { query } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: config.nodeEnv === 'production' ? config.corsOrigin : true,
  })
);
app.use(express.json());

if (config.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// Servir los prototipos HTML de prueba en http://localhost:5000/pruebas/
app.use('/pruebas', express.static(path.resolve(__dirname, '../Pruebas_Front')));

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      dbName: config.db.database,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Registrar el motivo: en Render, si la BD falla, este log es la única pista
    console.error('[Health check] La base de datos no responde:', error.code || '', error.message);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
