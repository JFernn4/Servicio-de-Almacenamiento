import React from 'react';
import Icon from '../../components/ui/Icon';
import { colors } from '../../styles/theme';

function LandingFeatures() {
  return (
    <section id="caracteristicas" style={{ padding: '90px 24px', background: 'transparent' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {/* Cabecera de la sección */}
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 60px' }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 800,
              color: colors.border,
              background: 'rgba(241, 245, 249, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(8px)',
              padding: '6px 16px',
              borderRadius: 20,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            CARACTERÍSTICAS PRINCIPALES
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900,
              color: colors.surface,
              margin: '0 0 16px',
              letterSpacing: '-1px',
              lineHeight: 1.15,
            }}
          >
            Diseñado para moverte rápido sin perder el control
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.6, margin: 0 }}>
            Una suite completa pensada para personas y equipos que necesitan almacenar, proteger y compartir información crítica sin fricción.
          </p>
        </div>

        {/* Bento Grid estilo Dropbox */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 24,
          }}
        >
          {/* Tarjeta 1: Colaboración y enlaces (7 columnas) - Acento Azul (Info) */}
          <div
            style={{
              gridColumn: 'span 7',
              background: colors.surfaceAlt,
              borderRadius: 24,
              padding: '40px 36px',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
              position: 'relative',
              overflow: 'hidden',
            }}
            className="bento-card"
          >
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: colors.infoSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Icon name="share" size={24} color={colors.info} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: '0 0 12px' }}>
                Comparte con quien quieras y mantén el control
              </h3>
              <p style={{ fontSize: 15, color: colors.muted, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 480 }}>
                Genera enlaces de descarga públicos o privados. Añade contraseñas personalizadas y fechas límite para que nadie acceda sin tu consentimiento.
              </p>
            </div>

            {/* Simulación visual interactiva de enlace */}
            <div
              style={{
                background: colors.surface,
                borderRadius: 16,
                padding: '18px 22px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.primaryDark }}>Opciones de enlace público</span>
                <span style={{ fontSize: 11, background: colors.successSoft, color: colors.successDark, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                  Activo
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div
                  style={{
                    flex: 1,
                    background: colors.surfaceAlt,
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: colors.muted,
                    border: `1px solid ${colors.border}`,
                    fontFamily: 'monospace',
                  }}
                >
                  https://vincloud.app/s/f8a3d92
                </div>
                <div
                  style={{
                    background: colors.info,
                    color: colors.surface,
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Copiar
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Velocidad e inmediatez (5 columnas) - Contraste Oscuro + Ámbar/Esmeralda */}
          <div
            style={{
              gridColumn: 'span 5',
              background: colors.primaryDark,
              borderRadius: 24,
              padding: '40px 36px',
              color: colors.surface,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 30px rgba(59, 10, 31, 0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
            className="bento-card"
          >
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(251, 191, 36, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Icon name="zap" size={24} color={colors.warningLight} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: colors.surface, margin: '0 0 12px' }}>
                Subidas y descargas a máxima velocidad
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.6, margin: 0 }}>
                Streaming optimizado directo a disco con Multer y almacenamiento distribuido. Sin tiempos muertos ni límites artificiales de velocidad.
              </p>
            </div>

            <div
              style={{
                marginTop: 28,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                <span>Subiendo archivo (45.2 MB)</span>
                <span style={{ fontWeight: 700, color: colors.success }}>100% Completado</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: colors.success, borderRadius: 3 }} />
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Seguridad (5 columnas) - Acento Verde Esmeralda */}
          <div
            id="seguridad"
            style={{
              gridColumn: 'span 5',
              background: colors.surfaceAlt,
              borderRadius: 24,
              padding: '40px 36px',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            className="bento-card"
          >
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: colors.successSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Icon name="shield" size={24} color={colors.successDark} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: colors.primaryDark, margin: '0 0 12px' }}>
                Cifrado AES de 256 bits
              </h3>
              <p style={{ fontSize: 14, color: colors.muted, lineHeight: 1.6, margin: 0 }}>
                Tus archivos se protegen en reposo y en tránsito. Cada bloque de datos cuenta con validación criptográfica y autenticación JWT.
              </p>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, background: colors.successSoft, color: colors.successDark, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(5, 150, 105, 0.2)', fontWeight: 700 }}>
                Tokens de sesión seguros
              </span>
              <span style={{ fontSize: 11, background: colors.successSoft, color: colors.successDark, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(5, 150, 105, 0.2)', fontWeight: 700 }}>
                Respaldos automáticos
              </span>
            </div>
          </div>

          {/* Tarjeta 4: Papelera y recuperación (7 columnas) - Acento Ámbar Cálido */}
          <div
            style={{
              gridColumn: 'span 7',
              background: colors.surfaceAlt,
              borderRadius: 24,
              padding: '40px 36px',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            className="bento-card"
          >
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: colors.warningSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Icon name="trash" size={24} color={colors.warningDark} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: '0 0 12px' }}>
                Papelera protegida con retención de 30 días
              </h3>
              <p style={{ fontSize: 15, color: colors.muted, lineHeight: 1.6, margin: 0, maxWidth: 520 }}>
                ¿Borraste un archivo por error? No te preocupes. La papelera integrada retiene tus elementos eliminados para que puedas restaurarlos a su ubicación original con un solo clic.
              </p>
            </div>

            <div
              style={{
                marginTop: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: colors.surface,
                padding: '12px 18px',
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Icon name="clock" size={16} color={colors.warningDark} />
              <span style={{ fontSize: 13, color: colors.primaryDark, fontWeight: 600 }}>
                Restauración instantánea sin pérdida de metadatos ni historial.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingFeatures;
