<<<<<<< HEAD
import { sendEmail, sendWelcomeEmail, sendVerificationEmail, isEmailConfigured } from '../services/emailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
=======
import { config } from '../config/env.js';
import { sendEmail, isEmailConfigured } from '../services/emailService.js';
>>>>>>> 5e07a74602692b66d05e3dd5f090a5a1cffb657b

import nodemailer from 'nodemailer';

async function runEmailTest() {
<<<<<<< HEAD
  const isPreview = process.argv.includes('--preview') || process.argv.includes('--ethereal');
  const isVerify = process.argv.includes('--verify') || process.argv.includes('--verification');
  const recipient = process.env.TEST_EMAIL_RECIPIENT || 'andresmaza2309@gmail.com';

  if (isPreview) {
    console.log('\n🧪 --- Modo Vista Previa Inmediata (Ethereal Email) ---');
    console.log('Generando cuenta temporal de prueba en Ethereal...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      const previewTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_token_prueba';
      const info = await previewTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'VinCloud <soporte@vincloud.com>',
        to: recipient,
        subject: isVerify ? 'Verifica tu cuenta en VinCloud ✉️' : '¡Bienvenido a VinCloud! Tu cuenta está lista 🚀',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #3B0A1F 0%, #7D1535 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0;">VinCloud</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.85;">${isVerify ? 'Verificación de Correo Electrónico' : 'Tu plataforma de almacenamiento seguro en la nube'}</p>
            </div>
            <div style="padding: 24px; color: #334155;">
              <h2 style="color: #3B0A1F;">¡Hola, Usuario de Prueba! 👋</h2>
              <p>${isVerify ? 'Gracias por registrarte. Haz clic en el botón para verificar tu cuenta:' : 'Tu cuenta ha sido creada exitosamente. Este es un correo de prueba de diseño.'}</p>
              ${isVerify ? `
                <div style="text-align: center; margin: 20px 0;">
                  <a href="http://localhost:5000/api/auth/verify?token=${sampleToken}" style="background-color: #7D1535; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Verificar mi correo</a>
                </div>
                <p style="font-size: 12px; color: #64748B;">Token: <code>${sampleToken}</code></p>
              ` : `
                <div style="background-color: #FDF2F4; border-left: 4px solid #7D1535; padding: 12px 16px; margin: 16px 0;">
                  <p style="margin: 0;"><strong>Destinatario:</strong> ${recipient}</p>
                  <p style="margin: 0;"><strong>Capacidad:</strong> 5 GB disponibles</p>
                </div>
              `}
            </div>
          </div>
        `,
      });

      console.log('\n✅ ¡Correo enviado exitosamente a Ethereal!');
      console.log('🔗 Abre este enlace en tu navegador para ver el correo renderizado:');
      console.log('👉', nodemailer.getTestMessageUrl(info));
      console.log('');
      return;
    } catch (err) {
      console.error('Error generando prueba Ethereal:', err);
      return;
    }
  }

  console.log('📬 --- Mailtrap / SMTP Email Test ---');
  console.log('Host:', process.env.SMTP_HOST || 'live.smtp.mailtrap.io');
  console.log('Port:', process.env.SMTP_PORT || 587);
  console.log('User:', process.env.SMTP_USER || 'api');
  console.log('From:', process.env.EMAIL_FROM || 'Private Person <hello@vin.cloud.com>');
  console.log('To:', recipient);

  if (!isEmailConfigured()) {
    console.log('\n⚠️ Atención: Falta configurar tu contraseña o API Token en Back_/.env');
    console.log('Asegúrate de definir SMTP_PASS en tu archivo Back_/.env:');
    console.log('  SMTP_PASS=<tu_token_o_password>');
    console.log('\nUna vez configurado, ejecuta nuevamente: npm run test:email');
    process.exit(0);
  }

  console.log(`\n🚀 Enviando correo de ${isVerify ? 'verificación' : 'bienvenida'} de prueba a través de SMTP configurado...`);

  try {
    const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token_de_prueba_verificacion';
    const info = isVerify 
      ? await sendVerificationEmail(recipient, 'Usuario de Prueba', sampleToken)
      : await sendWelcomeEmail(recipient, 'Usuario de Prueba');

    console.log('\n✅ ¡Prueba completada con éxito!');
    console.log('Message ID:', info.messageId);
    console.log('\n🔎 Puedes revisar tu bandeja de entrada o tus registros en el proveedor SMTP.\n');
  } catch (error) {
    console.error('\n❌ Error al enviar el correo:', error.message);
    if (error.response) {
      console.error('Detalles del servidor SMTP:', error.response);
    }

    if (error.message && error.message.includes('Domain DNS records have not been verified')) {
      console.log('\n💡 [CAUSA]: Estás usando Mailtrap "Sending" (live.smtp.mailtrap.io), el cual exige');
      console.log('   que el dominio del remitente ("hello@vin.cloud.com") esté verificado en Mailtrap mediante DNS.');
      console.log('\n👉 [SOLUCIONES]:');
      console.log('   1. Para pruebas de desarrollo (Sandbox): Usa Mailtrap "Email Testing" (sandbox.smtp.mailtrap.io).');
      console.log('      Obtén las credenciales en Mailtrap -> Email Testing -> Inboxes -> Nodemailer.');
      console.log('   2. Para recibir un correo real en tu cuenta personal: Configura Gmail SMTP en Back_/.env:');
      console.log('      SMTP_HOST=smtp.gmail.com');
      console.log('      SMTP_PORT=465');
      console.log('      SMTP_USER=tu_correo@gmail.com');
      console.log('      SMTP_PASS=tu_contraseña_de_aplicacion_google');
      console.log('   3. Para previsualizar el diseño en tu navegador sin configurar nada:');
      console.log('      node src/scripts/testEmail.js --preview\n');
    }
=======
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
>>>>>>> 5e07a74602692b66d05e3dd5f090a5a1cffb657b
  }
}

runEmailTest();

