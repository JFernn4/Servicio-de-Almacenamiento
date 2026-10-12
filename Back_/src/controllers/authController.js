import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

// Expresión regular para validar formato básico de correo
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cuota por defecto para nuevos usuarios (5 GB en bytes)
const DEFAULT_STORAGE_QUOTA = 5 * 1024 * 1024 * 1024; // 5 GB

/**
 * Registro de un nuevo usuario
 */
export const register = async (req, res, next) => {
  try {
    const { nombre, correo, contrasena, tipoCuenta, rol, tipo_cuenta, role } = req.body;

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

    // 3. Determinar y resolver el rol según el tipo de cuenta solicitado
    // Permite asignar automáticamente 'Administrador' o 'Usuario' / 'Cliente'.
    const rawTipo = (tipoCuenta || rol || tipo_cuenta || role || '').toString().trim().toLowerCase();
    const esAdmin = rawTipo === 'administrador' || rawTipo === 'admin' || rawTipo === 'administrator';

    const targetRolNombre = esAdmin ? 'administrador' : 'usuario';
    const nivelAcceso = esAdmin ? 'administrador' : 'estandar';

    let rolResult = await query(
      'SELECT id, nombre FROM rol WHERE LOWER(nombre) = $1 LIMIT 1',
      [targetRolNombre]
    );

    // Si busca rol estándar/usuario y no lo encuentra en BD, intentar buscar 'cliente'
    if (rolResult.rows.length === 0 && !esAdmin) {
      rolResult = await query(
        "SELECT id, nombre FROM rol WHERE LOWER(nombre) = 'cliente' LIMIT 1"
      );
    }

    let rolId = rolResult.rows[0]?.id;
    let rolNombre = rolResult.rows[0]?.nombre || (esAdmin ? 'Administrador' : 'Usuario');

    // Fallback de seguridad en caso de que la tabla de roles esté vacía o no coincida
    if (!rolId) {
      const fallbackRol = await query('SELECT id, nombre FROM rol ORDER BY id ASC LIMIT 1');
      rolId = fallbackRol.rows[0]?.id;
      rolNombre = fallbackRol.rows[0]?.nombre || (esAdmin ? 'Administrador' : 'Usuario');
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
        nivelAcceso,
        0,
        DEFAULT_STORAGE_QUOTA
      ]
    );

    const newUser = insertResult.rows[0];

    // 6. Generar token JWT de sesión
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

    // 7. Generar token de verificación de correo (24h de validez)
    const verificationToken = jwt.sign(
      {
        id: newUser.id,
        correo: newUser.correo,
        type: 'verify_email'
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // 8. Despachar correo de verificación y bienvenida en segundo plano
    sendVerificationEmail(newUser.correo, newUser.nombre, verificationToken).catch((err) => {
      console.error('⚠️ [EmailService] Error al enviar correo de verificación:', err.message);
    });

    sendWelcomeEmail(newUser.correo, newUser.nombre).catch((err) => {
      console.error('⚠️ [EmailService] Error al enviar correo de bienvenida:', err.message);
    });

    return res.status(201).json({
      message: 'Usuario registrado exitosamente. Se ha enviado un correo para verificar tu cuenta.',
      token,
      verificationToken,
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        correo: newUser.correo,
        rol: rolNombre,
        nivelAcceso: newUser.nivel_acceso,
        correoVerificado: Boolean(newUser.correo_verificado),
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
    const { correo, contrasena, tipoCuenta, rol, tipo_cuenta, role } = req.body;

    // 1. Validaciones de entrada (según Diagrama de Actividad UML: Expresiones Regulares)
    if (!correo || typeof correo !== 'string') {
      return res.status(400).json({
        error: 'Debes proporcionar tu correo electrónico.'
      });
    }

    const cleanCorreo = correo.trim().toLowerCase();

    if (!cleanCorreo) {
      return res.status(400).json({
        error: 'El correo electrónico no puede estar en blanco.'
      });
    }

    if (!EMAIL_REGEX.test(cleanCorreo)) {
      return res.status(400).json({
        error: 'El formato del correo electrónico no es válido.'
      });
    }

    if (!contrasena || typeof contrasena !== 'string' || contrasena.trim() === '') {
      return res.status(400).json({
        error: 'Debes ingresar tu contraseña.'
      });
    }

    // 2. Buscar usuario con su rol asociado en la Base de Datos
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

    // 4. Validación opcional si se especifica el tipo de cuenta al iniciar sesión
    const requestedTipo = (tipoCuenta || rol || tipo_cuenta || role || '').toString().trim().toLowerCase();
    if (requestedTipo) {
      const isReqAdmin = requestedTipo === 'administrador' || requestedTipo === 'admin' || requestedTipo === 'administrator';
      const isUserAdmin = user.rol_nombre.toLowerCase() === 'administrador';
      if (isReqAdmin && !isUserAdmin) {
        return res.status(403).json({
          error: 'Acceso denegado. Esta cuenta no cuenta con permisos de Administrador.'
        });
      }
    }

    // 5. Generar token JWT
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
      message: user.correo_verificado
        ? 'Inicio de sesión exitoso.'
        : 'Inicio de sesión exitoso. Recuerda verificar tu correo electrónico para tener acceso completo.',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol_nombre,
        nivelAcceso: user.nivel_acceso,
        correoVerificado: Boolean(user.correo_verificado),
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
        nivelAcceso: user.nivel_acceso,
        correoVerificado: Boolean(user.correo_verificado),
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
 * Generador de vista HTML para respuesta directa de verificación en navegador
 */
function renderVerificationPage(success, message) {
  const primaryColor = success ? '#16A34A' : '#DC2626';
  const icon = success ? '✅' : '❌';
  const title = success ? '¡Correo Verificado con Éxito!' : 'No se pudo verificar el correo';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - VinCloud</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #F8FAFC;
          color: #1E293B;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          box-sizing: border-box;
        }
        .card {
          background: #FFFFFF;
          max-width: 480px;
          width: 100%;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(59, 10, 31, 0.08), 0 8px 10px -6px rgba(59, 10, 31, 0.04);
          overflow: hidden;
          border: 1px solid #E2E8F0;
          text-align: center;
        }
        .header {
          background: linear-gradient(135deg, #3B0A1F 0%, #7D1535 100%);
          padding: 28px 20px;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
        }
        .body {
          padding: 32px 28px;
        }
        .status-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .message-title {
          font-size: 19px;
          font-weight: 700;
          color: ${primaryColor};
          margin-bottom: 12px;
        }
        .message-text {
          font-size: 14.5px;
          line-height: 1.5;
          color: #475569;
          margin-bottom: 24px;
        }
        .btn {
          display: inline-block;
          background-color: #7D1535;
          color: #FFFFFF;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #5D0F27;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>VinCloud</h1>
        </div>
        <div class="body">
          <div class="status-icon">${icon}</div>
          <div class="message-title">${title}</div>
          <p class="message-text">${message}</p>
          <a href="http://localhost:5173" class="btn">Ir a VinCloud</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Verificación de correo electrónico (GET vía enlace o POST con token)
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.query.token || req.body?.token;
    const isHtmlClient = req.headers.accept?.includes('text/html');

    if (!token) {
      if (isHtmlClient) {
        return res.status(400).send(renderVerificationPage(false, 'Token no proporcionado.'));
      }
      return res.status(400).json({ error: 'Debes proporcionar un token de verificación.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_default';

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtErr) {
      const msg = jwtErr.name === 'TokenExpiredError'
        ? 'El enlace de verificación ha expirado. Por favor solicita uno nuevo.'
        : 'El token de verificación no es válido o está alterado.';

      if (isHtmlClient) {
        return res.status(400).send(renderVerificationPage(false, msg));
      }
      return res.status(400).json({ error: msg });
    }

    if (decoded.type !== 'verify_email' || !decoded.id) {
      const msg = 'El token proporcionado no corresponde a una verificación de correo válida.';
      if (isHtmlClient) {
        return res.status(400).send(renderVerificationPage(false, msg));
      }
      return res.status(400).json({ error: msg });
    }

    // Actualizar usuario en la BD
    const result = await query(
      `UPDATE usuario 
       SET correo_verificado = TRUE 
       WHERE id = $1 
       RETURNING id, nombre, correo, correo_verificado`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      const msg = 'No se encontró el usuario asociado a este token.';
      if (isHtmlClient) {
        return res.status(404).send(renderVerificationPage(false, msg));
      }
      return res.status(404).json({ error: msg });
    }

    const updatedUser = result.rows[0];

    if (isHtmlClient) {
      return res.status(200).send(
        renderVerificationPage(
          true,
          `¡Hola ${updatedUser.nombre}! Tu cuenta (${updatedUser.correo}) ha sido verificada exitosamente. Ya puedes utilizar tu espacio de almacenamiento.`
        )
      );
    }

    return res.status(200).json({
      message: 'Correo verificado exitosamente.',
      verified: true,
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
 * Reenvío de correo de verificación
 */
export const resendVerification = async (req, res, next) => {
  try {
    const rawEmail = req.body?.correo || req.user?.correo;

    if (!rawEmail) {
      return res.status(400).json({ error: 'Debes proporcionar un correo electrónico.' });
    }

    const cleanCorreo = rawEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanCorreo)) {
      return res.status(400).json({ error: 'El formato del correo electrónico no es válido.' });
    }

    const userResult = await query(
      'SELECT id, nombre, correo, correo_verificado FROM usuario WHERE LOWER(correo) = $1',
      [cleanCorreo]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró ninguna cuenta registrada con este correo.' });
    }

    const user = userResult.rows[0];

    if (user.correo_verificado) {
      return res.status(400).json({
        error: 'Este correo ya se encuentra verificado.',
        alreadyVerified: true
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_default';
    const verificationToken = jwt.sign(
      {
        id: user.id,
        correo: user.correo,
        type: 'verify_email'
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    await sendVerificationEmail(user.correo, user.nombre, verificationToken);

    return res.status(200).json({
      message: 'Correo de verificación reenviado exitosamente. Por favor revisa tu bandeja de entrada.',
      verificationToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Solicitar recuperación de contraseña (¿Olvidaste tu contraseña?)
 * Implementa el caso de uso 'Recuperar contraseña' y el método 'recuperarContrasena()' del diagrama UML
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { correo } = req.body;
    if (!correo || typeof correo !== 'string') {
      return res.status(400).json({ error: 'Debes ingresar tu correo electrónico.' });
    }

    const cleanCorreo = correo.trim().toLowerCase();
    if (!cleanCorreo || !EMAIL_REGEX.test(cleanCorreo)) {
      return res.status(400).json({ error: 'El formato del correo electrónico no es válido.' });
    }

    const result = await query(
      'SELECT id, nombre, correo FROM usuario WHERE LOWER(correo) = $1',
      [cleanCorreo]
    );

    // Si el usuario no existe, por seguridad se retorna una respuesta neutra
    if (result.rows.length === 0) {
      return res.status(200).json({
        message: 'Si el correo está registrado en VinCloud, recibirás las instrucciones para restablecer tu contraseña.'
      });
    }

    const user = result.rows[0];
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_default';

    // Generar token JWT de recuperación (1 hora de validez)
    const resetToken = jwt.sign(
      {
        id: user.id,
        correo: user.correo,
        type: 'reset_password'
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    await sendPasswordResetEmail(user.correo, user.nombre, resetToken).catch((err) => {
      console.error('⚠️ [EmailService] Error al enviar correo de restablecimiento:', err.message);
    });

    return res.status(200).json({
      message: 'Se han enviado las instrucciones para restablecer tu contraseña a tu correo electrónico.',
      resetToken // Disponible para pruebas en desarrollo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restablecer contraseña mediante token de recuperación
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, nuevaContrasena, contrasena } = req.body;
    const passwordToSet = nuevaContrasena || contrasena;

    if (!token) {
      return res.status(400).json({ error: 'Debes proporcionar el token de restablecimiento.' });
    }

    if (!passwordToSet || typeof passwordToSet !== 'string' || passwordToSet.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_default';

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtErr) {
      const msg = jwtErr.name === 'TokenExpiredError'
        ? 'El enlace o código de recuperación ha expirado. Por favor solicita uno nuevo.'
        : 'El código o token de recuperación no es válido.';
      return res.status(400).json({ error: msg });
    }

    if (decoded.type !== 'reset_password' || !decoded.id) {
      return res.status(400).json({
        error: 'El token proporcionado no corresponde a una solicitud de restablecimiento de contraseña.'
      });
    }

    // Hashear la nueva contraseña
    const saltRounds = 10;
    const contrasenaHash = await bcrypt.hash(passwordToSet, saltRounds);

    const updateResult = await query(
      'UPDATE usuario SET contrasena_hash = $1 WHERE id = $2 RETURNING id, correo, nombre',
      [contrasenaHash, decoded.id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró el usuario para actualizar la contraseña.' });
    }

    return res.status(200).json({
      message: 'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
    });
  } catch (error) {
    next(error);
  }
};


