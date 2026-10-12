import { actionEmailLayout } from './actionEmailLayout.js';

/**
 * Correo con el enlace para verificar la cuenta (válido por 24 horas).
 */
export function verificationEmail({ nombre, verificationUrl }) {
  return {
    subject: 'Verifica tu cuenta en VinCloud',
    text: `Hola ${nombre},\n\nGracias por registrarte en VinCloud. Por favor confirma tu correo electronico abriendo el siguiente enlace:\n${verificationUrl}\n\nEste enlace es valido por 24 horas.\n\nSaludos,\nEl equipo de VinCloud.`,
    html: actionEmailLayout({
      title: 'Verificacion de Cuenta',
      nombre,
      intro: 'Gracias por unirte a VinCloud. Para habilitar el acceso completo a tu espacio de almacenamiento, por favor confirma tu direccion de correo electronico haciendo clic en el siguiente boton:',
      buttonLabel: 'Verificar mi cuenta',
      url: verificationUrl,
      footerNote: 'Enlace valido por 24 horas.',
    }),
  };
}
