import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { 
  sendWelcomeEmail, 
  sendVerificationEmail, 
  sendPasswordResetEmail 
} from '../services/emailService.js';

// Expresión regular para validar formato básico de correo
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cuota por defecto para nuevos usuarios (5 GB en bytes)
const DEFAULT_STORAGE_QUOTA = 5 * 1024 * 1024 * 1024; // 5 GB

/**
 * Registro de un nuevo usuario
 */
export const register = async (req, res, next) => {
  try {
    const { nombre, correo, contrasena } = req.body;

    // 1. Validaciones de entrada
    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos (nombre, correo, contraseña).'
      });
    }

    const cleanNombre = nombre.trim();
    const cleanCorreo = correo.trim().toLowerCase();

    if (!cleanNombre) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío.' });
    }

    if (!EMAIL_REGEX.test(cleanCorreo)) {
      return res.status(400).json({ error: 'El formato del correo electrónico no es válido.' });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres.'
      });
    }

    // 2. Comprobar si el correo ya está registrado
    const existingUser = await query(
      'SELECT id FROM usuario WHERE LOWER(correo) = $1',
      [cleanCorreo]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: 'Este correo electrónico ya se encuentra registrado.'
      });
    }

    // 3. Obtener el ID del rol "Usuario"
    const rolResult = await query(
      "SELECT id, nombre FROM rol WHERE LOWER(nombre) = 'usuario' LIMIT 1"
    );

    let rolId = rolResult.rows[0]?.id;
    let rolNombre = rolResult.rows[0]?.nombre || 'Usuario';

    // Si por alguna razón no existe el rol 'Usuario', tomamos el primer rol disponible
    if (!rolId) {
      const fallbackRol = await query('SELECT id, nombre FROM rol ORDER BY id ASC LIMIT 1');
      rolId = fallbackRol.rows[0]?.id;
      rolNombre = fallbackRol.rows[0]?.nombre || 'Usuario';
    }

    // 4. Hashear la contraseña con bcrypt
    const saltRounds = 10;
    const contrasenaHash = await bcrypt.hash(contrasena, saltRounds);

    // 5. Insertar el nuevo usuario en PostgreSQL
    const insertResult = await query(
      `INSERT INTO usuario (
        rol_id, 
        nombre, 
        correo, 
        contrasena_hash, 
        nivel_acceso, 
        espacio_consumido, 
        espacio_disponible
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, rol_id, nombre, correo, fecha_registro, correo_verificado, nivel_acceso, espacio_consumido, espacio_disponible`,
      [
        rolId,
        cleanNombre,
        cleanCorreo,
        contrasenaHash,
        'estandar',
        0,
        DEFAULT_STORAGE_QUOTA
      ]
    );

    const newUser = insertResult.rows[0];

    // 6. Generar token JWT de sesion
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_default';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        id: newUser.id,
        correo: newUser.correo,
        nombre: newUser.nombre,
        rol: rolNombre
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    // 7. Generar token para verificacion de correo (24h)
    const verificationToken = jwt.sign(
      {
        id: newUser.id,
        correo: newUser.correo,
        tipo: 'verificacion_correo'
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // 8. Enviar correos en segundo plano (bienvenida y verificacion)
    sendWelcomeEmail(newUser.correo, newUser.nombre).catch((err) => {
      console.error('[EmailService] Error al enviar correo de bienvenida:', err.message);
    });

    sendVerificationEmail(newUser.correo, newUser.nombre, verificationToken).catch((err) => {
      console.error('[EmailService] Error al enviar correo de verificacion:', err.message);
    });

    return res.status(201).json({
      message: 'Usuario registrado exitosamente. Se ha enviado un correo de verificacion.',
      token,
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        correo: newUser.correo,
        rol: rolNombre,
        correoVerificado: newUser.correo_verificado,
        nivelAcceso: newUser.nivel_acceso,
        espacioConsumido: Number(newUser.espacio_consumido),
        espacioDisponible: Number(newUser.espacio_disponible),
        fechaRegistro: newUser.fecha_registro
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Inicio de sesión (Login)
 */
export const login = async (req, res, next) => {
  try {
    const { correo, contrasena } = req.body;

    // 1. Validaciones de entrada
    if (!correo || !contrasena) {
      return res.status(400).json({
        error: 'Debes proporcionar tu correo y contraseña.'
      });
    }

    const cleanCorreo = correo.trim().toLowerCase();

    // 2. Buscar usuario con su rol asociado
    const result = await query(
      `SELECT 
        u.id, 
        u.rol_id, 
        u.nombre, 
        u.correo, 
        u.contrasena_hash, 
        u.fecha_registro, 
        u.correo_verificado, 
        u.nivel_acceso, 
        u.espacio_consumido, 
        u.espacio_disponible,
        r.nombre AS rol_nombre
      FROM usuario u
      JOIN rol r ON u.rol_id = r.id
      WHERE LOWER(u.correo) = $1`,
      [cleanCorreo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas. Verifica tu correo y contraseña.'
      });
    }

    const user = result.rows[0];

    // 3. Comparar contraseña con el hash guardado
    const isPasswordMatch = await bcrypt.compare(contrasena, user.contrasena_hash);

    if (!isPasswordMatch) {
      return res.status(401).json({
        error: 'Credenciales inválidas. Verifica tu correo y contraseña.'
      });
    }

    // 4. Generar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_default';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        id: user.id,
        correo: user.correo,
        nombre: user.nombre,
        rol: user.rol_nombre
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol_nombre,
        nivelAcceso: user.nivel_acceso,
        espacioConsumido: Number(user.espacio_consumido),
        espacioDisponible: Number(user.espacio_disponible),
        fechaRegistro: user.fecha_registro
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener perfil del usuario autenticado actual (/me)
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    const result = await query(
      `SELECT 
        u.id, 
        u.rol_id, 
        u.nombre, 
        u.correo, 
        u.fecha_registro, 
        u.correo_verificado, 
        u.nivel_acceso, 
        u.espacio_consumido, 
        u.espacio_disponible,
        r.nombre AS rol_nombre
      FROM usuario u
      JOIN rol r ON u.rol_id = r.id
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const user = result.rows[0];

    return res.status(200).json({
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol_nombre,
        correoVerificado: user.correo_verificado,
        nivelAcceso: user.nivel_acceso,
        espacioConsumido: Number(user.espacio_consumido),
        espacioDisponible: Number(user.espacio_disponible),
        fechaRegistro: user.fecha_registro
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validar y verificar correo electronico con token
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'El token de verificacion es requerido.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_default';
    let decoded;

    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      return res.status(400).json({
        error: 'El enlace de verificacion es invalido o ha expirado.'
      });
    }

    if (decoded.tipo !== 'verificacion_correo') {
      return res.status(400).json({ error: 'Token de tipo no valido.' });
    }

    const updateResult = await query(
      `UPDATE usuario 
       SET correo_verificado = TRUE 
       WHERE id = $1 
       RETURNING id, nombre, correo, correo_verificado`,
      [decoded.id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const updatedUser = updateResult.rows[0];

    return res.status(200).json({
      message: 'Correo electronico verificado exitosamente. Tu cuenta ahora tiene acceso completo.',
      user: {
        id: updatedUser.id,
        nombre: updatedUser.nombre,
        correo: updatedUser.correo,
        correoVerificado: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Solicitar recuperacion de contrasena (Olvido su contrasena)
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ error: 'Debes proporcionar tu correo electronico.' });
    }

    const cleanCorreo = correo.trim().toLowerCase();

    // 1. Buscar si el usuario existe
    const result = await query(
      'SELECT id, nombre, correo FROM usuario WHERE LOWER(correo) = $1',
      [cleanCorreo]
    );

    // Por seguridad, si no existe el correo respondemos con exito generico para no revelar registros
    if (result.rows.length === 0) {
      return res.status(200).json({
        message: 'Si el correo esta registrado, se ha enviado un enlace de recuperacion.'
      });
    }

    const user = result.rows[0];

    // 2. Generar token de recuperacion con validez de 30 minutos
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_default';
    const resetToken = jwt.sign(
      {
        id: user.id,
        correo: user.correo,
        tipo: 'recuperacion_contrasena'
      },
      jwtSecret,
      { expiresIn: '30m' }
    );

    // 3. Enviar correo de restablecimiento
    sendPasswordResetEmail(user.correo, user.nombre, resetToken).catch((err) => {
      console.error('[EmailService] Error al enviar correo de recuperacion:', err.message);
    });

    return res.status(200).json({
      message: 'Se ha enviado un enlace de recuperacion a tu correo electronico.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restablecer contrasena usando token de recuperacion
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, nuevaContrasena } = req.body;

    if (!token || !nuevaContrasena) {
      return res.status(400).json({
        error: 'El token y la nueva contrasena son requeridos.'
      });
    }

    if (nuevaContrasena.length < 6) {
      return res.status(400).json({
        error: 'La nueva contrasena debe tener al menos 6 caracteres.'
      });
    }

    // 1. Verificar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_default';
    let decoded;

    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      return res.status(400).json({
        error: 'El enlace de recuperacion es invalido o ha expirado. Por favor solicita uno nuevo.'
      });
    }

    if (decoded.tipo !== 'recuperacion_contrasena') {
      return res.status(400).json({ error: 'Token de tipo no valido.' });
    }

    // 2. Hashear la nueva contrasena
    const saltRounds = 10;
    const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, saltRounds);

    // 3. Actualizar contrasena en PostgreSQL
    const updateResult = await query(
      'UPDATE usuario SET contrasena_hash = $1 WHERE id = $2 RETURNING id, correo',
      [nuevaContrasenaHash, decoded.id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    return res.status(200).json({
      message: 'Contrasena restablecida exitosamente. Ya puedes iniciar sesion con tu nueva contrasena.'
    });
  } catch (error) {
    next(error);
  }
};
