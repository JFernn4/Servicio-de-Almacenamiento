import React from 'react';
import BrandLogo from '../../components/ui/BrandLogo';
import { colors } from '../../styles/theme';

function LandingFooter({ onGoToLogin, onGoToRegister }) {
  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <footer style={{ background: colors.footerDark, color: colors.surface, padding: '60px 24px 36px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 40,
            paddingBottom: 40,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Columna Logo y misión */}
          <div style={{ maxWidth: 340 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: colors.primary,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={colors.surface}>
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: colors.surface }}>VinCloud</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6, margin: 0 }}>
              Servicio de almacenamiento inteligente, rápido y seguro. Protege tus fotos, documentos y proyectos con tecnología en la nube de alta disponibilidad.
            </p>
          </div>

          {/* Columna Navegación */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              Navegación
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.65)', cursor: 'pointer' }}
              >
                Inicio
              </span>
              <span
                onClick={() => scrollToSection('caracteristicas')}
                style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.65)', cursor: 'pointer' }}
              >
                Características
              </span>
              <span
                onClick={() => scrollToSection('seguridad')}
                style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.65)', cursor: 'pointer' }}
              >
                Seguridad AES-256
              </span>
              <span
                onClick={() => scrollToSection('planes')}
                style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.65)', cursor: 'pointer' }}
              >
                Planes y Precios
              </span>
            </div>
          </div>

          {/* Columna Cuenta */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              Acceso
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span onClick={onGoToLogin} style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.65)', cursor: 'pointer' }}>
                Iniciar sesión
              </span>
              <span onClick={onGoToRegister} style={{ fontSize: 14, color: '#F472B6', fontWeight: 600, cursor: 'pointer' }}>
                Crear cuenta gratis (15 GB)
              </span>
            </div>
          </div>
        </div>

        {/* Barra inferior de créditos */}
        <div
          style={{
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.45)',
          }}
        >
          <div>
            © 2026 VinCloud. Todos los derechos reservados. Proyecto de Ingeniería de Software.
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <span>Términos de Servicio</span>
            <span>Política de Privacidad</span>
            <span>Seguridad</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
