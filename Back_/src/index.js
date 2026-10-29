import { config } from './config/env.js';

// Sin secreto no se pueden firmar tokens de forma segura: fallar al arrancar.
if (!config.jwt.secret) {
  console.error('[Servidor] Falta JWT_SECRET en Back_/.env. Copia .env.example y configúralo.');
  process.exit(1);
}

// Con almacenamiento en Supabase, faltar una credencial haría fallar cada subida: avisar al arrancar.
if (config.storage.driver === 'supabase' && (!config.storage.supabase.url || !config.storage.supabase.serviceRoleKey)) {
  console.error('[Servidor] STORAGE_DRIVER=supabase requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

// La app se importa después de validar: al cargarse crea el proveedor de almacenamiento
const { default: app } = await import('./app.js');

app.listen(config.port, () => {
  console.log(`[Servidor] Escuchando en http://localhost:${config.port}`);
  console.log(`[Health check] Disponible en http://localhost:${config.port}/api/health`);
  console.log(`[Almacenamiento] ${config.storage.driver}${config.storage.maxUploadBytes ? ` · máximo ${config.storage.maxUploadBytes / (1024 * 1024)} MB por archivo` : ''}`);
});
