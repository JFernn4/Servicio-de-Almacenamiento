import { useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import FieldInput from '../../components/ui/FieldInput';
import Alert from '../../components/ui/Alert';
import SubmitButton from '../../components/ui/SubmitButton';
import TextButton from '../../components/ui/TextButton';
import { login, resendVerification } from '../../services/authService';
import { colors } from '../../styles/theme';

function LoginScreen({ onLogin, onGoToRegister, onGoToForgotPassword, onGoToHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resendNotice, setResendNotice] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setError('');
    setResendNotice('');
    setLoading(true);

    try {
      onLogin(await login(email, password));
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      const res = await resendVerification(email);
      setResendNotice(res.message || 'Correo de verificación reenviado exitosamente.');
    } catch (err) {
      setResendNotice(err.message);
    }
  }

  const isUnverified = error.toLowerCase().includes('verificar tu correo');

  return (
    <AuthLayout
      eyebrow="Bienvenido de nuevo"
      title={<>Inicia sesión en<br />VinCloud</>}
      subtitle="Continúa donde lo dejaste. Tus archivos están listos para ti."
      legalText="Al continuar"
      footer={<>¿Aún no tienes una cuenta? <TextButton onClick={onGoToRegister}>Crear cuenta</TextButton></>}
      onGoToHome={onGoToHome}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FieldInput label="Correo electrónico" icon="mail" type="email" value={email} onChange={setEmail} placeholder="nombre@empresa.com" autoComplete="email" />
        <FieldInput
          label="Contraseña"
          icon="lock"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Ingresa tu contraseña"
          autoComplete="current-password"
          labelAction={<TextButton onClick={onGoToForgotPassword} style={{ fontSize: 12 }}>¿Olvidaste tu contraseña?</TextButton>}
        />
        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Alert>{error}</Alert>
            {isUnverified && (
              <div style={{ textAlign: 'center' }}>
                <TextButton type="button" onClick={handleResend} style={{ fontSize: 12.5, fontWeight: 700 }}>
                  ¿Reenviar correo de confirmación?
                </TextButton>
                {resendNotice && (
                  <div style={{ fontSize: 12, color: colors.successDark, marginTop: 4, fontWeight: 600 }}>
                    {resendNotice}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <SubmitButton loading={loading} label="Iniciar sesión" loadingLabel="Ingresando..." />
      </form>
    </AuthLayout>
  );
}

export default LoginScreen;
