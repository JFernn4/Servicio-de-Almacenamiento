import { useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import FieldInput from '../../components/ui/FieldInput';
import Alert from '../../components/ui/Alert';
import SubmitButton from '../../components/ui/SubmitButton';
import AuthRightPanel from '../../components/auth/AuthRightPanel';
import { login, forgotPassword, resetPassword } from '../../services/authService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginScreen({ onLogin, onGoToRegister, onGoToForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

    // Estados para el flujo de recuperación de contraseña ("¿Olvidaste tu contraseña?")
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");
    const [forgotErrorMsg, setForgotErrorMsg] = useState("");
    const [resetStep, setResetStep] = useState(false); // Alternar a ingresar código y nueva clave
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showNewPass, setShowNewPass] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        const cleanEmail = email.trim();

        if (!cleanEmail || !password) {
            setError("Por favor completa todos los campos.");
            return;
        }

        // Validación de expresiones regulares según diagrama UML de actividad
        if (!EMAIL_REGEX.test(cleanEmail)) {
            setError("Por favor ingresa un correo electrónico válido (ej. usuario@empresa.com).");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const data = await login(cleanEmail, password);
            if (onLogin) {
                onLogin(data.user, data.token);
            }
        } catch (err) {
            setError(err.message || "Error al iniciar sesión.");
        } finally {
            setLoading(false);
        }
    }
    setError('');
    setLoading(true);

    // Manejar envío de solicitud de restablecimiento
    async function handleForgotSubmit(e) {
        e.preventDefault();
        const cleanForgotEmail = forgotEmail.trim();

        if (!cleanForgotEmail) {
            setForgotErrorMsg("Ingresa tu correo electrónico.");
            return;
        }
        if (!EMAIL_REGEX.test(cleanForgotEmail)) {
            setForgotErrorMsg("Ingresa un correo electrónico válido.");
            return;
        }

        setForgotErrorMsg("");
        setForgotSuccessMsg("");
        setForgotLoading(true);

        try {
            const data = await forgotPassword(cleanForgotEmail);
            setForgotSuccessMsg(data.message || "Se han enviado las instrucciones a tu correo electrónico.");
            if (data.resetToken) {
                setResetToken(data.resetToken);
            }
            setResetStep(true);
        } catch (err) {
            setForgotErrorMsg(err.message || "Error al solicitar la recuperación.");
        } finally {
            setForgotLoading(false);
        }
    }

    // Manejar restablecimiento con token y nueva contraseña
    async function handleResetPasswordSubmit(e) {
        e.preventDefault();
        const cleanToken = resetToken.trim();

        if (!cleanToken) {
            setForgotErrorMsg("Por favor ingresa el token o código de verificación.");
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            setForgotErrorMsg("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setForgotErrorMsg("");
        setForgotSuccessMsg("");
        setForgotLoading(true);

        try {
            const data = await resetPassword(cleanToken, newPassword);
            setForgotSuccessMsg(data.message || "Contraseña restablecida exitosamente.");
            setTimeout(() => {
                setShowForgotModal(false);
                setResetStep(false);
                setPassword(newPassword);
                setError("");
            }, 2000);
        } catch (err) {
            setForgotErrorMsg(err.message || "Error al restablecer la contraseña.");
        } finally {
            setForgotLoading(false);
        }
    }

    const emailIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
    const lockIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    const keyIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="m21 2-2 2m-1.5 1.5L14 9l-4 4-2-2-4 4 2 2 4-4 2 2 3.5-3.5" /><circle cx="7.5" cy="15.5" r="2.5" /></svg>;

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
                            <button 
                                type="button" 
                                onClick={() => {
                                    setForgotEmail(email);
                                    setForgotErrorMsg("");
                                    setForgotSuccessMsg("");
                                    setResetStep(false);
                                    setShowForgotModal(true);
                                }}
                                style={{ background: "none", border: "none", fontSize: 12, color: "#7D1535", fontWeight: 600, cursor: "pointer", padding: 0 }}
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
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

            {/* Modal de Recuperación de Contraseña (Diseño idéntico a VinCloud) */}
            {showForgotModal && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.45)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: 20,
                    boxSizing: "border-box"
                }}>
                    <div style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 16,
                        maxWidth: 440,
                        width: "100%",
                        padding: "36px 32px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        border: "1px solid #E2E8F0",
                        position: "relative"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div>
                                <h3 style={{ margin: "0 0 6px 0", fontSize: 20, fontWeight: 800, color: "#3B0A1F" }}>
                                    {resetStep ? "Restablecer contraseña" : "Recuperar contraseña"}
                                </h3>
                                <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: 1.4 }}>
                                    {resetStep 
                                        ? "Ingresa el token recibido y tu nueva contraseña."
                                        : "Te enviaremos un código y enlace seguro a tu correo electrónico."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: 20,
                                    color: "#94A3B8",
                                    cursor: "pointer",
                                    padding: 4,
                                    lineHeight: 1
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {forgotSuccessMsg && (
                            <div style={{
                                background: "#DCFCE7",
                                color: "#166534",
                                padding: "10px 14px",
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 500,
                                marginBottom: 16
                            }}>
                                {forgotSuccessMsg}
                            </div>
                        )}

                        {forgotErrorMsg && (
                            <div style={{ marginBottom: 16 }}>
                                <ErrorBanner msg={forgotErrorMsg} />
                            </div>
                        )}

                        {!resetStep ? (
                            <form onSubmit={handleForgotSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3B0A1F", marginBottom: 6 }}>
                                        Correo registrado
                                    </label>
                                    <FieldInput
                                        icon={emailIcon}
                                        type="email"
                                        value={forgotEmail}
                                        onChange={setForgotEmail}
                                        placeholder="carlos@empresa.com"
                                    />
                                </div>

                                <SubmitButton
                                    loading={forgotLoading}
                                    label="Enviar instrucciones"
                                    loadingLabel="Enviando..."
                                />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => setResetStep(true)}
                                        style={{ background: "none", border: "none", fontSize: 12, color: "#7D1535", fontWeight: 600, cursor: "pointer", padding: 0 }}
                                    >
                                        ¿Ya tienes un token o código?
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(false)}
                                        style={{ background: "none", border: "none", fontSize: 12, color: "#64748B", fontWeight: 600, cursor: "pointer", padding: 0 }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3B0A1F", marginBottom: 6 }}>
                                        Token de recuperación
                                    </label>
                                    <FieldInput
                                        icon={keyIcon}
                                        type="text"
                                        value={resetToken}
                                        onChange={setResetToken}
                                        placeholder="Pega el token aquí"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3B0A1F", marginBottom: 6 }}>
                                        Nueva contraseña
                                    </label>
                                    <FieldInput
                                        icon={lockIcon}
                                        type="password"
                                        value={newPassword}
                                        onChange={setNewPassword}
                                        placeholder="Mínimo 6 caracteres"
                                        showToggle
                                        onToggle={() => setShowNewPass(v => !v)}
                                        showValue={showNewPass}
                                    />
                                </div>

                                <SubmitButton
                                    loading={forgotLoading}
                                    label="Guardar nueva contraseña"
                                    loadingLabel="Guardando..."
                                />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => setResetStep(false)}
                                        style={{ background: "none", border: "none", fontSize: 12, color: "#7D1535", fontWeight: 600, cursor: "pointer", padding: 0 }}
                                    >
                                        ← Solicitar nuevo código
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(false)}
                                        style={{ background: "none", border: "none", fontSize: 12, color: "#64748B", fontWeight: 600, cursor: "pointer", padding: 0 }}
                                    >
                                        Volver al login
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default LoginScreen;
