import fs from 'fs/promises';
import path from 'path';

/**
 * Patrón Bridge — ABSTRACCIÓN.
 *
 * Ofrece las operaciones que necesita el dominio de VinCloud sobre los bytes de un
 * archivo (guardar lo subido, entregarlo, renombrarlo, eliminarlo) y delega en un
 * StorageProvider el "dónde" (disco local o Supabase Storage). El "puente" es
 * `this.provider`: se puede cambiar de proveedor sin tocar esta clase ni los servicios.
 *
 * Los servicios trabajan con filas de la tabla `archivo` ({ id, nombre, tipo, ... }).
 */
export class FileStorage {
  constructor(provider) {
    this.provider = provider;
  }

  /**
   * Clave única del archivo: su id + la extensión de su nombre (ej. "42.pdf").
   */
  static keyFor(archivo, extension = path.extname(archivo.nombre || '')) {
    return `${archivo.id}${extension.toLowerCase()}`;
  }

  /**
   * Guarda el archivo temporal que dejó Multer como contenido definitivo de `archivo`.
   */
  async store(archivo, tempFilePath) {
    try {
      await this.provider.put(FileStorage.keyFor(archivo), tempFilePath, archivo.tipo);
    } finally {
      await fs.unlink(tempFilePath).catch(() => {});
    }
  }

  /**
   * Devuelve { stream, size } para entregar el archivo, o null si su contenido no existe.
   */
  async open(archivo) {
    return this.provider.get(FileStorage.keyFor(archivo));
  }

  /**
   * Ajusta la clave cuando el renombrado cambia la extensión del archivo.
   */
  async changeExtension(archivo, newExtension) {
    const fromKey = FileStorage.keyFor(archivo);
    const toKey = FileStorage.keyFor(archivo, newExtension);
    if (fromKey !== toKey) await this.provider.move(fromKey, toKey);
  }

  async remove(archivo) {
    await this.removeMany([archivo]);
  }

  /**
   * Elimina el contenido de varios archivos. Un fallo aquí no debe deshacer el borrado
   * en la base de datos (el archivo ya no es visible), así que solo se registra.
   */
  async removeMany(archivos) {
    if (archivos.length === 0) return;
    try {
      await this.provider.delete(archivos.map((archivo) => FileStorage.keyFor(archivo)));
    } catch (error) {
      console.error('[FileStorage] No se pudo eliminar el contenido de archivos:', error.message);
    }
  }
}
