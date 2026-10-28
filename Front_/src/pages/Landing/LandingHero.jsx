import React from 'react';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { colors } from '../../styles/theme';

function LandingHero({ onGoToRegister, onExplore }) {
  return (
    <section
      style={{
        position: 'relative',
        paddingTop: 140,
        paddingBottom: 90,
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        {/* Badge superior */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(241, 245, 249, 0.12)',
            color: colors.border,
            padding: '8px 18px',
            borderRadius: 30,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 0.5,
            marginBottom: 24,
            border: '1px solid rgba(255, 255, 255, 0.22)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Icon name="sparkles" size={16} color={colors.border} />
          ALMACENAMIENTO INTELIGENTE Y SEGURO
        </div>

        {/* Titular principal */}
        <h1
          style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)',
            fontWeight: 900,
            color: colors.surface,
            margin: '0 auto 20px',
            maxWidth: 900,
            lineHeight: 1.08,
            letterSpacing: '-1.5px',
          }}
        >
          Tus archivos protegidos, ordenados y siempre a mano.
        </h1>

        {/* Subtítulo descriptivo */}
        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'rgba(255, 255, 255, 0.78)',
            maxWidth: 680,
            margin: '0 auto 36px',
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          VinCloud te ofrece el espacio en la nube más ágil y seguro. Sube archivos pesados, comparte con enlaces protegidos y accede desde cualquier dispositivo.
        </p>

        {/* Botones de acción */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={onGoToRegister}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: colors.primary,
              color: colors.surface,
              border: 'none',
              borderRadius: 14,
              padding: '16px 32px',
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(125, 21, 53, 0.45)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 14px 30px rgba(125, 21, 53, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(125, 21, 53, 0.45)';
            }}
          >
            <span>Crea tu cuenta con 15 GB gratis</span>
            <Icon name="arrowRight" size={18} color={colors.surface} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={onExplore}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: colors.surface,
              color: colors.primaryDark,
              border: `1.5px solid ${colors.border}`,
              borderRadius: 14,
              padding: '15px 26px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.background = colors.primarySoft;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.background = colors.surface;
            }}
          >
            Ver cómo funciona
          </button>
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.65)', marginBottom: 60 }}>
          ✓ Sin tarjeta de crédito requerida &nbsp;•&nbsp; ✓ Cifrado de extremo a extremo &nbsp;•&nbsp; ✓ Activación instantánea
        </div>

        {/* Mockup interactivo central con tarjetas flotantes */}
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', perspective: 1000 }}>
          {/* Tarjeta flotante 1: Documento sincronizado */}
          <div
            className="floating-card-1"
            style={{
              position: 'absolute',
              top: -24,
              left: -20,
              background: colors.surface,
              borderRadius: 16,
              padding: '12px 18px',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              zIndex: 10,
              animation: 'floatSlow 4s ease-in-out infinite',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: colors.primarySoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="file" size={20} color={colors.primary} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: colors.primaryDark }}>Proyecto_Final_2026.pdf</div>
              <div style={{ fontSize: 11, color: colors.successDark, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="check" size={12} color={colors.successDark} strokeWidth={3} />
                Sincronizado al instante
              </div>
            </div>
          </div>

          {/* Tarjeta flotante 2: Cifrado y seguridad */}
          <div
            className="floating-card-2"
            style={{
              position: 'absolute',
              bottom: 24,
              left: -30,
              background: colors.surface,
              borderRadius: 16,
              padding: '12px 18px',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              zIndex: 10,
              animation: 'float 5s ease-in-out infinite alternate',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: colors.successSoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="shield" size={20} color={colors.successDark} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: colors.primaryDark }}>Cifrado AES-256</div>
              <div style={{ fontSize: 11, color: colors.muted }}>Protección total en tránsito</div>
            </div>
          </div>

          {/* Tarjeta flotante 3: Enlace compartido protegido */}
          <div
            className="floating-card-3"
            style={{
              position: 'absolute',
              top: 30,
              right: -25,
              background: colors.surface,
              borderRadius: 16,
              padding: '12px 18px',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              zIndex: 10,
              animation: 'float 4.5s ease-in-out infinite 0.5s',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: colors.infoSoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="lock" size={20} color={colors.info} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: colors.primaryDark }}>Enlace Protegido</div>
              <div style={{ fontSize: 11, color: colors.muted }}>Con clave y caducidad</div>
            </div>
          </div>

          {/* Panel central simulado del Dashboard VinCloud */}
          <div
            style={{
              background: colors.surface,
              borderRadius: 24,
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(125, 21, 53, 0.08)',
              overflow: 'hidden',
              textAlign: 'left',
            }}
          >
            {/* Barra superior de la ventana */}
            <div
              style={{
                background: colors.surfaceAlt,
                padding: '14px 20px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: colors.danger, display: 'inline-block' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: colors.success, display: 'inline-block' }} />
              </div>
              <div
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 20,
                  padding: '4px 24px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.muted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Icon name="cloud" size={14} color={colors.primary} />
                app.vincloud.com/dashboard/archivos
              </div>
              <div style={{ width: 40 }} />
            </div>

            {/* Contenido simulado del explorador */}
            <div style={{ padding: '24px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.primaryDark }}>Mis Archivos</h3>
                  <span style={{ fontSize: 12, color: colors.muted }}>Sincronización activa con la nube</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span
                    style={{
                      background: colors.primary,
                      color: colors.surface,
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon name="upload" size={14} color={colors.surface} />
                    Subir archivo
                  </span>
                </div>
              </div>

              {/* Lista simulada de archivos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: 'Carpeta Diseño UI/UX 2026', type: 'folder', size: '1.2 GB', date: 'Hoy, 10:45 AM' },
                  { name: 'Memoria_Tecnica_Servicio_Nube.docx', type: 'file', size: '4.8 MB', date: 'Ayer' },
                  { name: 'Backup_Base_Datos_Postgres.sql', type: 'file', size: '14.2 MB', date: '14 Oct' },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: i === 0 ? colors.primarySoft : colors.surfaceAlt,
                      border: `1px solid ${i === 0 ? 'rgba(125, 21, 53, 0.15)' : colors.borderLight}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: item.type === 'folder' ? colors.surface : colors.infoSoft,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name={item.type} size={18} color={item.type === 'folder' ? colors.primary : colors.info} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: colors.primaryDark }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: colors.subtle }}>{item.date}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: colors.muted }}>{item.size}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingHero;
