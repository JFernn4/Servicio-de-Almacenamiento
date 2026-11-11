import React, { useState, useEffect } from 'react';
import Icon from '../../components/ui/Icon';
import { colors } from '../../styles/theme';
import { fetchPlansCatalog } from '../../services/subscriptionService';

const GB_BYTES = 1024 ** 3;

const ACCENT_PALETTE = [
  { accent: colors.info, accentSoft: colors.infoSoft },
  { accent: colors.primary, accentSoft: colors.primarySoft },
  { accent: colors.warningDark, accentSoft: colors.warningSoft },
  { accent: colors.successDark, accentSoft: colors.successSoft },
];

const FALLBACK_PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    subtitle: 'Capacidad por defecto para cuentas sin suscripción activa',
    price: 'Q0.00',
    period: 'gratis de por vida',
    storage: '5 GB',
    popular: false,
    accent: colors.info,
    accentSoft: colors.infoSoft,
    features: [
      '5 GB de almacenamiento base gratuito',
      'Tamaño máximo por archivo: 10 MB',
      'Subida de 1 archivo a la vez',
      'Enlaces compartidos con vigencia de 24 horas',
    ],
    buttonText: 'Crear cuenta gratis',
  },
  {
    id: 1,
    name: 'Básico',
    subtitle: 'Para uso personal: respalda documentos y fotos',
    price: 'Q25.00',
    period: '/ 30 días',
    storage: '50 GB',
    popular: false,
    accent: colors.successDark,
    accentSoft: colors.successSoft,
    features: [
      '50 GB de almacenamiento total',
      'Tamaño máximo por archivo: 50 MB',
      'Subida múltiple de hasta 3 archivos simultáneos',
      'Enlaces compartidos con vigencia de 7 días',
    ],
    buttonText: 'Comenzar con Básico',
  },
  {
    id: 2,
    name: 'Profesional',
    subtitle: 'Para freelancers y equipos pequeños',
    price: 'Q60.00',
    period: '/ 30 días',
    storage: '200 GB',
    popular: true,
    accent: colors.primary,
    accentSoft: colors.primarySoft,
    features: [
      '200 GB de almacenamiento total',
      'Tamaño máximo por archivo: 50 MB',
      'Subida múltiple de hasta 10 archivos simultáneos',
      'Enlaces compartidos con vigencia extendida de 30 días',
    ],
    buttonText: 'Comenzar con Profesional',
  },
  {
    id: 3,
    name: 'Empresarial',
    subtitle: 'Gran capacidad para equipos y empresas',
    price: 'Q150.00',
    period: '/ 30 días',
    storage: '1 TB',
    popular: false,
    accent: colors.warningDark,
    accentSoft: colors.warningSoft,
    features: [
      '1 TB (1,024 GB) de almacenamiento total',
      'Tamaño máximo por archivo: 50 MB',
      'Subida masiva de hasta 25 archivos simultáneos',
      'Enlaces compartidos corporativos con vigencia de 365 días',
    ],
    buttonText: 'Probar Empresarial',
  },
];

function formatStorageFromBytes(bytes, fallbackGb = 5) {
  const totalBytes = Number(bytes) || fallbackGb * GB_BYTES;
  const gb = totalBytes / GB_BYTES;
  if (gb >= 1024) {
    const tb = gb / 1024;
    return `${Number(tb.toFixed(tb % 1 === 0 ? 0 : 1))} TB`;
  }
  return `${Number(gb.toFixed(gb % 1 === 0 ? 0 : 1))} GB`;
}

function buildDynamicFeatures(storageLabel, decorator) {
  const multer = decorator?.politicaMulter;
  if (!multer) {
    return [`${storageLabel} de almacenamiento en la nube`];
  }
  const effectiveMaxMb = Math.min(Number(multer.maxFileSizeMb) || 10, 50);
  const filesText =
    multer.maxFiles > 1
      ? `Subida múltiple de hasta ${multer.maxFiles} archivos simultáneos`
      : 'Subida de 1 archivo a la vez';
  return [
    `${storageLabel} de almacenamiento total en la nube`,
    `Tamaño máximo por archivo: ${effectiveMaxMb} MB`,
    filesText,
    `Enlaces compartidos con vigencia de ${multer.shareExpiresIn || '24h'}`,
  ];
}

function mapCatalogToLandingPlans(catalog) {
  if (!catalog || !Array.isArray(catalog.planes)) {
    return FALLBACK_PLANS;
  }

  const base = catalog.planBase;
  const baseStorage = formatStorageFromBytes(
    base?.capacidadCatalogo ?? base?.decorator?.almacenamiento,
    5
  );

  const freePlan = {
    id: 'free',
    name: base?.nombre || 'Gratuito',
    subtitle: base?.descripcionOriginal || 'Capacidad por defecto para cuentas sin suscripción activa.',
    price: 'Q0.00',
    period: 'gratis de por vida',
    storage: baseStorage,
    popular: false,
    accent: colors.info,
    accentSoft: colors.infoSoft,
    features: buildDynamicFeatures(baseStorage, base?.decorator),
    buttonText: 'Crear cuenta gratis',
  };

  const dbPlans = catalog.planes.map((plan, index) => {
    const dec = plan.decorator || {};
    const priceValue = Number(plan.precioCatalogo ?? dec.costo ?? 0);
    const storageLabel = formatStorageFromBytes(
      plan.capacidadCatalogo ?? dec.almacenamiento,
      dec.almacenamientoGb || 50
    );
    const normalizedName = String(plan.nombre || '').toLowerCase();
    const isPopular =
      normalizedName.includes('pro') ||
      (catalog.planes.length > 1 && index === 1 && !catalog.planes.some((p) => String(p.nombre || '').toLowerCase().includes('pro')));

    const palette = isPopular
      ? { accent: colors.primary, accentSoft: colors.primarySoft }
      : ACCENT_PALETTE[(index + 1) % ACCENT_PALETTE.length];

    return {
      id: plan.id,
      name: plan.nombre,
      subtitle: plan.descripcionOriginal || dec.descripcion || 'Plan de almacenamiento en la nube',
      price: `Q${priceValue.toFixed(2)}`,
      period: plan.vigenciaDias ? `/ ${plan.vigenciaDias} días` : '/ mes',
      storage: storageLabel,
      popular: isPopular,
      accent: palette.accent,
      accentSoft: palette.accentSoft,
      features: buildDynamicFeatures(storageLabel, dec),
      buttonText: `Comenzar con ${plan.nombre}`,
    };
  });

  return [freePlan, ...dbPlans];
}

function LandingPlans({ onGoToRegister }) {
  const [plans, setPlans] = useState(FALLBACK_PLANS);

  useEffect(() => {
    let active = true;
    fetchPlansCatalog()
      .then((catalog) => {
        if (active && catalog) {
          setPlans(mapCatalogToLandingPlans(catalog));
        }
      })
      .catch(() => {
        // Conserva los planes de respaldo si el servidor está apagado
      });
    return () => {
      active = false;
    };
  }, []);

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
                  padding: '36px 28px',
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
                    <span style={{ fontSize: 34, fontWeight: 900, color: colors.primaryDark, letterSpacing: '-1px' }}>
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
