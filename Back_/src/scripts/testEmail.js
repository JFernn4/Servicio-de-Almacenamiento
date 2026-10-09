import { config } from '../config/env.js';
import { sendEmail, isEmailConfigured } from '../services/emailService.js';

async function runEmailTest() {
  const recipient = process.env.TEST_EMAIL_RECIPIENT;

  console.log('📬 --- Prueba de correo SMTP ---');
  console.log(`Host: ${config.mail.host}:${config.mail.port}`);
  console.log('From:', config.mail.from);
  console.log('To:', recipient);

  if (!isEmailConfigured() || !recipient) {
    console.log('\n⚠️ Configura SMTP_PASS y TEST_EMAIL_RECIPIENT en Back_/.env y vuelve a ejecutar: npm run test:email');
    return;
  }

  try {
    const info = await sendEmail({
      to: recipient,
      subject: 'Prueba de VinCloud',
      text: 'Este es un correo de prueba.',
    });
    console.log('\n✅ Correo enviado. Message ID:', info.messageId);
  } catch (error) {
    console.error('\n❌ Error al enviar el correo:', error.message);
    process.exitCode = 1;
  }
}

runEmailTest();
