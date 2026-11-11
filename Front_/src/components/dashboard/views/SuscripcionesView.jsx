import React, { useState, useEffect } from 'react';
import { colors, sectionLabelStyle } from '../../../styles/theme';
import Icon from '../../ui/Icon';
import Button from '../../ui/Button';
import Alert from '../../ui/Alert';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { useConfirm } from '../../../hooks/useConfirm';
import PaymentGatewayScreen from '../../../pages/Payment/PaymentGatewayScreen';
import {
  fetchPlansCatalog,
  fetchActiveSubscription,
  fetchPaymentHistory,
  cancelActiveSubscription,
} from '../../../services/subscriptionService';

const GB_BYTES = 1024 ** 3;

const DEFAULT_PLANS = [
  {
    id: null,
    key: 'free',
    name: 'Gratuito',
    decoratorClass: 'PlanGratuito',
    subtitle: 'Componente base del sistema',
    price: 0,
    storage: '5 GB',
    storageBytes: 5 * GB_BYTES,
    storageDesc: 'Espacio gratuito base',
    vigenciaDias: null,
    popular: false,
    features: [
      '5 GB de almacenamiento base gratuito',
      'Tamaño máximo por archivo: 10 MB',
      'Subida de 1 archivo a la vez',
      'Enlaces compartidos con vigencia de 24 horas',
    ],
  },
  {
    id: 1,
    key: 'basic',
    name: 'Básico',
    decoratorClass: 'PlanBasico',
    subtitle: 'Para uso personal: respalda documentos y fotos',
    price: 25,
    storage: '50 GB',
    storageBytes: 50 * GB_BYTES,
    storageDesc: '5 GB base + 45 GB decorador Básico',
    vigenciaDias: 30,
    popular: false,
    features: [
      '50 GB de almacenamiento total',
      'Tamaño máximo por archivo: 50 MB',
      'Subida múltiple de hasta 3 archivos simultáneos',
      'Enlaces compartidos con vigencia de 7 días',
    ],
  },
  {
    id: 2,
    key: 'pro',
    name: 'Profesional',
    decoratorClass: 'Profesional',
    subtitle: 'Para freelancers y equipos pequeños',
    price: 60,
    storage: '200 GB',
    storageBytes: 200 * GB_BYTES,
    storageDesc: '5 GB base + 195 GB decorador Profesional',
    vigenciaDias: 30,
    popular: true,
    features: [
      '200 GB de almacenamiento total',
      'Tamaño máximo por archivo: 250 MB',
      'Subida múltiple de hasta 10 archivos simultáneos',
      'Enlaces compartidos con vigencia extendida de 30 días',
    ],
  },
  {
    id: 3,
    key: 'business',
    name: 'Empresarial',
    decoratorClass: 'Empresarial',
    subtitle: 'Gran capacidad para equipos y empresas',
    price: 150,
    storage: '1 TB',
    storageBytes: 1024 * GB_BYTES,
    storageDesc: '5 GB base + 1,019 GB decorador Empresarial',
    vigenciaDias: 30,
    popular: false,
    features: [
      '1 TB (1,024 GB) de almacenamiento total',
      'Tamaño máximo por archivo: 1 GB',
      'Subida masiva de hasta 25 archivos simultáneos',
      'Enlaces compartidos corporativos con vigencia de 365 días',
    ],
  },
];

const SUB_STORAGE_KEY = 'vincloud_sim_sub';
const PAYMENTS_STORAGE_KEY = 'vincloud_sim_payments';

function readStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function SuscripcionesView({ onRefreshUser }) {
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [activeSub, setActiveSub] = useState(() => readStoredJson(SUB_STORAGE_KEY, null));
  const [payments, setPayments] = useState(() => readStoredJson(PAYMENTS_STORAGE_KEY, []));
  const [checkoutState, setCheckoutState] = useState(null); // { plan, mode: 'subscribe' | 'renew' }
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }
  const [canceling, setCanceling] = useState(false);
  const [loading, setLoading] = useState(true);

  const { askConfirm, confirmDialogProps } = useConfirm();

  function saveSubscription(nextSub) {
    setActiveSub(nextSub);
    try {
      if (nextSub) {
        localStorage.setItem(SUB_STORAGE_KEY, JSON.stringify(nextSub));
      } else {
        localStorage.removeItem(SUB_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }

  function prependPayment(record) {
    setPayments((prev) => {
      const updated = [record, ...prev];
      try {
        localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  }

  async function loadSubscriptionsData() {
    try {
      // 1. Cargar catálogo de planes del backend
      try {
        const catalogData = await fetchPlansCatalog();
        if (catalogData?.planes && Array.isArray(catalogData.planes)) {
          const mappedPlans = [
            // Plan Base Gratuito
            {
              id: null,
              key: 'free',
              name: 'Gratuito',
              decoratorClass: 'PlanGratuito',
              subtitle:
                catalogData.planBase?.descripcionOriginal || 'Componente base del sistema',
              price: 0,
              storage: '5 GB',
              storageBytes: 5 * GB_BYTES,
              storageDesc: 'Espacio gratuito base',
              vigenciaDias: null,
              popular: false,
              features:
                catalogData.planBase?.decorator?.politicaMulter?.features ||
                DEFAULT_PLANS[0].features,
            },
            // Planes del catálogo
            ...catalogData.planes.map((p) => {
              const gb =
                p.decorator?.almacenamientoGb ||
                Math.round(Number(p.capacidadCatalogo) / GB_BYTES);
              const storage = gb >= 1024 ? `${(gb / 1024).toFixed(0)} TB` : `${gb} GB`;
              const isPop = p.nombre.toLowerCase().includes('profesional');
              return {
                id: p.id,
                key: `plan-${p.id}`,
                name: p.nombre,
                decoratorClass:
                  p.decorator?.clase || (p.nombre.includes('Básico') ? 'PlanBasico' : p.nombre),
                subtitle: p.descripcionOriginal || '',
                price: Number(p.precioCatalogo),
                storage,
                storageBytes: Number(p.capacidadCatalogo),
                storageDesc: `5 GB base + ${Math.max(0, gb - 5)} GB decorador ${p.nombre}`,
                vigenciaDias: Number(p.vigenciaDias) || 30,
                popular: isPop,
                features:
                  p.decorator?.politicaMulter?.features ||
                  DEFAULT_PLANS.find((dp) => dp.id === p.id)?.features ||
                  [],
                decorator: p.decorator,
              };
            }),
          ];
          setPlans(mappedPlans);
        }
      } catch (err) {
        console.warn('No se pudo obtener el catálogo de planes desde el backend:', err);
      }

      // 2. Cargar suscripción activa del usuario desde el backend (GET /api/subscriptions/active)
      try {
        const subData = await fetchActiveSubscription();
        if (subData?.suscripcionActiva) {
          const sub = subData.suscripcionActiva;
          const dec = subData.planDecorado;
          const loadedSub = {
            planId: sub.planId,
            planNombre: sub.planNombre,
            decoratorClass: dec?.clase || sub.planNombre,
            vigenciaDias: Number(sub.vigenciaDias),
            diasRestantes: Number(sub.diasRestantes),
            fechaRenovacion: sub.fechaRenovacion,
            storageBytes: Number(sub.capacidadAlmacenamiento),
          };
          saveSubscription(loadedSub);
        } else {
          saveSubscription(null);
        }
      } catch (err) {
        console.warn('No se pudo obtener la suscripción activa desde el backend:', err);
      }

      // 3. Cargar historial de pagos desde el backend (GET /api/subscriptions/payments)
      try {
        const paymentsList = await fetchPaymentHistory();
        if (Array.isArray(paymentsList)) {
          setPayments(paymentsList);
          try {
            localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(paymentsList));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn('No se pudo obtener el historial de pagos desde el backend:', err);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscriptionsData();
  }, []);

  async function handlePaymentSuccess({ plan, mode, pago, resultado }) {
    const isRenew = mode === 'renew';

    // Si el backend retornó el estado actualizado de la suscripción
    if (resultado?.suscripcionActiva) {
      const sub = resultado.suscripcionActiva;
      const dec = resultado.planDecorado;
      const nextSub = {
        planId: sub.planId,
        planNombre: sub.planNombre,
        decoratorClass: dec?.clase || sub.planNombre,
        vigenciaDias: Number(sub.vigenciaDias),
        diasRestantes: Number(sub.diasRestantes),
        fechaRenovacion: sub.fechaRenovacion,
        storageBytes: Number(sub.capacidadAlmacenamiento),
      };
      saveSubscription(nextSub);
    } else {
      const addedDays = plan.vigenciaDias || 30;
      const currentRemaining = isRenew && activeSub ? Number(activeSub.diasRestantes || 0) : 0;
      const totalDays = currentRemaining + addedDays;
      const renewalDate = new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000).toISOString();

      const nextSub = {
        planId: plan.id,
        planNombre: plan.name,
        decoratorClass: plan.decoratorClass,
        vigenciaDias: addedDays,
        diasRestantes: totalDays,
        fechaRenovacion: renewalDate,
        storageBytes: plan.storageBytes,
      };
      saveSubscription(nextSub);
    }

    // Refrescar historial de pagos desde el backend
    try {
      const latestPayments = await fetchPaymentHistory();
      setPayments(latestPayments);
      localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(latestPayments));
    } catch {
      if (pago) prependPayment(pago);
    }

    setFeedback({
      type: 'success',
      text:
        resultado?.message ||
        (isRenew
          ? `Suscripción al Plan ${plan.name} renovada exitosamente (+${plan.vigenciaDias || 30} días).`
          : `Plan ${plan.name} (${plan.storage}) activado exitosamente.`),
    });

    // Actualizar la cuota del usuario en el estado global del frontend
    if (onRefreshUser) {
      await onRefreshUser();
    }
  }

  async function handleCancelSubscription() {
    const confirmed = await askConfirm({
      title: 'Cancelar suscripción activa',
      message:
        '¿Estás seguro de cancelar tu suscripción? Tu cuenta volverá inmediatamente al PlanGratuito base de 5 GB.',
      confirmLabel: 'Sí, cancelar suscripción',
    });
    if (!confirmed) return;

    setCanceling(true);
    setFeedback(null);

    try {
      const res = await cancelActiveSubscription();
      saveSubscription(null);
      setFeedback({
        type: 'success',
        text:
          res?.message ||
          'Suscripción cancelada exitosamente. Tu cuenta ha vuelto al PlanGratuito base (5 GB).',
      });

      if (onRefreshUser) {
        await onRefreshUser();
      }

      try {
        const latestPayments = await fetchPaymentHistory();
        setPayments(latestPayments);
        localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(latestPayments));
      } catch {
        // ignore
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error al cancelar la suscripción.',
      });
    } finally {
      setCanceling(false);
    }
  }

  // Si el usuario abrió la Pasarela de Pagos, renderiza la vista desacoplada
  if (checkoutState) {
    const currentPlanLabel = activeSub?.planNombre || 'Gratuito (PlanGratuito)';
    return (
      <PaymentGatewayScreen
        plan={checkoutState.plan}
        mode={checkoutState.mode}
        currentPlanName={currentPlanLabel}
        onBack={() => setCheckoutState(null)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentRejected={(rejectedRecord) => {
          prependPayment(rejectedRecord);
          fetchPaymentHistory().then(setPayments).catch(() => {});
        }}
      />
    );
  }

  const activePlanId = activeSub?.planId ?? null;
  const activePlanCard =
    plans.find((p) => p.id !== null && Number(p.id) === Number(activePlanId)) || plans[0];

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: '32px 40px 80px 40px',
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Encabezado */}
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 32px' }}>
        <div
          style={{
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
          }}
        >
          <Icon name="card" size={14} color={colors.primary} />
          PLANES Y SUSCRIPCIONES
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: colors.primaryDark,
            margin: '0 0 10px',
            letterSpacing: '-0.5px',
          }}
        >
          Elige el plan ideal para tus archivos
        </h1>
        <p style={{ fontSize: 15, color: colors.muted, margin: 0, lineHeight: 1.6 }}>
          Amplía tu almacenamiento base en la nube y desbloquea límites superiores de subida.
        </p>
      </div>

      {feedback && (
        <div style={{ maxWidth: 1120, margin: '0 auto 24px' }}>
          <Alert variant={feedback.type}>{feedback.text}</Alert>
        </div>
      )}

      {/* Barra de estado de la suscripción actual */}
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto 28px',
          background: colors.surface,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: '20px 26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: colors.primarySoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="zap" size={22} color={colors.primary} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: colors.primaryDark }}>
                Plan actual: {activeSub ? activeSub.planNombre : 'Gratuito'}
              </span>
              <span
                style={{
                  background: activeSub ? colors.successSoft : colors.borderLight,
                  color: activeSub ? colors.successDark : colors.muted,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: 99,
                }}
              >
                {activeSub?.decoratorClass || 'PlanGratuito · 5 GB'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: colors.muted, marginTop: 3 }}>
              {activeSub
                ? `Vigencia activa · ${activeSub.diasRestantes} días restantes (renovación: ${new Date(activeSub.fechaRenovacion).toLocaleDateString()})`
                : 'Cuenta con capacidad base de 5 GB sin costo mensual.'}
            </div>
          </div>
        </div>

        {activeSub && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              onClick={() =>
                setCheckoutState({
                  plan: activePlanCard,
                  mode: 'renew',
                })
              }
            >
              Renovar (+{activeSub.vigenciaDias || 30} días)
            </Button>
            <button
              type="button"
              disabled={canceling}
              onClick={handleCancelSubscription}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: `1px solid ${colors.danger}`,
                background: colors.surface,
                color: colors.danger,
                fontSize: 13,
                fontWeight: 700,
                cursor: canceling ? 'not-allowed' : 'pointer',
              }}
            >
              {canceling ? 'Cancelando...' : 'Cancelar suscripción'}
            </button>
          </div>
        )}
      </div>

      {/* Grid de Tarjetas de Planes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 22,
          maxWidth: 1120,
          margin: '0 auto 44px',
        }}
      >
        {plans.map((plan) => {
          const isPop = plan.popular;
          const isFree = plan.id === null;
          const isCurrent = isFree
            ? !activePlanId
            : Number(activePlanId) === Number(plan.id);

          return (
            <div
              key={plan.key}
              style={{
                background: colors.surface,
                borderRadius: 20,
                border: isPop
                  ? `2px solid ${colors.primary}`
                  : isCurrent
                    ? `2px solid ${colors.success}`
                    : `1px solid ${colors.border}`,
                padding: '30px 24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: isPop
                  ? '0 12px 30px rgba(125, 21, 53, 0.12)'
                  : '0 4px 14px rgba(0, 0, 0, 0.03)',
              }}
            >
              {isPop && (
                <div
                  style={{
                    position: 'absolute',
                    top: -13,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: colors.primary,
                    color: colors.surface,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    padding: '4px 14px',
                    borderRadius: 20,
                    textTransform: 'uppercase',
                  }}
                >
                  Más recomendado
                </div>
              )}

              {/* Nombre y subtítulo */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: colors.primaryDark, margin: 0 }}>
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <span
                      style={{
                        background: colors.successSoft,
                        color: colors.successDark,
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 12,
                      }}
                    >
                      Activo
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: colors.subtle, margin: '6px 0 0', lineHeight: 1.4 }}>
                  {plan.subtitle}
                </p>
              </div>

              {/* Espacio destacado */}
              <div
                style={{
                  background: isPop ? colors.primarySoft : colors.surfaceAlt,
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: isPop ? colors.primary : colors.border,
                    color: isPop ? colors.surface : colors.muted,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="cloud" size={20} color={isPop ? colors.surface : colors.muted} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 21,
                      fontWeight: 800,
                      color: isPop ? colors.primary : colors.text,
                      lineHeight: 1.1,
                    }}
                  >
                    {plan.storage}
                  </div>
                  <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    {plan.storageDesc}
                  </div>
                </div>
              </div>

              {/* Precio en Quetzales */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      color: colors.primaryDark,
                      letterSpacing: '-1px',
                    }}
                  >
                    Q{Number(plan.price).toFixed(2)}
                  </span>
                  <span style={{ fontSize: 13, color: colors.muted, fontWeight: 600 }}>
                    {isFree ? 'siempre gratis' : `/ ${plan.vigenciaDias || 30} días`}
                  </span>
                </div>
              </div>

              {/* Botón de Acción -> Abre la Pasarela de Pagos */}
              <button
                type="button"
                disabled={isFree || isCurrent}
                onClick={() =>
                  setCheckoutState({
                    plan,
                    mode: 'subscribe',
                  })
                }
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isFree || isCurrent ? 'default' : 'pointer',
                  border: isPop && !isCurrent ? 'none' : `1.5px solid ${colors.border}`,
                  background:
                    isFree || isCurrent
                      ? colors.borderLight
                      : isPop
                        ? colors.primary
                        : colors.surface,
                  color:
                    isFree || isCurrent
                      ? colors.subtle
                      : isPop
                        ? colors.surface
                        : colors.primaryDark,
                  marginBottom: 24,
                  transition: 'all 0.2s ease',
                }}
              >
                {isCurrent
                  ? 'Plan actual'
                  : isFree
                    ? 'Plan base incluido'
                    : activeSub
                      ? `Cambiar a ${plan.name}`
                      : `Contratar ${plan.name}`}
              </button>

              {/* Lista de Características */}
              <div style={{ borderTop: `1px solid ${colors.borderLight}`, paddingTop: 18, marginTop: 'auto' }}>
                <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>Incluye:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((feature, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontSize: 12.5,
                        color: colors.text,
                        lineHeight: 1.4,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: colors.primarySoft,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
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

      {/* Historial de Pagos del Usuario */}
      {payments.length > 0 && (
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto 36px',
            background: colors.surface,
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            padding: '24px 28px',
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...sectionLabelStyle, color: colors.primary, marginBottom: 4 }}>
              HISTORIAL DE TRANSACCIONES
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: colors.primaryDark, margin: 0 }}>
              Pagos y Comprobantes Recientes
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}`, textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: colors.muted, fontWeight: 700 }}>Referencia</th>
                  <th style={{ padding: '10px 12px', color: colors.muted, fontWeight: 700 }}>Plan</th>
                  <th style={{ padding: '10px 12px', color: colors.muted, fontWeight: 700 }}>Operación</th>
                  <th style={{ padding: '10px 12px', color: colors.muted, fontWeight: 700 }}>Tarjeta</th>
                  <th style={{ padding: '10px 12px', color: colors.muted, fontWeight: 700 }}>Monto</th>
                  <th style={{ padding: '10px 12px', color: colors.muted, fontWeight: 700 }}>Estado</th>
                  <th style={{ padding: '10px 12px', color: colors.muted, fontWeight: 700 }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const approved = p.estado === 'aprobado';
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700, color: colors.primaryDark }}>
                        {p.referencia}
                      </td>
                      <td style={{ padding: '12px', color: colors.text, fontWeight: 600 }}>{p.planNombre}</td>
                      <td style={{ padding: '12px', color: colors.muted, textTransform: 'capitalize' }}>{p.tipo}</td>
                      <td style={{ padding: '12px', color: colors.muted }}>•••• {p.tarjetaUltimos4}</td>
                      <td style={{ padding: '12px', color: colors.primaryDark, fontWeight: 800 }}>
                        Q{Number(p.monto).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            background: approved ? colors.successSoft : colors.primarySoft,
                            color: approved ? colors.successDark : colors.danger,
                          }}
                        >
                          {approved ? 'Aprobado' : 'Rechazado'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: colors.muted }}>
                        {p.fecha ? new Date(p.fecha).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Garantía de seguridad */}
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          background: colors.surface,
          borderRadius: 16,
          padding: '22px 28px',
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: colors.primarySoft,
              color: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="shield" size={24} color={colors.primary} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.primaryDark }}>
              Pagos protegidos y almacenamiento garantizado
            </div>
            <div style={{ fontSize: 13, color: colors.muted }}>
              Cifrado AES de 256 bits, actualización inmediata de cuota con el Patrón Decorator y cancelación en cualquier momento.
            </div>
          </div>
        </div>
      </div>

      {confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />}
    </div>
  );
}

export default SuscripcionesView;
