import AuthBackground from './AuthBackground';
import BrandLogo from '../ui/BrandLogo';
import { colors } from '../../styles/theme';

/**
 * Estructura común de las pantallas de autenticación: fondo animado,
 * tarjeta con logo, encabezado, contenido (formulario) y pie.
 */
function AuthLayout({ eyebrow, title, subtitle, maxWidth = 460, footer, legalText, children }) {
  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 20 }}>
      <AuthBackground />

      <div
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: colors.card,
          borderRadius: 24,
          padding: 48,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <BrandLogo />
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, color: colors.primary, letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>
          {eyebrow}
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: colors.ink, margin: '0 0 12px', lineHeight: 1.1, letterSpacing: '-1px' }}>
          {title}
        </h2>
        <p style={{ fontSize: 14, color: colors.muted, margin: '0 0 32px', lineHeight: 1.5 }}>{subtitle}</p>

        {children}

        <p style={{ fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 28, marginBottom: 24 }}>{footer}</p>

        <p style={{ fontSize: 11, color: colors.subtle, textAlign: 'center', margin: 0 }}>
          {legalText}, aceptas nuestros <span style={{ color: colors.primary }}>Términos de servicio</span> y{' '}
          <span style={{ color: colors.primary }}>Política de privacidad</span>.
        </p>
      </div>
    </div>
  );
}

export default AuthLayout;
