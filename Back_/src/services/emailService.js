import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { welcomeEmail } from '../templates/welcomeEmail.js';

const PLACEHOLDER_PASS = '<YOUR_API_TOKEN>';

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  auth: { user: config.mail.user, pass: config.mail.pass },
});

/**
 * Indica si hay un token SMTP real configurado (no el valor de ejemplo).
 */
export function isEmailConfigured() {
  return Boolean(config.mail.pass) && config.mail.pass !== PLACEHOLDER_PASS;
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

export function sendWelcomeEmail(correo, nombre) {
  return sendEmail({ to: correo, ...welcomeEmail({ correo, nombre }) });
}
