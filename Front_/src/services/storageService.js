import { request, getToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Lista las carpetas y archivos contenidos en la raíz o en una carpeta específica.
 */
export function fetchDirectory(carpetaId = null) {
  const query = carpetaId ? `?carpetaId=${encodeURIComponent(carpetaId)}` : '';
  return request(`/storage/files${query}`);
}

/**
 * Obtiene los archivos subidos recientemente por el usuario.
 */
export async function fetchRecentFiles(limit = 10) {
  const data = await request(`/storage/files/recent?limit=${encodeURIComponent(limit)}`);
  return data.archivos || [];
}

/**
 * Busca archivos cuyo nombre coincida con el término indicado.
 */
export async function searchFiles(term) {
  const data = await request(`/storage/files/search?q=${encodeURIComponent(term)}`);
  return data.archivos || [];
}

/**
 * Sube un archivo binario usando multipart/form-data.
 */
export function uploadFile(file, carpetaId = null) {
  const formData = new FormData();
  formData.append('archivo', file);
  if (carpetaId) {
    formData.append('carpetaId', String(carpetaId));
  }

  return request('/storage/upload', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

/**
 * Visualiza un archivo autenticado en una nueva pestaña del navegador ("Visualizar archivos").
 */
export async function previewFile(id) {
  const token = getToken();
  let response;

  try {
    response = await fetch(`${API_URL}/storage/files/${encodeURIComponent(id)}/view`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor para visualizar el archivo.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo visualizar el archivo.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Descarga un archivo autenticado mediante streaming de Blob y dispara la descarga en el navegador.
 */
export async function downloadFile(id, filename = 'archivo') {
  const token = getToken();
  let response;

  try {
    response = await fetch(`${API_URL}/storage/files/${encodeURIComponent(id)}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor para descargar el archivo.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo descargar el archivo.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Genera un enlace de invitación compartido y opcionalmente envía invitación por correo.
 */
export function shareFile(id, correoDestinatario = '') {
  return request(`/storage/files/${encodeURIComponent(id)}/share`, {
    method: 'POST',
    body: { correoDestinatario },
  });
}

/**
 * Consulta la información pública de un archivo compartido a partir de su token de invitación.
 */
export async function fetchSharedFileInfo(token) {
  const data = await request(`/storage/shared/${encodeURIComponent(token)}`, { token: null });
  return data.archivo;
}

/**
 * Devuelve la URL directa para visualizar o descargar un archivo compartido públicamente.
 */
export function getSharedFileUrl(token, { inline = false } = {}) {
  const suffix = inline ? '?inline=true' : '';
  return `${API_URL}/storage/shared/${encodeURIComponent(token)}/download${suffix}`;
}

/**
 * Renombra un archivo existente.
 */
export function renameFile(id, nuevoNombre) {
  return request(`/storage/files/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { nuevoNombre },
  });
}

/**
 * Mueve un archivo a la papelera.
 */
export function deleteFile(id) {
  return request(`/storage/files/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/**
 * Obtiene los archivos que están en la papelera del usuario.
 */
export async function fetchTrashFiles() {
  const data = await request('/storage/trash');
  return data.archivos || [];
}

/**
 * Restaura un archivo desde la papelera.
 */
export function restoreFile(id) {
  return request(`/storage/trash/${encodeURIComponent(id)}/restore`, {
    method: 'POST',
  });
}

/**
 * Elimina permanentemente un archivo de la papelera liberando su espacio.
 */
export function permanentDeleteFile(id) {
  return request(`/storage/trash/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/**
 * Vacía todos los archivos de la papelera del usuario.
 */
export function emptyTrash() {
  return request('/storage/trash', {
    method: 'DELETE',
  });
}

/**
 * Crea una carpeta en la raíz o dentro de una carpeta padre.
 */
export function createFolder(nombre, carpetaPadreId = null) {
  return request('/storage/folders', {
    method: 'POST',
    body: { nombre, carpetaPadreId },
  });
}

/**
 * Renombra una carpeta existente.
 */
export function renameFolder(id, nuevoNombre) {
  return request(`/storage/folders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { nuevoNombre },
  });
}

/**
 * Elimina una carpeta y todo su contenido recursivamente.
 */
export function deleteFolder(id) {
  return request(`/storage/folders/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
