import { sendEmail, isEmailConfigured } from '../services/emailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runEmailTest() {
  console.log('--- Prueba de Envio de Correo SMTP ---');
  console.log('Host:', process.env.SMTP_HOST || 'smtp-relay.brevo.com');
  console.log('Port:', process.env.SMTP_PORT || 587);
  console.log('User:', process.env.SMTP_USER);
  console.log('From:', process.env.EMAIL_FROM);
  
  const recipient = process.env.TEST_EMAIL_RECIPIENT || process.env.EMAIL_FROM;
  console.log('To:', recipient);

  if (!isEmailConfigured()) {
    console.log('\nAtencion: Falta configurar las credenciales SMTP en Back_/.env');
    process.exit(0);
  }

  console.log('\nEnviando correo de prueba a traves de SMTP...');

  try {
    const info = await sendEmail({
      from: process.env.EMAIL_FROM,
      to: recipient,
      subject: 'Prueba de Correo - VinCloud',
      text: 'Este es un mensaje de prueba exitoso enviado desde VinCloud a traves de Brevo SMTP.',
    });

    console.log('\nPrueba completada con exito.');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('\nError al enviar el correo:', error.message);
    if (error.response) {
      console.error('Detalles del servidor SMTP:', error.response);
    }
  }
}

runEmailTest();
