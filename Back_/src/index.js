import { config } from './config/env.js';
import app from './app.js';

// Sin secreto no se pueden firmar tokens de forma segura: fallar al arrancar.
if (!config.jwt.secret) {
  console.error('[Servidor] Falta JWT_SECRET en Back_/.env. Copia .env.example y configúralo.');
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`[Servidor] Escuchando en http://localhost:${config.port}`);
  console.log(`[Health check] Disponible en http://localhost:${config.port}/api/health`);
});
