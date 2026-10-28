import React from 'react';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { colors } from '../../styles/theme';

function LandingPlans({ onGoToRegister }) {
  const plans = [
    {
      id: 'free',
      name: 'Básico',
      subtitle: 'Para uso personal estándar',
      price: '$0',
      period: 'gratis de por vida',
      storage: '15 GB',
      popular: false,
      accent: colors.info,
      accentSoft: colors.infoSoft,
      features: [
        '15 GB de almacenamiento en la nube',
        'Carga máxima de archivos de 2 GB',
        'Acceso desde cualquier dispositivo',
        'Papelera con retención de 30 días',
        'Soporte estándar por comunidad',
      ],
      buttonText: 'Crear cuenta gratis',
    },
    {
      id: 'pro',
      name: 'Profesional',
      subtitle: 'Para creadores y profesionales activos',
      price: '$3.99',
      period: 'USD / mes',
      storage: '250 GB',
      popular: true,
      accent: colors.primary,
      accentSoft: colors.primarySoft,
      features: [
        '250 GB de almacenamiento ultrarrápido',
        'Carga de archivos sin límite de tamaño',
        'Enlaces protegidos con contraseña',
        'Enlaces con fecha de expiración',
        'Historial de versiones de 60 días',
        'Soporte prioritario por correo',
      ],
      buttonText: 'Comenzar con Pro',
    },
    {
      id: 'business',
      name: 'Empresarial',
      subtitle: 'Para equipos y máxima productividad',
      price: '$9.99',
      period: 'USD / mes',
      storage: '1 TB',
      popular: false,
      accent: colors.warningDark,
      accentSoft: colors.warningSoft,
      features: [
        '1 TB (1,000 GB) de almacenamiento',
        'Cifrado avanzado de extremo a extremo',
        'Herramientas de colaboración multiusuario',
        'Historial ilimitado de versiones',
        'Descargas de alta velocidad dedicadas',
        'Soporte personalizado 24/7',
      ],
      buttonText: 'Probar Empresarial',
    },
  ];

  return (
    <section id="planes" style={{ padding: '90px 24px', background: 'transparent' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {/* Cabecera */}
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 54px' }}>
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
            PLANES FLEXIBLES
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 900,
              color: colors.surface,
              margin: '0 0 16px',
              letterSpacing: '-1px',
            }}
          >
            Comienza gratis, amplía cuando lo necesites
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.75)', margin: 0, lineHeight: 1.6 }}>
            Elige el plan que mejor se adapte a tu volumen de archivos. Puedes cambiar o cancelar en cualquier momento.
          </p>
        </div>

        {/* Tarjetas de Planes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          {plans.map((plan) => {
            const isPop = plan.popular;
            return (
              <div
                key={plan.id}
                style={{
                  background: colors.surface,
                  borderRadius: 24,
                  padding: '36px 30px',
                  border: isPop ? `2px solid ${plan.accent}` : `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: isPop
                    ? '0 20px 50px rgba(125, 21, 53, 0.25)'
                    : '0 8px 25px rgba(15, 23, 42, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Badge Más Popular */}
                {isPop && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: plan.accent,
                      color: colors.surface,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      padding: '4px 16px',
                      borderRadius: 20,
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 12px rgba(125, 21, 53, 0.3)',
                    }}
                  >
                    Más recomendado
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: colors.primaryDark, margin: '0 0 6px' }}>{plan.name}</h3>
                  <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>{plan.subtitle}</p>
                </div>

                {/* Espacio Destacado */}
                <div
                  style={{
                    background: plan.accentSoft,
                    borderRadius: 14,
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: plan.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="cloud" size={20} color={colors.surface} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: plan.accent }}>
                      {plan.storage}
                    </div>
                    <div style={{ fontSize: 11, color: colors.muted }}>Almacenamiento total</div>
                  </div>
                </div>

                {/* Precio */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: colors.primaryDark, letterSpacing: '-1px' }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: 13, color: colors.muted, fontWeight: 600 }}>{plan.period}</span>
                  </div>
                </div>

                {/* Botón CTA */}
                <button
                  type="button"
                  onClick={onGoToRegister}
                  style={{
                    width: '100%',
                    padding: '14px 0',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: isPop ? 'none' : `1.5px solid ${colors.border}`,
                    background: isPop ? plan.accent : colors.surface,
                    color: isPop ? colors.surface : colors.primaryDark,
                    boxShadow: isPop ? '0 6px 20px rgba(125, 21, 53, 0.28)' : 'none',
                    transition: 'all 0.2s ease',
                    marginBottom: 28,
                  }}
                  onMouseEnter={(e) => {
                    if (!isPop) {
                      e.currentTarget.style.borderColor = plan.accent;
                      e.currentTarget.style.background = plan.accentSoft;
                      e.currentTarget.style.color = plan.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPop) {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.background = colors.surface;
                      e.currentTarget.style.color = colors.primaryDark;
                    }
                  }}
                >
                  {plan.buttonText}
                </button>

                {/* Lista de características */}
                <div style={{ borderTop: `1px solid ${colors.borderLight}`, paddingTop: 20, marginTop: 'auto' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.subtle, textTransform: 'uppercase', marginBottom: 14, letterSpacing: 0.5 }}>
                    Incluye:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: colors.text, lineHeight: 1.4 }}>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: plan.accentSoft,
                            color: plan.accent,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          <Icon name="check" size={11} color={plan.accent} strokeWidth={3} />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default LandingPlans;
