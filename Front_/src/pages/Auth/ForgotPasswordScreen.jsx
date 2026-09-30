import React, { useState } from 'react';
import AuthLogo from '../../components/auth/AuthLogo';
import FieldInput from '../../components/ui/FieldInput';
import ErrorBanner from '../../components/ui/ErrorBanner';
import SubmitButton from '../../components/ui/SubmitButton';
import AuthRightPanel from '../../components/auth/AuthRightPanel';
import { forgotPassword } from '../../services/authService';

function ForgotPasswordScreen({ onGoToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await forgotPassword(email);
      setSuccessMsg(data.message || 'Se ha enviado un enlace de recuperación a tu correo.');
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  }

  const emailIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );

  return (
    <div style={{ display: 'flex', height: '100%', background: '#F5F4F4' }}>
      <div style={{ flex: '0 0 420px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '56px 48px', boxShadow: '4px 0 32px rgba(59,10,31,0.06)', overflowY: 'auto' }}>
        <AuthLogo />
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#3B0A1F', margin: '0 0 6px' }}>Recuperar contraseña</h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 32px' }}>
          Ingresa el correo asociado a tu cuenta para recibir un enlace de recuperación.
        </p>

        {successMsg ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#DCFCE7', color: '#166534', padding: '14px 16px', borderRadius: 8, fontSize: 13.5, lineHeight: 1.5 }}>
              {successMsg}
            </div>
            <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
              Revisa tu bandeja de entrada o spam y abre el enlace recibido para definir tu nueva contraseña.
            </p>
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
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3B0A1F', marginBottom: 6 }}>Correo electrónico</label>
              <FieldInput icon={emailIcon} type="email" value={email} onChange={setEmail} placeholder="carlos@empresa.com" />
            </div>

            {error && <ErrorBanner msg={error} />}
            <SubmitButton loading={loading} label="Enviar enlace de recuperación" loadingLabel="Enviando..." />
          </form>
        )}

        <p style={{ fontSize: 12.5, color: '#94A3B8', textAlign: 'center', marginTop: 28 }}>
          ¿Recordaste tu contraseña?{' '}
          <span onClick={onGoToLogin} style={{ color: '#7D1535', fontWeight: 700, cursor: 'pointer' }}>Inicia sesión</span>
        </p>
      </div>

      <AuthRightPanel
        title={'Recupera el acceso\na tu información'}
        subtitle="Sigue las instrucciones de seguridad para proteger tu cuenta y restablecer tu clave."
      />
    </div>
  );
}

export default ForgotPasswordScreen;
