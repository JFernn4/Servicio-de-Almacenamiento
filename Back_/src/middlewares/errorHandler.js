export function notFound(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
}

// Solo se muestran al cliente los mensajes marcados como seguros (HttpError o
// errores 4xx de Express como un JSON mal formado); el resto se oculta.
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  if (status >= 500) {
    console.error('Error interno del servidor:', err);
  }

  res.status(status).json({
    error: err.expose ? err.message : 'Error interno del servidor',
  });
}
