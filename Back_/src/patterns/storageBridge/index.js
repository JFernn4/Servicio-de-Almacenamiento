import { config } from '../../config/env.js';
import { FileStorage } from './FileStorage.js';
import { LocalDiskProvider } from './LocalDiskProvider.js';
import { SupabaseStorageProvider } from './SupabaseStorageProvider.js';

/**
 * Elige el implementador según STORAGE_DRIVER (único lugar donde se decide):
 *   - "local"    → disco del servidor (desarrollo)
 *   - "supabase" → Supabase Storage (despliegue en Render)
 * Agregar otro proveedor (S3, R2…) = una clase nueva + un caso aquí.
 */
function createProvider({ driver, uploadDir, supabase }) {
  switch (driver) {
    case 'local':
      return new LocalDiskProvider(uploadDir);
    case 'supabase':
      return new SupabaseStorageProvider(supabase);
    default:
      throw new Error(`STORAGE_DRIVER desconocido: "${driver}". Usa "local" o "supabase".`);
  }
}

export const fileStorage = new FileStorage(createProvider(config.storage));
export { FileStorage };
