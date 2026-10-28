import React from 'react';
import LandingNavbar from './LandingNavbar';
import LandingHero from './LandingHero';
import LandingFeatures from './LandingFeatures';
import LandingPlans from './LandingPlans';
import LandingCTA from './LandingCTA';
import LandingFooter from './LandingFooter';
import { colors } from '../../styles/theme';

function LandingScreen({ onGoToLogin, onGoToRegister }) {
  function handleExplore() {
    const el = document.getElementById('caracteristicas');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: colors.bgDark, position: 'relative' }}>
      {/* Fondo animado fluido con ondas SVG (el mismo estilo y movimiento de las pantallas de autenticación) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          overflow: 'hidden',
          backgroundColor: colors.bgDark,
          pointerEvents: 'none',
        }}
      >
        <svg viewBox="0 0 1440 810" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path fill="#250612">
            <animate
              attributeName="d"
              dur="15s"
              repeatCount="indefinite"
              values="M0,0 C300,200 500,600 800,810 L0,810 Z;
                      M0,0 C450,150 400,700 900,810 L0,810 Z;
                      M0,0 C300,200 500,600 800,810 L0,810 Z"
            />
          </path>
          <path fill="#2D0615">
            <animate
              attributeName="d"
              dur="20s"
              repeatCount="indefinite"
              values="M1440,0 C1100,100 900,500 600,810 L1440,810 Z;
                      M1440,0 C1200,200 800,600 500,810 L1440,810 Z;
                      M1440,0 C1100,100 900,500 600,810 L1440,810 Z"
            />
          </path>
          <path fill="#36081A">
            <animate
              attributeName="d"
              dur="12s"
              repeatCount="indefinite"
              values="M1440,400 C1100,500 1200,810 900,810 L1440,810 Z;
                      M1440,300 C1000,400 1300,700 800,810 L1440,810 Z;
                      M1440,400 C1100,500 1200,810 900,810 L1440,810 Z"
            />
          </path>
          <path fill="#3B0A1F" opacity="0.8">
            <animate
              attributeName="d"
              dur="18s"
              repeatCount="indefinite"
              values="M0,300 C200,400 100,700 400,810 L0,810 Z;
                      M0,200 C300,300 200,600 500,810 L0,810 Z;
                      M0,300 C200,400 100,700 400,810 L0,810 Z"
            />
          </path>
        </svg>
      </div>

      {/* Estilos embebidos para animaciones estilo Dropbox y responsive */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(-1.5deg);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-14px) rotate(1.5deg);
          }
        }

        .bento-card {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bento-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
        }

        @media (max-width: 900px) {
          .landing-nav-links {
            display: none !important;
          }
          .bento-card {
            grid-column: span 12 !important;
          }
          .floating-card-1, .floating-card-2, .floating-card-3 {
            display: none !important;
          }
        }
      `}</style>

      {/* Contenido principal sobre el fondo animado */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Barra de navegación superior fija */}
        <LandingNavbar onGoToLogin={onGoToLogin} onGoToRegister={onGoToRegister} />

        {/* Sección Hero con titulares y mockup animado */}
        <LandingHero onGoToRegister={onGoToRegister} onExplore={handleExplore} />

        {/* Cuadrícula Bento de características principales */}
        <LandingFeatures />

        {/* Planes de almacenamiento */}
        <LandingPlans onGoToRegister={onGoToRegister} />

        {/* CTA Final */}
        <LandingCTA onGoToRegister={onGoToRegister} />

        {/* Pie de página */}
        <LandingFooter onGoToLogin={onGoToLogin} onGoToRegister={onGoToRegister} />
      </div>
    </div>
  );
}

export default LandingScreen;
