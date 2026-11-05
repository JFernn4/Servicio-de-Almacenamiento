import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { welcomeEmail } from '../templates/welcomeEmail.js';
import { verificationEmail } from '../templates/verificationEmail.js';
import { passwordResetEmail } from '../templates/passwordResetEmail.js';
import { shareInvitationEmail } from '../templates/shareInvitationEmail.js';

const port = Number(config.mail.port) || 587;

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port,
  secure: port === 465,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

/**
 * Indica si hay credenciales SMTP reales. Los valores de ejemplo de
 * .env.example van entre < > (p. ej. <TU_API_TOKEN_O_CONTRASENA>).
 */
export function isEmailConfigured() {
  return Boolean(config.mail.pass) && !config.mail.pass.startsWith('<');
}

/**
 * Envía un correo electrónico a través del transporte SMTP.
 */
export async function sendEmail({ to, subject, text, html }) {
  if (!isEmailConfigured()) {
    console.warn(`[EmailService] ⚠️ SMTP_PASS no configurado: correo hacia "${to}" omitido.`);
    return { simulated: true };
  }

  console.log(`[EmailService] 🚀 Enviando correo ("${subject}") a "${to}" a través de SMTP (${config.mail.host}:${port})...`);
  try {
    const info = await transporter.sendMail({
      from: config.mail.from,
      to,
      subject,
      text,
      html,
    });
    console.log(`[EmailService] ✅ Correo entregado al servidor SMTP para "${to}". Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EmailService] ❌ Error SMTP al enviar a "${to}":`, error.message);
    throw error;
  }
}

/**
 * Enlace del frontend que abre una pantalla con el token del correo.
 */
const frontendLink = (mode, token) =>
  `${config.frontendUrl}?mode=${mode}&token=${encodeURIComponent(token)}`;

/**
 * Muestra el enlace directamente en consola para facilitar pruebas y desarrollo,
 * garantizando que nunca se bloquee el flujo aunque el proveedor SMTP filtre a spam o demore.
 */
function logActionLink(label, to, url) {
  console.log(`\n============================================================`);
  console.log(`✉️  [VinCloud Correo] Enlace de ${label} para: ${to}`);
  console.log(`🔗  ${url}`);
  console.log(`============================================================\n`);
}

export function sendWelcomeEmail(correo, nombre) {
  return sendEmail({ to: correo, ...welcomeEmail({ correo, nombre }) });
}

export function sendVerificationEmail(correo, nombre, token) {
  const verificationUrl = frontendLink('verify-email', token);
  logActionLink('Verificación de Cuenta', correo, verificationUrl);
  return sendEmail({ to: correo, ...verificationEmail({ nombre, verificationUrl }) });
}

export function sendPasswordResetEmail(correo, nombre, token) {
  const resetUrl = frontendLink('reset-password', token);
  logActionLink('Recuperación de Contraseña', correo, resetUrl);
  return sendEmail({ to: correo, ...passwordResetEmail({ nombre, resetUrl }) });
}

export function sendShareInvitationEmail({ correoDestinatario, nombreDestinatario, nombreRemitente, nombreArchivo, token }) {
  const shareUrl = frontendLink('shared-file', token);
  logActionLink('Invitación a Archivo Compartido', correoDestinatario, shareUrl);
  return sendEmail({
    to: correoDestinatario,
    ...shareInvitationEmail({ nombreDestinatario, nombreRemitente, nombreArchivo, shareUrl }),
  });
}
