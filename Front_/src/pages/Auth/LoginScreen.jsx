import React, { useState } from 'react';

import AuthLogo from '../../components/auth/AuthLogo';
import FieldInput from '../../components/ui/FieldInput';
import ErrorBanner from '../../components/ui/ErrorBanner';
import SubmitButton from '../../components/ui/SubmitButton';
import AuthRightPanel from '../../components/auth/AuthRightPanel';
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
        <div style={{ display: "flex", height: "100%", background: "#F5F4F4" }}>
            {/* Left panel */}
            <div style={{ flex: "0 0 420px", background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 48px", boxShadow: "4px 0 32px rgba(59,10,31,0.06)", overflowY: "auto" }}>
                <AuthLogo />
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "#3B0A1F", margin: "0 0 6px" }}>Bienvenido de nuevo</h2>
                <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 0 32px" }}>Ingresa tus credenciales para acceder a tu espacio.</p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3B0A1F", marginBottom: 6 }}>Correo electrónico</label>
                        <FieldInput icon={emailIcon} type="email" value={email} onChange={setEmail} placeholder="carlos@empresa.com" />
                    </div>
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#3B0A1F" }}>Contraseña</label>
                            <button type="button" style={{ background: "none", border: "none", fontSize: 12, color: "#7D1535", fontWeight: 600, cursor: "pointer", padding: 0 }}>¿Olvidaste tu contraseña?</button>
                        </div>
                        <FieldInput icon={lockIcon} type="password" value={password} onChange={setPassword} placeholder="••••••••" showToggle onToggle={() => setShowPass(v => !v)} showValue={showPass} />
                    </div>
                    {error && <ErrorBanner msg={error} />}
                    <SubmitButton loading={loading} label="Iniciar sesión" loadingLabel="Ingresando..." />
                </form>

                <p style={{ fontSize: 12.5, color: "#94A3B8", textAlign: "center", marginTop: 28 }}>
                    ¿No tienes cuenta?{" "}
                    <span onClick={onGoToRegister} style={{ color: "#7D1535", fontWeight: 700, cursor: "pointer" }}>Regístrate</span>
                </p>
            </div>

            {/* Right panel */}
            <AuthRightPanel title={"Tu nube empresarial,\nsiempre disponible"} subtitle="Gestiona, comparte y protege tus archivos corporativos desde cualquier lugar del mundo." />
        </div>
    );
}

export default LoginScreen;
