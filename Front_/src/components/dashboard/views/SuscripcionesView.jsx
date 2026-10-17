import React, { useState } from 'react';
import { colors } from '../../../styles/theme';
import Icon from '../../ui/Icon';
import Button from '../../ui/Button';

function SuscripcionesView() {
  const [billingCycle, setBillingCycle] = useState('mensual'); // 'mensual' | 'anual'
  const [selectedPlan, setSelectedPlan] = useState('free');

  const plans = [
    {
      id: 'free',
      name: 'Básico',
      subtitle: 'Para uso personal estándar',
      priceMonthly: 0,
      priceAnnual: 0,
      storage: '15 GB',
      storageDesc: 'Espacio gratuito de por vida',
      isCurrent: true,
      popular: false,
      features: [
        '15 GB de almacenamiento en la nube',
        'Carga máxima de archivos de 2 GB',
        'Acceso desde cualquier dispositivo',
        'Papelera con retención de 30 días',
        'Soporte estándar por comunidad',
      ],
      ctaText: 'Plan actual',
      ctaDisabled: true,
    },
    {
      id: 'pro',
      name: 'Profesional',
      subtitle: 'Para creadores y profesionales activos',
      priceMonthly: 3.99,
      priceAnnual: 39.99,
      storage: '250 GB',
      storageDesc: 'Ideal para fotos, videos y proyectos',
      isCurrent: false,
      popular: true,
      features: [
        '250 GB de almacenamiento ultrarrápido',
        'Carga de archivos sin límite de tamaño',
        'Enlaces protegidos con contraseña',
        'Enlaces con fecha de expiración',
        'Historial de versiones de 60 días',
        'Soporte prioritario por correo',
      ],
      ctaText: 'Mejorar a Profesional',
      ctaDisabled: false,
    },
    {
      id: 'business',
      name: 'Empresarial',
      subtitle: 'Para equipos y máxima productividad',
      priceMonthly: 9.99,
      priceAnnual: 99.99,
      storage: '2 TB',
      storageDesc: '2,000 GB con sincronización total',
      isCurrent: false,
      popular: false,
      features: [
        '2 TB (2,000 GB) de almacenamiento',
        'Cifrado avanzado de extremo a extremo',
        'Herramientas de colaboración multiusuario',
        'Historial ilimitado de versiones',
        'Descargas de alta velocidad dedicadas',
        'Soporte personalizado 24/7',
      ],
      ctaText: 'Obtener Empresarial',
      ctaDisabled: false,
    },
  ];

  return (
    <div style={{ padding: '32px 40px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      {/* Encabezado */}
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 36px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: colors.primarySoft,
          color: colors.primary,
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 12,
        }}>
          <Icon name="card" size={14} color={colors.primary} />
          PLANES Y SUSCRIPCIONES
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.primaryDark, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
          Elige el plan ideal para tus archivos
        </h1>
        <p style={{ fontSize: 15, color: colors.muted, margin: 0, lineHeight: 1.6 }}>
          Aumenta tu espacio de almacenamiento y desbloquea funciones de seguridad avanzadas en VinCloud.
        </p>

        {/* Selector Mensual / Anual */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: colors.borderLight,
          padding: 4,
          borderRadius: 30,
          marginTop: 24,
        }}>
          <button
            type="button"
            onClick={() => setBillingCycle('mensual')}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: billingCycle === 'mensual' ? colors.surface : 'transparent',
              color: billingCycle === 'mensual' ? colors.primaryDark : colors.muted,
              boxShadow: billingCycle === 'mensual' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Facturación Mensual
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('anual')}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: billingCycle === 'anual' ? colors.surface : 'transparent',
              color: billingCycle === 'anual' ? colors.primary : colors.muted,
              boxShadow: billingCycle === 'anual' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Facturación Anual
            <span style={{
              background: colors.primary,
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 10,
            }}>
              Ahorra 16%
            </span>
          </button>
        </div>
      </div>

      {/* Grid de Tarjetas de Planes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        maxWidth: 1080,
        margin: '0 auto 48px',
      }}>
        {plans.map((plan) => {
          const isPop = plan.popular;
          const price = billingCycle === 'mensual' ? plan.priceMonthly : plan.priceAnnual;
          const billingLabel = plan.priceMonthly === 0 ? 'siempre gratis' : (billingCycle === 'mensual' ? '/ mes' : '/ año');

          return (
            <div
              key={plan.id}
              style={{
                background: colors.surface,
                borderRadius: 20,
                border: isPop ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: isPop
                  ? '0 12px 30px rgba(125, 21, 53, 0.12)'
                  : '0 4px 14px rgba(0, 0, 0, 0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Badge Más Popular */}
              {isPop && (
                <div style={{
                  position: 'absolute',
                  top: -13,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: colors.primary,
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  padding: '4px 14px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 8px rgba(125, 21, 53, 0.3)',
                }}>
                  Más recomendado
                </div>
              )}

              {/* Nombre y subtítulo */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: colors.primaryDark, margin: 0 }}>
                    {plan.name}
                  </h3>
                  {plan.isCurrent && (
                    <span style={{
                      background: colors.borderLight,
                      color: colors.muted,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 12,
                    }}>
                      Activo
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: colors.subtle, margin: '6px 0 0' }}>
                  {plan.subtitle}
                </p>
              </div>

              {/* Espacio destacado */}
              <div style={{
                background: isPop ? colors.primarySoft : colors.surfaceAlt,
                borderRadius: 14,
                padding: '16px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: isPop ? colors.primary : colors.border,
                  color: isPop ? '#FFFFFF' : colors.muted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name="cloud" size={22} color={isPop ? '#FFFFFF' : colors.muted} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: isPop ? colors.primary : colors.text, lineHeight: 1.1 }}>
                    {plan.storage}
                  </div>
                  <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    {plan.storageDesc}
                  </div>
                </div>
              </div>

              {/* Precio */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: colors.primaryDark, letterSpacing: '-1px' }}>
                    ${price}
                  </span>
                  <span style={{ fontSize: 14, color: colors.muted, fontWeight: 600 }}>
                    USD {billingLabel}
                  </span>
                </div>
                {billingCycle === 'anual' && plan.priceMonthly > 0 && (
                  <div style={{ fontSize: 12, color: '#10B981', fontWeight: 700, marginTop: 4 }}>
                    Facturado anualmente (${(plan.priceAnnual / 12).toFixed(2)}/mes)
                  </div>
                )}
              </div>

              {/* Botón de Acción */}
              <button
                type="button"
                disabled={plan.ctaDisabled}
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: plan.ctaDisabled ? 'default' : 'pointer',
                  border: isPop ? 'none' : `1.5px solid ${colors.border}`,
                  background: plan.ctaDisabled
                    ? colors.borderLight
                    : (isPop ? colors.primary : colors.surface),
                  color: plan.ctaDisabled
                    ? colors.subtle
                    : (isPop ? '#FFFFFF' : colors.primaryDark),
                  boxShadow: isPop ? '0 4px 14px rgba(125, 21, 53, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  marginBottom: 28,
                }}
              >
                {plan.ctaText}
              </button>

              {/* Lista de Características */}
              <div style={{ borderTop: `1px solid ${colors.borderLight}`, paddingTop: 20, marginTop: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
                  Incluye:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: colors.text, lineHeight: 1.4 }}>
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: colors.primarySoft,
                        color: colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                      }}>
                        <Icon name="check" size={11} color={colors.primary} strokeWidth={3} />
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

      {/* Preguntas frecuentes y Garantía */}
      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
        background: colors.surface,
        borderRadius: 16,
        padding: '24px 32px',
        border: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: colors.primarySoft,
            color: colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon name="shield" size={24} color={colors.primary} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.primaryDark }}>
              Almacenamiento seguro y garantizado
            </div>
            <div style={{ fontSize: 13, color: colors.muted }}>
              Cifrado AES de 256 bits, respaldo redundante y cancelaciones fáciles en cualquier momento.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary">
            Preguntas Frecuentes
          </Button>
          <Button variant="primary">
            Contactar Ventas
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SuscripcionesView;
