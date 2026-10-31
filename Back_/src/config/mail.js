import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Mailtrap SMTP Transporter
 * Configurado según el patrón de conexión del proyecto (Back_/src/config)
 */
const port = parseInt(process.env.SMTP_PORT, 10) || 587;

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'live.smtp.mailtrap.io',
  port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER || 'api',
    pass: process.env.SMTP_PASS, 
  },
});

export default transporter;
