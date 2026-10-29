import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { StorageProvider } from './StorageProvider.js';

const ignoreNotFound = (error) => {
  if (error.code !== 'ENOENT') throw error;
};

/**
 * Patrón Bridge — IMPLEMENTADOR CONCRETO: disco local del servidor.
 * Es el comportamiento que el proyecto tenía antes del despliegue (carpeta Back_/uploads).
 * Útil en desarrollo; en la nube gratuita el disco se borra al reiniciar el servidor.
 */
export class LocalDiskProvider extends StorageProvider {
  constructor(directory) {
    super();
    this.directory = directory;
    fsSync.mkdirSync(directory, { recursive: true });
  }

  pathFor(key) {
    return path.join(this.directory, key);
  }

  async put(key, localFilePath) {
    const target = this.pathFor(key);
    try {
      await fs.rename(localFilePath, target);
    } catch (error) {
      // EXDEV: el temporal está en otra unidad/partición, no se puede renombrar
      if (error.code !== 'EXDEV') throw error;
      await fs.copyFile(localFilePath, target);
      await fs.unlink(localFilePath).catch(() => {});
    }
  }

  async get(key) {
    const filePath = this.pathFor(key);
    try {
      const { size } = await fs.stat(filePath);
      return { stream: fsSync.createReadStream(filePath), size };
    } catch (error) {
      ignoreNotFound(error);
      return null;
    }
  }

  async delete(keys) {
    await Promise.all(keys.map((key) => fs.unlink(this.pathFor(key)).catch(ignoreNotFound)));
  }

  async move(fromKey, toKey) {
    await fs.rename(this.pathFor(fromKey), this.pathFor(toKey)).catch(ignoreNotFound);
  }
}
