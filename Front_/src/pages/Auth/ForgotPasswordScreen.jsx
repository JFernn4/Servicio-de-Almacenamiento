import { useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import FieldInput from '../../components/ui/FieldInput';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import SubmitButton from '../../components/ui/SubmitButton';
import TextButton from '../../components/ui/TextButton';
import { colors } from '../../styles/theme';
import { forgotPassword } from '../../services/authService';

function ForgotPasswordScreen({ onGoToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setSuccessMsg(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Recupera el acceso"
      title="Recuperar contraseña"
      subtitle="Ingresa el correo asociado a tu cuenta para recibir un enlace de recuperación."
      footer={<>¿Recordaste tu contraseña? <TextButton onClick={onGoToLogin}>Inicia sesión</TextButton></>}
    >
      {successMsg ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Alert type="success">{successMsg}</Alert>
          <p style={{ fontSize: 12.5, color: colors.muted, lineHeight: 1.5, margin: 0 }}>
            Revisa tu bandeja de entrada o spam y abre el enlace recibido para definir tu nueva contraseña.
          </p>
          <Button onClick={onGoToLogin} style={{ padding: 12, fontSize: 14 }}>Volver al inicio de sesión</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <FieldInput label="Correo electrónico" icon="mail" type="email" value={email} onChange={setEmail} placeholder="nombre@empresa.com" autoComplete="email" />
          {error && <Alert>{error}</Alert>}
          <SubmitButton loading={loading} label="Enviar enlace de recuperación" loadingLabel="Enviando..." />
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordScreen;
