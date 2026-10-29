/**
 * Patrón Bridge — IMPLEMENTADOR.
 *
 * Define CÓMO y DÓNDE se guardan los bytes de un archivo, sin saber nada de usuarios,
 * cuotas, carpetas ni papelera. Cada proveedor concreto (disco local, Supabase Storage…)
 * implementa estas operaciones primitivas trabajando solo con "claves" (nombres únicos).
 *
 * La ABSTRACCIÓN (FileStorage) usa estas primitivas para ofrecer operaciones del dominio.
 */
export class StorageProvider {
  /**
   * Guarda el contenido de un archivo temporal local bajo `key`.
   * El archivo temporal puede quedar movido o intacto; FileStorage se encarga de limpiarlo.
   */
  async put(_key, _localFilePath, _contentType) {
    throw new Error(`${this.constructor.name} debe implementar put()`);
  }

  /**
   * Devuelve { stream, size } para leer el archivo, o null si no existe.
   */
  async get(_key) {
    throw new Error(`${this.constructor.name} debe implementar get()`);
  }

  /**
   * Elimina las claves indicadas. Debe ignorar las que no existan.
   */
  async delete(_keys) {
    throw new Error(`${this.constructor.name} debe implementar delete()`);
  }

  /**
   * Cambia la clave de un archivo. Debe ignorar el caso en que el origen no exista.
   */
  async move(_fromKey, _toKey) {
    throw new Error(`${this.constructor.name} debe implementar move()`);
  }
}
