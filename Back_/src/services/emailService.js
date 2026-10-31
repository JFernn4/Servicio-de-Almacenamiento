import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { welcomeEmail } from '../templates/welcomeEmail.js';
import { verificationEmail } from '../templates/verificationEmail.js';
import { passwordResetEmail } from '../templates/passwordResetEmail.js';
import { shareInvitationEmail } from '../templates/shareInvitationEmail.js';

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
  return Boolean(config.mail.pass) && !config.mail.pass.startsWith('<');
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

export function sendShareInvitationEmail({ correoDestinatario, nombreDestinatario, nombreRemitente, nombreArchivo, token }) {
  const shareUrl = frontendLink('shared-file', token);
  logSimulatedLink('Invitacion a Archivo', correoDestinatario, shareUrl);
  return sendEmail({
    to: correoDestinatario,
    ...shareInvitationEmail({ nombreDestinatario, nombreRemitente, nombreArchivo, shareUrl }),
  });
}
