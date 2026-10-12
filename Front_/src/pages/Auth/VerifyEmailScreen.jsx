import { useEffect, useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import TextButton from '../../components/ui/TextButton';
import { verifyEmail } from '../../services/authService';

const MISSING_TOKEN = { status: 'error', message: 'Token de verificación no proporcionado o inválido.' };
const VERIFYING = { status: 'verifying', message: 'Verificando tu correo electrónico...' };

/**
 * Se abre desde el enlace del correo (?mode=verify-email&token=...) y valida el token al cargar.
 * `onGoToDashboard` solo llega cuando hay una sesión abierta.
 */
function VerifyEmailScreen({ token, onGoToLogin, onGoToDashboard }) {
  const [result, setResult] = useState(token ? VERIFYING : MISSING_TOKEN);

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    verifyEmail(token).then(
      (data) => active && setResult({ status: 'success', message: data.message }),
      (err) => active && setResult({ status: 'error', message: err.message })
    );
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <AuthLayout
      eyebrow="Tu cuenta está lista para almacenar"
      title="Verificación de cuenta"
      subtitle="Confirmación de correo para acceso completo a la plataforma."
      footer={<TextButton onClick={onGoToLogin}>Volver al inicio de sesión</TextButton>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Alert type={result.status === 'verifying' ? 'info' : result.status}>{result.message}</Alert>

        {result.status === 'success' && (
          <Button onClick={onGoToDashboard || onGoToLogin} style={{ padding: 12, fontSize: 14 }}>
            Ir a mi espacio en la nube
          </Button>
        )}
        {result.status === 'error' && (
          <Button onClick={onGoToLogin} style={{ padding: 12, fontSize: 14 }}>Ir a iniciar sesión</Button>
        )}
      </div>
    </AuthLayout>
  );
}

export default VerifyEmailScreen;
