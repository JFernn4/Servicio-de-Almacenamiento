import { DEFAULT_STORAGE_QUOTA_GB } from '../config/constants.js';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Contenido (asunto, texto y HTML) del correo de bienvenida.
 */
export function welcomeEmail({ correo, nombre }) {
  const safeNombre = escapeHtml(nombre);
  const safeCorreo = escapeHtml(correo);
  const quota = `${DEFAULT_STORAGE_QUOTA_GB} GB`;

  return {
    subject: '¡Bienvenido a VinCloud! Tu cuenta está lista 🚀',
    text: `¡Hola ${nombre}!\n\nTu cuenta en VinCloud ha sido creada exitosamente con el correo ${correo}.\nYa cuentas con ${quota} de almacenamiento en la nube disponibles.\n\nSaludos,\nEl equipo de VinCloud.`,
    html: `
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
          <div class="greeting">¡Hola, ${safeNombre}! 👋</div>
          <p class="text">
            Te confirmamos que tu cuenta ha sido creada con éxito. Desde este momento tienes acceso completo a tu espacio personal en la nube.
          </p>

          <div class="quota-box">
            <p style="margin: 0 0 6px 0; font-size: 13.5px; color: #3B0A1F;">
              <strong>Detalles de tu cuenta:</strong>
            </p>
            <p style="margin: 0; font-size: 13px; color: #475569;">
              • <strong>Correo registrado:</strong> ${safeCorreo}<br>
              • <strong>Capacidad inicial:</strong> ${quota} de almacenamiento gratuito<br>
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
  `,
  };
}
