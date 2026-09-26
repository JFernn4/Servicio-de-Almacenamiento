import React, { useState } from 'react';
import AuthLogo from '../../components/auth/AuthLogo';
import FieldInput from '../../components/ui/FieldInput';
import ErrorBanner from '../../components/ui/ErrorBanner';
import SubmitButton from '../../components/ui/SubmitButton';
import AuthRightPanel from '../../components/auth/AuthRightPanel';

function RegisterScreen({ onRegister, onGoToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password || !confirm) { setError("Por favor completa todos los campos."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); onRegister(); }, 1100);
  }

  const personIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
  const emailIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
  const lockIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: "Inter, sans-serif", background: "#F5F4F4" }}>
      <div style={{ flex: "0 0 420px", background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 48px", boxShadow: "4px 0 32px rgba(59,10,31,0.06)", overflowY: "auto" }}>
        <AuthLogo />
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#3B0A1F", margin: "0 0 6px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Crea tu cuenta</h2>
        <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 0 28px" }}>Completa el formulario para empezar a usar VinCloud.</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3B0A1F", marginBottom: 6 }}>Nombre completo</label>
            <FieldInput icon={personIcon} type="text" value={name} onChange={setName} placeholder="Carlos Alvarado" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3B0A1F", marginBottom: 6 }}>Correo electrónico</label>
            <FieldInput icon={emailIcon} type="email" value={email} onChange={setEmail} placeholder="carlos@empresa.com" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3B0A1F", marginBottom: 6 }}>Contraseña</label>
            <FieldInput icon={lockIcon} type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" showToggle onToggle={() => setShowPass(v => !v)} showValue={showPass} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3B0A1F", marginBottom: 6 }}>Confirmar contraseña</label>
            <FieldInput icon={lockIcon} type="password" value={confirm} onChange={setConfirm} placeholder="Repite tu contraseña" showToggle onToggle={() => setShowConfirm(v => !v)} showValue={showConfirm} />
          </div>

          {password.length > 0 && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {[1, 2, 3, 4].map((i) => {
                const strength = password.length >= 10 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : 1;
                const colors = ["#EF4444", "#F97316", "#EAB308", "#22C55E"];
                return <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? colors[strength - 1] : "#E0D5D8" }} />;
              })}
              <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: 6, whiteSpace: "nowrap" }}>
                {password.length >= 10 ? "Muy segura" : password.length >= 8 ? "Segura" : password.length >= 6 ? "Regular" : "Débil"}
              </span>
            </div>
          )}

          {error && <ErrorBanner msg={error} />}
          <SubmitButton loading={loading} label="Crear cuenta" loadingLabel="Creando cuenta..." />
        </form>

        <p style={{ fontSize: 12.5, color: "#94A3B8", textAlign: "center", marginTop: 24 }}>
          ¿Ya tienes cuenta?{" "}
          <span onClick={onGoToLogin} style={{ color: "#7D1535", fontWeight: 700, cursor: "pointer" }}>Inicia sesión</span>
        </p>
      </div>
      <AuthRightPanel title={"Únete a VinCloud\nhoy mismo"} subtitle="Almacena, organiza y comparte tus archivos de forma segura. Tu espacio en la nube te espera." />
    </div>
  );
}

export default RegisterScreen;
