import React from 'react';
import AuthLogo from '../../components/auth/AuthLogo';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function DashboardScreen({ user, onLogout }) {
  const espacioConsumido = user?.espacioConsumido || 0;
  const espacioDisponible = user?.espacioDisponible || 5368709120;
  const totalEspacio = espacioConsumido + espacioDisponible;
  const porcentajeUso = totalEspacio > 0 ? Math.min(100, Math.round((espacioConsumido / totalEspacio) * 100)) : 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      {/* Navbar superior */}
      <header style={{
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        padding: "16px 36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <AuthLogo />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#3B0A1F" }}>
              {user?.nombre || "Usuario"}
            </p>
            <span style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 600,
              color: "#7D1535",
              backgroundColor: "#FDF2F4",
              padding: "2px 8px",
              borderRadius: "12px",
              marginTop: "2px"
            }}>
              {user?.rol || "Usuario"}
            </span>
          </div>

          <button
            onClick={onLogout}
            style={{
              padding: "8px 18px",
              backgroundColor: "transparent",
              border: "1.5px solid #E2E8F0",
              borderRadius: "8px",
              color: "#64748B",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#7D1535";
              e.currentTarget.style.color = "#7D1535";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.color = "#64748B";
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main style={{ maxWidth: "1100px", width: "100%", margin: "40px auto", padding: "0 24px", boxSizing: "border-box" }}>
        {/* Banner de bienvenida */}
        <div style={{
          background: "linear-gradient(135deg, #3B0A1F 0%, #7D1535 100%)",
          borderRadius: "16px",
          padding: "36px 40px",
          color: "#FFFFFF",
          boxShadow: "0 10px 25px -5px rgba(59, 10, 31, 0.2)",
          marginBottom: "32px"
        }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", fontWeight: 800 }}>
            ¡Bienvenido a tu espacio, {user?.nombre?.split(' ')[0] || "Usuario"}! 👋
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: "rgba(255, 255, 255, 0.8)", maxWidth: "600px", lineHeight: "1.5" }}>
            Has iniciado sesión exitosamente con el correo <strong>{user?.correo}</strong>. Tu almacenamiento en la nube está activo y protegido.
          </p>
        </div>

        {/* Tarjetas de estadísticas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {/* Tarjeta de Almacenamiento */}
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            padding: "24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748B" }}>Almacenamiento en Nube</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#7D1535", backgroundColor: "#FDF2F4", padding: "4px 8px", borderRadius: "6px" }}>
                {porcentajeUso}% usado
              </span>
            </div>

            <div style={{ fontSize: "24px", fontWeight: 800, color: "#1E293B", marginBottom: "8px" }}>
              {formatBytes(espacioConsumido)} <span style={{ fontSize: "14px", fontWeight: 500, color: "#94A3B8" }}>de {formatBytes(totalEspacio)}</span>
            </div>

            {/* Barra de progreso */}
            <div style={{ width: "100%", height: "8px", backgroundColor: "#F1F5F9", borderRadius: "99px", overflow: "hidden", margin: "14px 0" }}>
              <div style={{ width: `${Math.max(5, porcentajeUso)}%`, height: "100%", backgroundColor: "#7D1535", borderRadius: "99px" }}></div>
            </div>

            <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8" }}>
              Espacio disponible: <strong>{formatBytes(espacioDisponible)}</strong>
            </p>
          </div>

          {/* Tarjeta de Información de Cuenta */}
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            padding: "24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#64748B", marginBottom: "16px" }}>
              Detalles de la Cuenta
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#94A3B8" }}>Correo:</span>
                <span style={{ fontWeight: 600, color: "#1E293B" }}>{user?.correo}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#94A3B8" }}>Rol de acceso:</span>
                <span style={{ fontWeight: 600, color: "#1E293B" }}>{user?.rol}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#94A3B8" }}>Nivel de cuenta:</span>
                <span style={{ fontWeight: 600, color: "#1E293B", textTransform: "capitalize" }}>{user?.nivelAcceso || "Estándar"}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardScreen;
