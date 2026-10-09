import * as authService from '../services/authService.js';
import { validateRegister, validateLogin } from '../validators/authValidator.js';

// Express 5 propaga automáticamente los errores de handlers async al errorHandler.

export async function register(req, res) {
  const session = await authService.register(validateRegister(req.body));
  res.status(201).json({ message: 'Usuario registrado exitosamente.', ...session });
}

export async function login(req, res) {
  const session = await authService.login(validateLogin(req.body));
  res.status(200).json({ message: 'Inicio de sesión exitoso.', ...session });
}

export async function getProfile(req, res) {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json({ user });
}
