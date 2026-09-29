import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Mailtrap SMTP Transporter
 * Configurado según el patrón de conexión del proyecto (Back_/src/config)
 */
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'live.smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  auth: {
    user: process.env.SMTP_USER || 'api',
    pass: process.env.SMTP_PASS, // Token de API de Mailtrap (<YOUR_API_TOKEN>)
  },
});

export default transporter;
