import React from 'react';
import Icon from '../../components/ui/Icon';
import { colors } from '../../styles/theme';

function LandingCTA({ onGoToRegister }) {
  return (
    <section
      style={{
        position: 'relative',
        background: 'transparent',
        color: '#FFFFFF',
        padding: '110px 24px',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(241, 245, 249, 0.12)',
            color: colors.border,
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            marginBottom: 24,
            textTransform: 'uppercase',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Icon name="sparkles" size={14} color={colors.border} />
          Comienza en menos de 1 minuto
        </div>

        <h2
          style={{
            fontSize: 'clamp(32px, 4.5vw, 52px)',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: '0 auto 20px',
            lineHeight: 1.15,
            letterSpacing: '-1px',
          }}
        >
          Lleva tu espacio de trabajo al siguiente nivel con VinCloud
        </h2>

        <p
          style={{
            fontSize: 'clamp(16px, 1.8vw, 18px)',
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: 580,
            margin: '0 auto 36px',
            lineHeight: 1.6,
          }}
        >
          Crea tu cuenta gratuita hoy y disfruta de 15 GB de almacenamiento seguro en la nube con acceso desde cualquier lugar.
        </p>

        <button
          type="button"
          onClick={onGoToRegister}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: colors.primary,
            color: '#FFFFFF',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            borderRadius: 14,
            padding: '16px 36px',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
            transition: 'transform 0.2s ease, background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.background = '#9A1B43';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = colors.primary;
          }}
        >
          <span>Crear cuenta gratuita ahora</span>
          <Icon name="arrowRight" size={18} color="#FFFFFF" strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
}

export default LandingCTA;
