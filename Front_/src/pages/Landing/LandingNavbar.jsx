import React, { useState, useEffect } from 'react';
import BrandLogo from '../../components/ui/BrandLogo';
import Button from '../../components/ui/Button';
import { colors } from '../../styles/theme';

function LandingNavbar({ onGoToLogin, onGoToRegister }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(31, 5, 14, 0.92)' : 'rgba(31, 5, 14, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}`,
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <BrandLogo light />
        </div>

        {/* Links centrales de navegación */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="landing-nav-links">
          <button
            type="button"
            onClick={() => scrollToSection('caracteristicas')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 0',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)')}
          >
            Características
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('seguridad')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 0',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)')}
          >
            Seguridad
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('planes')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 0',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)')}
          >
            Planes
          </button>
        </nav>

        {/* Acciones de Login y Registro */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={onGoToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: 8,
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            Iniciar sesión
          </button>

          <Button
            variant="primary"
            onClick={onGoToRegister}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(125, 21, 53, 0.4)',
            }}
          >
            Comenzar gratis
          </Button>
        </div>
      </div>
    </header>
  );
}

export default LandingNavbar;
