import React, { useState } from 'react';
import AuthLogo from '../../components/auth/AuthLogo';
import FieldInput from '../../components/ui/FieldInput';
import ErrorBanner from '../../components/ui/ErrorBanner';
import SubmitButton from '../../components/ui/SubmitButton';
import AuthRightPanel from '../../components/auth/AuthRightPanel';
import { resetPassword } from '../../services/authService';

function ResetPasswordScreen({ token, onGoToLogin }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) {
      setError('Token de recuperación no válido o ausente.');
      return;
    }
    if (!password || !confirm) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await resetPassword(token, password);
      setSuccessMsg(data.message || 'Contraseña restablecida exitosamente.');
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  const lockIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  return (
    <div style={{ display: 'flex', height: '100%', background: '#F5F4F4' }}>
      <div style={{ flex: '0 0 420px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '56px 48px', boxShadow: '4px 0 32px rgba(59,10,31,0.06)', overflowY: 'auto' }}>
        <AuthLogo />
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#3B0A1F', margin: '0 0 6px' }}>Nueva contraseña</h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 32px' }}>
          Define una nueva contraseña segura para tu cuenta.
        </p>

        {successMsg ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#DCFCE7', color: '#166534', padding: '14px 16px', borderRadius: 8, fontSize: 13.5, lineHeight: 1.5 }}>
              {successMsg}
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
              Iniciar sesión ahora
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3B0A1F', marginBottom: 6 }}>Nueva contraseña</label>
              <FieldInput
                icon={lockIcon}
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Mínimo 6 caracteres"
                showToggle
                onToggle={() => setShowPass(v => !v)}
                showValue={showPass}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3B0A1F', marginBottom: 6 }}>Confirmar nueva contraseña</label>
              <FieldInput
                icon={lockIcon}
                type="password"
                value={confirm}
                onChange={setConfirm}
                placeholder="Repite tu contraseña"
                showToggle
                onToggle={() => setShowConfirm(v => !v)}
                showValue={showConfirm}
              />
            </div>

            {error && <ErrorBanner msg={error} />}
            <SubmitButton loading={loading} label="Guardar nueva contraseña" loadingLabel="Guardando..." />
          </form>
        )}

        <p style={{ fontSize: 12.5, color: '#94A3B8', textAlign: 'center', marginTop: 28 }}>
          <span onClick={onGoToLogin} style={{ color: '#7D1535', fontWeight: 700, cursor: 'pointer' }}>Volver al inicio de sesión</span>
        </p>
      </div>

      <AuthRightPanel
        title={'Seguridad garantizada\npara tus archivos'}
        subtitle="Tu nueva clave protegerá tu espacio de almacenamiento cifrado en la nube."
      />
    </div>
  );
}

export default ResetPasswordScreen;
