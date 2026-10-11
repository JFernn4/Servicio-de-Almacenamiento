/**
 * Escapa texto escrito por el usuario antes de insertarlo en HTML.
 */
export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
