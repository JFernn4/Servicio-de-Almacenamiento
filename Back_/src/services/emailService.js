import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { welcomeEmail } from '../templates/welcomeEmail.js';
import { verificationEmail } from '../templates/verificationEmail.js';
import { passwordResetEmail } from '../templates/passwordResetEmail.js';

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  auth: { user: config.mail.user, pass: config.mail.pass },
});

/**
 * Indica si hay credenciales SMTP reales. Los valores de ejemplo de
 * .env.example van entre < > (p. ej. <TU_API_TOKEN_O_CONTRASENA>).
 */
export function isEmailConfigured() {
<<<<<<< HEAD
  const pass = process.env.SMTP_PASS;
  return Boolean(pass && pass !== '<YOUR_API_TOKEN>' && pass !== 'tu_password_mailtrap' && pass.trim() !== '');
=======
  return Boolean(config.mail.pass) && !config.mail.pass.startsWith('<');
>>>>>>> 5e07a74602692b66d05e3dd5f090a5a1cffb657b
}

/**
 * Envía un correo. Sin credenciales configuradas solo lo registra en consola.
 */
export async function sendEmail({ to, subject, text, html }) {
  if (!isEmailConfigured()) {
    console.warn(`[EmailService] SMTP_PASS no configurado: correo hacia "${to}" no enviado.`);
    return { simulated: true };
  }

  return transporter.sendMail({ from: config.mail.from, to, subject, text, html });
}

/**
 * Enlace del frontend que abre una pantalla con el token del correo.
 */
const frontendLink = (mode, token) =>
  `${config.frontendUrl}?mode=${mode}&token=${encodeURIComponent(token)}`;

/**
 * Sin SMTP configurado, muestra el enlace en consola para poder probar el flujo.
 */
function logSimulatedLink(label, to, url) {
  if (!isEmailConfigured()) {
    console.log(`[Simulacion de Correo] Enlace de ${label} para ${to}:`);
    console.log(url);
  }
}

<<<<<<< HEAD
/**
 * Enviar correo de verificación de cuenta con enlace y token
 * @param {string} destinatario - Correo del usuario
 * @param {string} nombre - Nombre completo del usuario
 * @param {string} token - Token JWT de verificación
 */
export async function sendVerificationEmail(destinatario, nombre, token) {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const verificationUrl = `${backendUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;

  const subject = 'Verifica tu cuenta en VinCloud ✉️';
  const text = `¡Hola ${nombre}!\n\nGracias por unirte a VinCloud. Para activar por completo tu cuenta y verificar tu dirección de correo electrónico, ingresa al siguiente enlace:\n\n${verificationUrl}\n\nSi te solicitan ingresar el token manualmente, tu código es:\n${token}\n\nEste enlace es válido por 24 horas.\n\nSaludos,\nEl equipo de VinCloud.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #1E293B; }
        .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(59, 10, 31, 0.05); }
        .header { background: linear-gradient(135deg, #3B0A1F 0%, #7D1535 100%); padding: 36px 32px; text-align: center; color: #FFFFFF; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.85; }
        .body { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; color: #3B0A1F; margin-bottom: 12px; }
        .text { font-size: 14.5px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .btn-container { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #7D1535; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.2px; }
        .token-box { background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 6px; padding: 12px; margin: 16px 0; word-break: break-all; font-family: monospace; font-size: 12px; color: #334155; }
        .footer { background: #F1F5F9; padding: 18px 32px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>VinCloud</h1>
          <p>Verificación de correo electrónico</p>
        </div>
        <div class="body">
          <div class="greeting">¡Hola, ${nombre}! 👋</div>
          <p class="text">
            Gracias por registrarte. Para verificar que esta dirección de correo te pertenece y activar todas las funciones de tu cuenta de almacenamiento, haz clic en el siguiente botón:
          </p>

          <div class="btn-container">
            <a href="${verificationUrl}" class="btn" target="_blank">Verificar mi correo</a>
          </div>

          <p class="text" style="font-size: 13px; color: #64748B;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${verificationUrl}" style="color: #7D1535; word-break: break-all;">${verificationUrl}</a>
          </p>

          <div style="margin-top: 24px;">
            <p style="font-size: 12.5px; color: #475569; margin-bottom: 6px;">
              <strong>Token de verificación:</strong>
            </p>
            <div class="token-box">${token}</div>
          </div>

          <p class="text" style="font-size: 12px; color: #94A3B8; margin-top: 20px;">
            Este enlace y token expiran en 24 horas. Si no solicitaste esta cuenta, puedes ignorar este mensaje.
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} VinCloud - Servicio de Almacenamiento.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: destinatario,
    subject,
    text,
    html: htmlContent,
  });
}

/**
 * Enviar correo de restablecimiento de contraseña con enlace y token
 * @param {string} destinatario - Correo del usuario
 * @param {string} nombre - Nombre completo del usuario
 * @param {string} token - Token JWT de restablecimiento
 */
export async function sendPasswordResetEmail(destinatario, nombre, token) {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const resetUrl = `http://localhost:5173/?resetToken=${encodeURIComponent(token)}`;

  const subject = 'Restablece tu contraseña en VinCloud 🔑';
  const text = `¡Hola ${nombre}!\n\nRecibimos una solicitud para restablecer la contraseña de tu cuenta en VinCloud (${destinatario}).\n\nPara crear una nueva contraseña, ingresa al siguiente enlace:\n${resetUrl}\n\nO ingresa el siguiente código token en la pantalla de recuperación:\n${token}\n\nEste enlace es válido por 1 hora. Si tú no realizaste esta solicitud, puedes ignorar este mensaje.\n\nSaludos,\nEl equipo de VinCloud.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #1E293B; }
        .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(59, 10, 31, 0.05); }
        .header { background: linear-gradient(135deg, #3B0A1F 0%, #7D1535 100%); padding: 36px 32px; text-align: center; color: #FFFFFF; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.85; }
        .body { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; color: #3B0A1F; margin-bottom: 12px; }
        .text { font-size: 14.5px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .btn-container { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #7D1535; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.2px; }
        .token-box { background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 6px; padding: 12px; margin: 16px 0; word-break: break-all; font-family: monospace; font-size: 12px; color: #334155; }
        .warning-text { font-size: 12.5px; color: #94A3B8; margin-top: 20px; line-height: 1.5; }
        .footer { background: #F1F5F9; padding: 18px 32px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>VinCloud</h1>
          <p>Recuperación de Contraseña</p>
        </div>
        <div class="body">
          <div class="greeting">¡Hola, ${nombre}! 👋</div>
          <p class="text">
            Hemos recibido una solicitud para restablecer la contraseña asociada a tu cuenta. Para continuar, haz clic en el siguiente botón:
          </p>

          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank">Restablecer mi contraseña</a>
          </div>

          <p class="text" style="font-size: 13px; color: #64748B;">
            Si el botón no funciona o prefieres ingresar el token manualmente en la aplicación, copia el siguiente código:
          </p>

          <div class="token-box">${token}</div>

          <p class="warning-text">
            Este enlace y token expiran en <strong>1 hora</strong> por tu seguridad. Si no realizaste esta solicitud, puedes ignorar este mensaje; tu cuenta permanece protegida.
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} VinCloud - Servicio de Almacenamiento.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: destinatario,
    subject,
    text,
    html: htmlContent,
  });
}

export default {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  isEmailConfigured,
};

=======
export function sendWelcomeEmail(correo, nombre) {
  return sendEmail({ to: correo, ...welcomeEmail({ correo, nombre }) });
}

export function sendVerificationEmail(correo, nombre, token) {
  const verificationUrl = frontendLink('verify-email', token);
  logSimulatedLink('Verificacion', correo, verificationUrl);
  return sendEmail({ to: correo, ...verificationEmail({ nombre, verificationUrl }) });
}

export function sendPasswordResetEmail(correo, nombre, token) {
  const resetUrl = frontendLink('reset-password', token);
  logSimulatedLink('Restablecimiento', correo, resetUrl);
  return sendEmail({ to: correo, ...passwordResetEmail({ nombre, resetUrl }) });
}
>>>>>>> 5e07a74602692b66d05e3dd5f090a5a1cffb657b
