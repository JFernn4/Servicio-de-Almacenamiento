import AuthLayout from '../../components/auth/AuthLayout';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import TextButton from '../../components/ui/TextButton';
import { colors } from '../../styles/theme';

/**
 * Pantalla mostrada inmediatamente después del registro para pedir al usuario
 * que confirme su correo electrónico antes de ingresar a la plataforma.
 */
function CheckEmailScreen({ email, onGoToLogin, onGoToRegister, onGoToHome }) {
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
            <span>1. Abre tu bandeja de entrada (o la carpeta de Spam / Promociones).</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: colors.muted }}>
            <Icon name="check" size={14} color={colors.successDark} strokeWidth={3} />
            <span>2. Busca el mensaje de confirmación de <strong>VinCloud</strong>.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: colors.muted }}>
            <Icon name="check" size={14} color={colors.successDark} strokeWidth={3} />
            <span>3. Haz clic en el enlace para verificar y luego inicia sesión.</span>
          </div>
        </div>

        <Button onClick={onGoToLogin} style={{ width: '100%', padding: 13, fontSize: 14 }}>
          Ir a iniciar sesión
        </Button>
      </div>
    </AuthLayout>
  );
}

export default CheckEmailScreen;

