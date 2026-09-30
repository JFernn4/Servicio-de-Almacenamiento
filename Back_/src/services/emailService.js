import transporter from '../config/mail.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Verifica si las credenciales de Mailtrap están listas para enviar correos
 */
export function isEmailConfigured() {
  const pass = process.env.SMTP_PASS;
  return Boolean(pass && pass !== '<YOUR_API_TOKEN>' && pass !== 'tu_password_mailtrap');
}

/**
 * Enviar correo electrónico genérico usando Mailtrap SMTP
 * Adaptado de la muestra oficial de Mailtrap
 * @param {Object} options
 * @param {string} [options.from] - Remitente (opcional, usa EMAIL_FROM por defecto)
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto del correo
 * @param {string} options.text - Contenido en texto plano
 * @param {string} [options.html] - Contenido HTML opcional
 */
export async function sendEmail({ from, to, subject, text, html }) {
  if (!isEmailConfigured()) {
    console.warn(
      `⚠️ [Mailtrap] Simulación: Correo hacia "${to}" no enviado. Debes configurar SMTP_PASS con tu API Token en Back_/.env`
    );
    return { simulated: true, messageId: 'simulated-id' };
  }

  const sender = from || process.env.EMAIL_FROM || 'Private Person <hello@vin.cloud.com>';

  try {
    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });

    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ [Mailtrap] Error al enviar correo:', error);
    throw error;
  }
}

/**
 * Enviar notificación de bienvenida a un usuario registrado
 * @param {string} destinatario - Correo del usuario
 * @param {string} nombre - Nombre completo del usuario
 */
export async function sendWelcomeEmail(destinatario, nombre) {
  const subject = '¡Bienvenido a VinCloud! Tu cuenta está lista 🚀';
  const text = `¡Hola ${nombre}!\n\nTu cuenta en VinCloud ha sido creada exitosamente con el correo ${destinatario}.\nYa cuentas con 5 GB de almacenamiento en la nube disponibles.\n\nSaludos,\nEl equipo de VinCloud.`;

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
        .quota-box { background-color: #FDF2F4; border-left: 4px solid #7D1535; border-radius: 6px; padding: 16px 20px; margin: 24px 0; }
        .footer { background: #F1F5F9; padding: 18px 32px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Bienvenido a VinCloud!</h1>
          <p>Tu plataforma de almacenamiento seguro en la nube</p>
        </div>
        <div class="body">
          <div class="greeting">¡Hola, ${nombre}! 👋</div>
          <p class="text">
            Te confirmamos que tu cuenta ha sido creada con éxito. Desde este momento tienes acceso completo a tu espacio personal en la nube.
          </p>

          <div class="quota-box">
            <p style="margin: 0 0 6px 0; font-size: 13.5px; color: #3B0A1F;">
              <strong>Detalles de tu cuenta:</strong>
            </p>
            <p style="margin: 0; font-size: 13px; color: #475569;">
              • <strong>Correo registrado:</strong> ${destinatario}<br>
              • <strong>Capacidad inicial:</strong> 5 GB de almacenamiento gratuito<br>
              • <strong>Estado:</strong> Activo
            </p>
          </div>

          <p class="text">
            Ya puedes iniciar sesión en cualquier momento para gestionar, organizar y proteger tus archivos.
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
 * Enviar correo de verificacion de cuenta a un usuario registrado
 * @param {string} destinatario - Correo del usuario
 * @param {string} nombre - Nombre del usuario
 * @param {string} token - Token JWT de verificacion
 */
export async function sendVerificationEmail(destinatario, nombre, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${frontendUrl}?mode=verify-email&token=${encodeURIComponent(token)}`;

  const subject = 'Verifica tu cuenta en VinCloud';
  const text = `Hola ${nombre},\n\nGracias por registrarte en VinCloud. Por favor confirma tu correo electronico abriendo el siguiente enlace:\n${verificationUrl}\n\nEste enlace es valido por 24 horas.\n\nSaludos,\nEl equipo de VinCloud.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #1E293B; }
        .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(59, 10, 31, 0.05); }
        .header { background: linear-gradient(135deg, #3B0A1F 0%, #7D1535 100%); padding: 36px 32px; text-align: center; color: #FFFFFF; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.85; }
        .body { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; color: #3B0A1F; margin-bottom: 12px; }
        .text { font-size: 14.5px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; background-color: #7D1535; color: #FFFFFF !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; }
        .link-text { font-size: 12px; color: #94A3B8; word-break: break-all; margin-top: 15px; }
        .footer { background: #F1F5F9; padding: 18px 32px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verificacion de Cuenta</h1>
          <p>Servicio de Almacenamiento Seguro</p>
        </div>
        <div class="body">
          <div class="greeting">Hola, ${nombre}</div>
          <p class="text">
            Gracias por unirte a VinCloud. Para habilitar el acceso completo a tu espacio de almacenamiento, por favor confirma tu direccion de correo electronico haciendo clic en el siguiente boton:
          </p>
          <div class="btn-container">
            <a href="${verificationUrl}" class="btn" target="_blank">Verificar mi cuenta</a>
          </div>
          <p class="link-text">
            Si el boton no funciona, copia y pega este enlace en tu navegador:<br>
            ${verificationUrl}
          </p>
        </div>
        <div class="footer">
          (c) ${new Date().getFullYear()} VinCloud. Enlace valido por 24 horas.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!isEmailConfigured()) {
    console.log('[Simulacion de Correo] Enlace de Verificacion para ' + destinatario + ':');
    console.log(verificationUrl);
  }

  return sendEmail({
    to: destinatario,
    subject,
    text,
    html: htmlContent,
  });
}

/**
 * Enviar correo de restablecimiento de contrasena
 * @param {string} destinatario - Correo del usuario
 * @param {string} nombre - Nombre del usuario
 * @param {string} token - Token JWT de recuperacion
 */
export async function sendPasswordResetEmail(destinatario, nombre, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}?mode=reset-password&token=${encodeURIComponent(token)}`;

  const subject = 'Recuperacion de contrasena - VinCloud';
  const text = `Hola ${nombre},\n\nRecibimos una solicitud para restablecer la contrasena de tu cuenta en VinCloud.\nPuedes definir tu nueva contrasena abriendo el siguiente enlace:\n${resetUrl}\n\nEste enlace es valido por 30 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje.\n\nSaludos,\nEl equipo de VinCloud.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #1E293B; }
        .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(59, 10, 31, 0.05); }
        .header { background: linear-gradient(135deg, #3B0A1F 0%, #7D1535 100%); padding: 36px 32px; text-align: center; color: #FFFFFF; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.85; }
        .body { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; color: #3B0A1F; margin-bottom: 12px; }
        .text { font-size: 14.5px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; background-color: #7D1535; color: #FFFFFF !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; }
        .link-text { font-size: 12px; color: #94A3B8; word-break: break-all; margin-top: 15px; }
        .footer { background: #F1F5F9; padding: 18px 32px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recuperacion de Contrasena</h1>
          <p>Servicio de Almacenamiento Seguro</p>
        </div>
        <div class="body">
          <div class="greeting">Hola, ${nombre}</div>
          <p class="text">
            Recibimos una solicitud para restablecer la contrasena de tu cuenta en VinCloud. Para crear una nueva contrasena, haz clic en el siguiente boton:
          </p>
          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank">Restablecer mi contrasena</a>
          </div>
          <p class="link-text">
            Si el boton no funciona, copia y pega este enlace en tu navegador:<br>
            ${resetUrl}
          </p>
          <p class="text" style="font-size: 13px; color: #64748B; margin-top: 20px;">
            Este enlace expirara en 30 minutos. Si tu no solicitaste este cambio, puedes ignorar este correo de forma segura.
          </p>
        </div>
        <div class="footer">
          (c) ${new Date().getFullYear()} VinCloud.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!isEmailConfigured()) {
    console.log('[Simulacion de Correo] Enlace de Restablecimiento para ' + destinatario + ':');
    console.log(resetUrl);
  }

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
