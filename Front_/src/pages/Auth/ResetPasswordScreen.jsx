import { useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import FieldInput from '../../components/ui/FieldInput';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import SubmitButton from '../../components/ui/SubmitButton';
import TextButton from '../../components/ui/TextButton';
import { resetPassword } from '../../services/authService';

const MIN_PASSWORD_LENGTH = 6;

function validate({ token, password, confirm }) {
  if (!token) return 'Token de recuperación no válido o ausente.';
  if (!password || !confirm) return 'Por favor completa todos los campos.';
  if (password.length < MIN_PASSWORD_LENGTH) return `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (password !== confirm) return 'Las contraseñas no coinciden.';
  return '';
}

/**
 * Se abre desde el enlace del correo (?mode=reset-password&token=...)
 */
function ResetPasswordScreen({ token, onGoToLogin }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate({ token, password, confirm });
    setError(validationError);
    if (validationError) return;

    setLoading(true);
    try {
      const data = await resetPassword(token, password);
      setSuccessMsg(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Seguridad de tu cuenta"
      title="Nueva contraseña"
      subtitle="Define una nueva contraseña segura para tu cuenta."
      footer={<TextButton onClick={onGoToLogin}>Volver al inicio de sesión</TextButton>}
    >
      {successMsg ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Alert type="success">{successMsg}</Alert>
          <Button onClick={onGoToLogin} style={{ padding: 12, fontSize: 14 }}>Ir a iniciar sesión</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <FieldInput label="Nueva contraseña" icon="lock" type="password" value={password} onChange={setPassword} placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`} autoComplete="new-password" />
          <FieldInput label="Confirmar nueva contraseña" icon="lock" type="password" value={confirm} onChange={setConfirm} placeholder="Repite tu contraseña" autoComplete="new-password" />
          {error && <Alert>{error}</Alert>}
          <SubmitButton loading={loading} label="Guardar nueva contraseña" loadingLabel="Guardando..." />
        </form>
      )}
    </AuthLayout>
  );
}

export default ResetPasswordScreen;
