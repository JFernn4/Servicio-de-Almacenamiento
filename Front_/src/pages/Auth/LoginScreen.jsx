import { useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import FieldInput from '../../components/ui/FieldInput';
import ErrorBanner from '../../components/ui/ErrorBanner';
import SubmitButton from '../../components/ui/SubmitButton';
import TextButton from '../../components/ui/TextButton';
import { login } from '../../services/authService';

function LoginScreen({ onLogin, onGoToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      onLogin(await login(email, password));
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Bienvenido de nuevo"
      title={<>Inicia sesión en<br />VinCloud</>}
      subtitle="Continúa donde lo dejaste. Tus archivos están listos para ti."
      legalText="Al continuar"
      footer={<>¿Aún no tienes una cuenta? <TextButton onClick={onGoToRegister}>Crear cuenta</TextButton></>}
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
          labelAction={<TextButton style={{ fontSize: 12 }}>¿Olvidaste tu contraseña?</TextButton>}
        />
        {error && <ErrorBanner msg={error} />}
        <SubmitButton loading={loading} label="Iniciar sesión" loadingLabel="Ingresando..." />
      </form>
    </AuthLayout>
  );
}

export default LoginScreen;
