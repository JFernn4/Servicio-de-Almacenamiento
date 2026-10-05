import React, { useState } from 'react';

import AuthLogo from '../../components/auth/AuthLogo';
import FieldInput from '../../components/ui/FieldInput';
import ErrorBanner from '../../components/ui/ErrorBanner';
import AuthBackground from '../../components/auth/AuthBackground';
import { login } from '../../services/authService';

function LoginScreen({ onLogin, onGoToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email || !password) {
            setError("Por favor completa todos los campos.");
            return;
        }
        setError("");
        setLoading(true);

        try {
            const data = await login(email, password);
            if (onLogin) {
                // Generar iniciales por si la base de datos no las incluye
                const user = data.user;
                if (!user.initials && user.name) {
                    const parts = user.name.split(' ');
                    user.initials = parts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
                } else if (!user.initials && user.email) {
                    user.initials = user.email.substring(0, 2).toUpperCase();
                }
                
                onLogin(user, data.token);
            }
        } catch (err) {
            setError(err.message || "Error al iniciar sesión.");
        } finally {
            setLoading(false);
        }
    }

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
                maxWidth: "460px", 
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
                    Bienvenido de nuevo
                </div>
                <h2 style={{ fontSize: 32, fontWeight: 800, color: "#2D0615", margin: "0 0 12px", lineHeight: 1.1, letterSpacing: "-1px" }}>
                    Inicia sesión en<br/>VinCloud
                </h2>
                <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 32px", lineHeight: 1.5 }}>
                    Continúa donde lo dejaste. Tus archivos están listos para ti.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#2D0615", marginBottom: 8 }}>Correo electrónico</label>
                        <FieldInput icon={emailIcon} type="email" value={email} onChange={setEmail} placeholder="nombre@empresa.com" />
                    </div>
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <label style={{ fontSize: 12.5, fontWeight: 700, color: "#2D0615" }}>Contraseña</label>
                            <button type="button" style={{ background: "none", border: "none", fontSize: 12, color: "#7D1535", fontWeight: 700, cursor: "pointer", padding: 0 }}>¿Olvidaste tu contraseña?</button>
                        </div>
                        <FieldInput icon={lockIcon} type="password" value={password} onChange={setPassword} placeholder="Ingresa tu contraseña" showToggle onToggle={() => setShowPass(v => !v)} showValue={showPass} />
                    </div>
                    {error && <ErrorBanner msg={error} />}
                    
                    <button type="submit" disabled={loading} style={{ 
                        background: "#7D1535", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 4, boxShadow: "0 4px 12px rgba(125, 21, 53, 0.3)"
                    }}>
                        {loading ? "Ingresando..." : "Iniciar sesión"}
                        {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
                    </button>
                </form>

                <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginTop: 28, marginBottom: 24 }}>
                    ¿Aún no tienes una cuenta?{" "}
                    <span onClick={onGoToRegister} style={{ color: "#7D1535", fontWeight: 700, cursor: "pointer" }}>Crear cuenta</span>
                </p>

                <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", margin: 0 }}>
                    Al continuar, aceptas nuestros <span style={{ color: "#7D1535" }}>Términos de servicio</span> y <span style={{ color: "#7D1535" }}>Política de privacidad</span>.
                </p>
            </div>
        </div>
    );
}

export default LoginScreen;
