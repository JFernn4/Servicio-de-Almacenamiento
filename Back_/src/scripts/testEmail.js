import { sendEmail, isEmailConfigured } from '../services/emailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runEmailTest() {
  console.log('📬 --- Mailtrap SMTP Email Test ---');
  console.log('Host:', process.env.SMTP_HOST || 'live.smtp.mailtrap.io');
  console.log('Port:', process.env.SMTP_PORT || 587);
  console.log('User:', process.env.SMTP_USER || 'api');
  console.log('From:', process.env.EMAIL_FROM || 'Private Person <hello@vin.cloud.com>');
  
  const recipient = process.env.TEST_EMAIL_RECIPIENT || 'andresmaza2309@gmail.com';
  console.log('To:', recipient);

  if (!isEmailConfigured()) {
    console.log('\n⚠️ [Mailtrap] Atención: Falta configurar tu API Token en Back_/.env');
    console.log('Reemplaza el valor de SMTP_PASS por tu token real de Mailtrap:');
    console.log('  SMTP_PASS=<YOUR_API_TOKEN>');
    console.log('\nUna vez configurado, ejecuta nuevamente: npm run test:email');
    process.exit(0);
  }

  console.log('\n🚀 Enviando correo de prueba a través de Mailtrap SMTP...');

  try {
    const info = await sendEmail({
      from: process.env.EMAIL_FROM || 'Private Person <hello@vin.cloud.com>',
      to: recipient,
      subject: 'Hello from Mailtrap',
      text: 'This is a test e-mail message.',
    });

    console.log('\n✅ Prueba completada con éxito!');
    console.log('Message ID:', info.messageId);
    console.log('\n🔎 Puedes revisar el estado de entrega y registros de envío en:');
    console.log('👉 https://mailtrap.io/sending/email_logs\n');
  } catch (error) {
    console.error('\n❌ Error al enviar el correo:', error.message);
    if (error.response) {
      console.error('Detalles del servidor SMTP:', error.response);
    }
  }
}

runEmailTest();
