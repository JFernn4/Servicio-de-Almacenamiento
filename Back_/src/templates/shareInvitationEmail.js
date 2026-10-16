import { actionEmailLayout } from './actionEmailLayout.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export function shareInvitationEmail({ nombreDestinatario, nombreRemitente, nombreArchivo, shareUrl }) {
  const safeRemitente = escapeHtml(nombreRemitente);
  const safeArchivo = escapeHtml(nombreArchivo);

  return {
    subject: `${nombreRemitente} ha compartido un archivo contigo en VinCloud`,
    text: `Hola ${nombreDestinatario},\n\n${nombreRemitente} te ha invitado a visualizar y descargar el archivo "${nombreArchivo}" en VinCloud.\n\nAcepta la invitación en el siguiente enlace:\n${shareUrl}\n\nEste enlace estará disponible por 7 días.`,
    html: actionEmailLayout({
      title: 'VinCloud - Invitación a Archivo',
      nombre: nombreDestinatario,
      intro: `<strong>${safeRemitente}</strong> te ha enviado una invitación para visualizar y descargar el archivo <strong>"${safeArchivo}"</strong> en VinCloud.`,
      buttonLabel: 'Aceptar Invitación y Ver Archivo',
      url: shareUrl,
      footerNote: 'Este enlace de invitación es válido por 7 días.',
    }),
  };
}
