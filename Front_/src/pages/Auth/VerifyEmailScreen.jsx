import React, { useState, useEffect } from 'react';
import AuthLogo from '../../components/auth/AuthLogo';
import AuthRightPanel from '../../components/auth/AuthRightPanel';
import { verifyEmail } from '../../services/authService';

function VerifyEmailScreen({ token, onGoToLogin, onGoToDashboard }) {
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('Verificando tu correo electrónico...');

  useEffect(() => {
    async function runVerification() {
      if (!token) {
        setStatus('error');
        setMessage('Token de verificación no proporcionado o inválido.');
        return;
      }

      try {
        const data = await verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'Tu correo ha sido verificado exitosamente.');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'El enlace de verificación es inválido o ha expirado.');
      }
    }

    runVerification();
  }, [token]);

  return (
    <div style={{ display: 'flex', height: '100%', background: '#F5F4F4' }}>
      <div style={{ flex: '0 0 420px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '56px 48px', boxShadow: '4px 0 32px rgba(59,10,31,0.06)', overflowY: 'auto' }}>
        <AuthLogo />
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#3B0A1F', margin: '0 0 6px' }}>Verificación de cuenta</h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 32px' }}>
          Confirmación de correo para acceso completo a la plataforma.
        </p>

        {status === 'verifying' && (
          <div style={{ padding: '24px', textAlign: 'center', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <p style={{ fontSize: 14.5, color: '#7D1535', fontWeight: 600, margin: 0 }}>
              {message}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#DCFCE7', color: '#166534', padding: '16px', borderRadius: 8, fontSize: 14, lineHeight: 1.5 }}>
              {message}
            </div>
            <button
              type="button"
              onClick={onGoToDashboard || onGoToLogin}
              style={{
                background: '#7D1535',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                marginTop: 8
              }}
            >
              Ir a mi espacio en la nube
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '16px', borderRadius: 8, fontSize: 14, lineHeight: 1.5 }}>
              {message}
            </div>
            <button
              type="button"
              onClick={onGoToLogin}
              style={{
                background: '#7D1535',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                marginTop: 8
              }}
            >
              Ir a iniciar sesión
            </button>
          </div>
        )}

        <p style={{ fontSize: 12.5, color: '#94A3B8', textAlign: 'center', marginTop: 28 }}>
          <span onClick={onGoToLogin} style={{ color: '#7D1535', fontWeight: 700, cursor: 'pointer' }}>Volver al inicio de sesión</span>
        </p>
      </div>

      <AuthRightPanel
        title={'Tu cuenta está lista\npara almacenar'}
        subtitle="Verifica tu identidad para garantizar la seguridad de tus datos y archivos en la nube."
      />
    </div>
  );
}

export default VerifyEmailScreen;
