import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

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

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
