import fs from 'fs';
import { Readable } from 'stream';
import { StorageProvider } from './StorageProvider.js';

/**
 * Patrón Bridge — IMPLEMENTADOR CONCRETO: Supabase Storage.
 * Usa la API REST de Supabase Storage con la clave secreta del proyecto (sb_secret_…
 * o la service_role antigua). Solo en el backend, nunca en el frontend. El bucket debe ser PRIVADO: los archivos se entregan siempre
 * a través del backend, que valida la sesión o el enlace compartido.
 */
export class SupabaseStorageProvider extends StorageProvider {
  constructor({ url, serviceRoleKey, bucket }) {
    super();
    this.baseUrl = `${url.replace(/\/+$/, '')}/storage/v1`;
    this.bucket = bucket;
    this.headers = SupabaseStorageProvider.authHeaders(serviceRoleKey);
  }

  /**
   * Cabeceras de autenticación según el tipo de clave:
   *  - clave secreta nueva (sb_secret_…): no es un JWT; va solo en `apikey`
   *  - clave service_role antigua (JWT eyJ…): en `apikey` y como `Authorization: Bearer`
   */
  static authHeaders(key) {
    const isLegacyJwt = key.split('.').length === 3 && key.startsWith('eyJ');
    return isLegacyJwt ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
  }

  objectUrl(key, { authenticated = false } = {}) {
    const scope = authenticated ? 'object/authenticated' : 'object';
    return `${this.baseUrl}/${scope}/${encodeURIComponent(this.bucket)}/${encodeURIComponent(key)}`;
  }

  async request(url, options = {}) {
    return fetch(url, { ...options, headers: { ...this.headers, ...options.headers } });
  }

  async fail(action, response) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase Storage: no se pudo ${action} (HTTP ${response.status}) ${detail}`.trim());
  }

  // Supabase responde "no encontrado" como 404 o como 400 con el detalle en el cuerpo
  static async isNotFound(response) {
    if (response.status === 404) return true;
    if (response.status !== 400) return false;
    const body = await response.clone().text().catch(() => '');
    return /not.?found/i.test(body);
  }

  async put(key, localFilePath, contentType = 'application/octet-stream') {
    const { size } = await fs.promises.stat(localFilePath);
    const response = await this.request(this.objectUrl(key), {
      method: 'POST',
      headers: { 'Content-Type': contentType, 'Content-Length': String(size), 'x-upsert': 'true' },
      body: fs.createReadStream(localFilePath),
      duplex: 'half', // necesario para enviar un stream como cuerpo con fetch de Node
    });
    if (!response.ok) await this.fail('subir el archivo', response);
  }

  async get(key) {
    const response = await this.request(this.objectUrl(key, { authenticated: true }));
    if (!response.ok) {
      if (await SupabaseStorageProvider.isNotFound(response)) return null;
      await this.fail('leer el archivo', response);
    }
    const size = Number(response.headers.get('content-length')) || undefined;
    return { stream: Readable.fromWeb(response.body), size };
  }

  async delete(keys) {
    if (keys.length === 0) return;
    const response = await this.request(`${this.baseUrl}/object/${encodeURIComponent(this.bucket)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: keys }),
    });
    if (!response.ok && !(await SupabaseStorageProvider.isNotFound(response))) {
      await this.fail('eliminar archivos', response);
    }
  }

  async move(fromKey, toKey) {
    const response = await this.request(`${this.baseUrl}/object/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucketId: this.bucket, sourceKey: fromKey, destinationKey: toKey }),
    });
    if (!response.ok && !(await SupabaseStorageProvider.isNotFound(response))) {
      await this.fail('renombrar el archivo', response);
    }
  }
}
