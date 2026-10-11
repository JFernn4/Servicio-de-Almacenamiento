import { actionEmailLayout } from './actionEmailLayout.js';

/**
 * Correo con el enlace para restablecer la contraseña (válido por 30 minutos).
 */
export function passwordResetEmail({ nombre, resetUrl }) {
  return {
    subject: 'Recuperacion de contrasena - VinCloud',
    text: `Hola ${nombre},\n\nRecibimos una solicitud para restablecer la contrasena de tu cuenta en VinCloud.\nPuedes definir tu nueva contrasena abriendo el siguiente enlace:\n${resetUrl}\n\nEste enlace es valido por 30 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje.\n\nSaludos,\nEl equipo de VinCloud.`,
    html: actionEmailLayout({
      title: 'Recuperacion de Contrasena',
      nombre,
      intro: 'Recibimos una solicitud para restablecer la contrasena de tu cuenta en VinCloud. Para crear una nueva contrasena, haz clic en el siguiente boton:',
      buttonLabel: 'Restablecer mi contrasena',
      url: resetUrl,
      noteHtml: `<p class="text" style="font-size: 13px; color: #64748B; margin-top: 20px;">
            Este enlace expirara en 30 minutos. Si tu no solicitaste este cambio, puedes ignorar este correo de forma segura.
          </p>`,
    }),
  };
}
