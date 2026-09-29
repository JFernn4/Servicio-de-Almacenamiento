import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Acceso no autorizado. Se requiere un token de autenticación.',
    });
  }

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_default';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: 'Token inválido o expirado. Inicia sesión nuevamente.',
      });
    }

    req.user = decoded;
    next();
  });
};
