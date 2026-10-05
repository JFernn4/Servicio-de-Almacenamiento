import React, { useState } from 'react';
import AuthLogo from '../../components/auth/AuthLogo';
import FieldInput from '../../components/ui/FieldInput';
import ErrorBanner from '../../components/ui/ErrorBanner';
import AuthBackground from '../../components/auth/AuthBackground';
import { register } from '../../services/authService';

function RegisterScreen({ onRegister, onGoToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password || !confirm) { 
      setError("Por favor completa todos los campos."); 
      return; 
    }
    if (password.length < 6) { 
      setError("La contraseña debe tener al menos 6 caracteres."); 
      return; 
    }
    if (password !== confirm) { 
      setError("Las contraseñas no coinciden."); 
      return; 
    }
    setError("");
    setLoading(true);

    try {
      const data = await register(name, email, password);
      if (onRegister) {
        // Asegurar que haya iniciales para el menú lateral
        const user = data.user;
        if (!user.initials && user.name) {
            const parts = user.name.split(' ');
            user.initials = parts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
        } else if (!user.initials && user.email) {
            user.initials = user.email.substring(0, 2).toUpperCase();
        }
        onRegister(user, data.token);
      }
    } catch (err) {
      setError(err.message || "Error al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  const personIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
  const emailIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
  const lockIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;

  return (
    <div style={{ 
        minHeight: "100vh", 
        width: "100%", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        position: "relative",
        padding: "20px",
        boxSizing: "border-box"
    }}>
      <AuthBackground />

      <div style={{ 
          width: "100%", 
          maxWidth: "520px", 
          backgroundColor: "#FCFAFA", 
          borderRadius: "24px", 
          padding: "48px", 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          position: "relative",
          zIndex: 1
      }}>
        <div style={{ marginBottom: 32 }}>
          <AuthLogo />
        </div>
        
        <div style={{ fontSize: 11, fontWeight: 800, color: "#7D1535", letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" }}>
            Crea tu espacio
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#2D0615", margin: "0 0 12px", lineHeight: 1.1, letterSpacing: "-1px" }}>
            Empieza con VinCloud
        </h2>
        <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 32px", lineHeight: 1.5 }}>
            Tu espacio seguro en la nube está a unos pocos pasos.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#2D0615", marginBottom: 8 }}>Nombre completo</label>
            <FieldInput icon={personIcon} type="text" value={name} onChange={setName} placeholder="Tu nombre y apellido" />
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#2D0615", marginBottom: 8 }}>Correo electrónico</label>
            <FieldInput icon={emailIcon} type="email" value={email} onChange={setEmail} placeholder="nombre@empresa.com" />
          </div>
          
          {/* Row for passwords */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#2D0615", marginBottom: 8 }}>Contraseña</label>
              <FieldInput icon={lockIcon} type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" showToggle onToggle={() => setShowPass(v => !v)} showValue={showPass} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#2D0615", marginBottom: 8 }}>Confirmar contraseña</label>
              <FieldInput icon={lockIcon} type="password" value={confirm} onChange={setConfirm} placeholder="Repite la contraseña" showToggle onToggle={() => setShowConfirm(v => !v)} showValue={showConfirm} />
            </div>
          </div>

          {error && <ErrorBanner msg={error} />}
          
          <button type="submit" disabled={loading} style={{ 
              background: "#7D1535", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 4, boxShadow: "0 4px 12px rgba(125, 21, 53, 0.3)"
          }}>
              {loading ? "Creando..." : "Crear mi cuenta"}
              {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
          </button>
        </form>

        <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginTop: 28, marginBottom: 24 }}>
          ¿Ya tienes una cuenta?{" "}
          <span onClick={onGoToLogin} style={{ color: "#7D1535", fontWeight: 700, cursor: "pointer" }}>Iniciar sesión</span>
        </p>

        <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", margin: 0 }}>
            Al crear una cuenta, aceptas nuestros <span style={{ color: "#7D1535" }}>Términos de servicio</span> y <span style={{ color: "#7D1535" }}>Política de privacidad</span>.
        </p>
      </div>
    </div>
  );
}

export default RegisterScreen;
