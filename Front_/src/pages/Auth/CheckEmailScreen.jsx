import { useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import TextButton from '../../components/ui/TextButton';
import { colors } from '../../styles/theme';
import { resendVerification } from '../../services/authService';

/**
 * Pantalla mostrada inmediatamente después del registro para pedir al usuario
 * que confirme su correo electrónico antes de ingresar a la plataforma.
 */
function CheckEmailScreen({ email, onGoToLogin, onGoToRegister, onGoToHome }) {
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  async function handleResend() {
    if (!email) {
      setResendStatus({ type: 'error', message: 'No se especificó un correo para reenviar.' });
      return;
    }

    setResending(true);
    setResendStatus(null);
    try {
      const data = await resendVerification(email);
      setResendStatus({
        type: 'success',
        message: data.message || 'Correo reenviado. Revisa tu bandeja de entrada o spam.',
      });
    } catch (err) {
      setResendStatus({ type: 'error', message: err.message });
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Casi terminamos"
      title="Verifica tu correo"
      subtitle="Te enviamos un enlace de confirmación para activar tu cuenta y proteger tu espacio."
      footer={
        <>
          ¿Te equivocaste al escribir tu correo?{' '}
          <TextButton onClick={onGoToRegister}>Volver al registro</TextButton>
        </>
      }
      onGoToHome={onGoToHome}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
        {/* Ícono central de correo */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: colors.primarySoft,
            border: `2px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(125, 21, 53, 0.12)',
          }}
        >
          <Icon name="mail" size={30} color={colors.primary} />
        </div>

        <div style={{ width: '100%', textAlign: 'left' }}>
          <Alert type="success">
            Hemos enviado un correo de verificación a{' '}
            <strong style={{ color: colors.primaryDark }}>{email || 'tu bandeja de entrada'}</strong>.
          </Alert>
        </div>

        {resendStatus && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <Alert type={resendStatus.type}>{resendStatus.message}</Alert>
          </div>
        )}

        {/* Pasos de ayuda */}
        <div
          style={{
            width: '100%',
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: '16px 18px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: colors.primaryDark, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Pasos para activar tu cuenta:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: colors.muted }}>
            <Icon name="check" size={14} color={colors.successDark} strokeWidth={3} />
            <span>1. Abre tu bandeja de entrada o la carpeta de <strong>Spam / Correo no deseado</strong>.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: colors.muted }}>
            <Icon name="check" size={14} color={colors.successDark} strokeWidth={3} />
            <span>2. Busca el mensaje de confirmación de <strong>VinCloud</strong>.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: colors.muted }}>
            <Icon name="check" size={14} color={colors.successDark} strokeWidth={3} />
            <span>3. Haz clic en el enlace para verificar tu cuenta y luego inicia sesión.</span>
          </div>
          <div style={{ fontSize: 12, color: colors.subtle, marginTop: 4, fontStyle: 'italic' }}>
            💡 En entorno local, el enlace de verificación también se imprime directamente en la consola del servidor backend.
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button onClick={onGoToLogin} style={{ width: '100%', padding: 13, fontSize: 14 }}>
            Ir a iniciar sesión
          </Button>
          <button
            type="button"
            disabled={resending}
            onClick={handleResend}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: colors.primary,
              cursor: resending ? 'not-allowed' : 'pointer',
              opacity: resending ? 0.6 : 1,
            }}
          >
            {resending ? 'Reenviando...' : '¿No recibiste el correo? Reenviar verificación'}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default CheckEmailScreen;
