import { escapeHtml } from '../utils/escapeHtml.js';

/**
 * HTML común de los correos con un botón de acción (verificar cuenta, restablecer contraseña).
 * `url` la genera el backend; `nombre` viene del usuario y se escapa aquí.
 * `noteHtml` y `footerNote` son opcionales.
 */
export function actionEmailLayout({ title, nombre, intro, buttonLabel, url, noteHtml = '', footerNote = '' }) {
  return `
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
          <h1>${title}</h1>
          <p>Servicio de Almacenamiento Seguro</p>
        </div>
        <div class="body">
          <div class="greeting">Hola, ${escapeHtml(nombre)}</div>
          <p class="text">${intro}</p>
          <div class="btn-container">
            <a href="${url}" class="btn" target="_blank">${buttonLabel}</a>
          </div>
          <p class="link-text">
            Si el boton no funciona, copia y pega este enlace en tu navegador:<br>
            ${url}
          </p>
          ${noteHtml}
        </div>
        <div class="footer">
          (c) ${new Date().getFullYear()} VinCloud.${footerNote ? ` ${footerNote}` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}
