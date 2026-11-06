import React, { useState } from 'react';
import { colors, sectionLabelStyle } from '../../styles/theme';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

function formatCardNumber(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(' ') : '';
}

function formatExpiry(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function detectCardBrand(cardNumber) {
  const clean = String(cardNumber || '').replace(/\D/g, '');
  if (clean.startsWith('4')) return 'VISA';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'MASTERCARD';
  if (/^3[47]/.test(clean)) return 'AMEX';
  return 'VINCLOUD PAY';
}

function generateReference(prefix = 'SUB') {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString().slice(-6)}-${randomPart}`;
}

/**
 * Pasarela de Pagos simulada en el Frontend para contratación, cambio o renovación de planes.
 * Utiliza exclusivamente la paleta de colores de `styles/theme.js`.
 */
function PaymentGatewayScreen({
  plan,
  mode = 'subscribe', // 'subscribe' | 'renew'
  currentPlanName = 'Gratuito',
  onBack,
  onPaymentSuccess,
  onPaymentRejected,
}) {
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [simulateReject, setSimulateReject] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [receipt, setReceipt] = useState(null);

  if (!plan) return null;

  const isRenewal = mode === 'renew';
  const price = Number(plan.price ?? plan.precioCatalogo ?? plan.decorator?.costo ?? 0);
  const storageLabel = plan.storage || `${plan.decorator?.almacenamientoGb ?? 50} GB`;
  const decoratorClass = plan.decoratorClass || plan.decorator?.clase || 'DecoradorPlanes';
  const vigenciaDias = plan.vigenciaDias || 30;
  const features = plan.features || plan.decorator?.politicaMulter?.features || [];

  const cleanDigits = cardNumber.replace(/\D/g, '');
  const maskedDisplay = cardNumber.trim() || '•••• •••• •••• ••••';
  const holderDisplay = cardHolder.trim().toUpperCase() || 'NOMBRE DEL TITULAR';
  const expiryDisplay = expiry.trim() || 'MM/AA';
  const cardBrand = detectCardBrand(cardNumber);

  function validateForm() {
    if (!cardHolder.trim() || cardHolder.trim().length < 3) {
      return 'Ingresa el nombre completo del titular de la tarjeta.';
    }
    if (cleanDigits.length < 16) {
      return 'Ingresa los 16 dígitos de tu tarjeta de crédito o débito.';
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return 'Ingresa una fecha de vencimiento válida en formato MM/AA.';
    }
    const [monthStr] = expiry.split('/');
    const month = Number(monthStr);
    if (month < 1 || month > 12) {
      return 'El mes de vencimiento debe estar entre 01 y 12.';
    }
    const cleanCvv = cvv.replace(/\D/g, '');
    if (cleanCvv.length < 3) {
      return 'Ingresa el código de seguridad (CVV) de 3 o 4 dígitos.';
    }
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 550));

    const last4 = cleanDigits.slice(-4);
    const isRejected = simulateReject || last4 === '0000';
    const referencia = generateReference(isRenewal ? 'REN' : 'SUB');
    const nowIso = new Date().toISOString();

    if (isRejected) {
      const rejectedRecord = {
        id: `pay-${Date.now()}`,
        referencia,
        planId: plan.id,
        planNombre: plan.name || plan.nombre,
        tipo: isRenewal ? 'renovacion' : 'contratacion',
        monto: price,
        tarjetaUltimos4: last4,
        estado: 'rechazado',
        fecha: nowIso,
      };
      if (onPaymentRejected) {
        onPaymentRejected(rejectedRecord);
      }
      setErrorMessage(
        `El pago fue rechazado por el banco emisor (tarjeta terminada en •••• ${last4}). Se registró el intento con referencia ${referencia}.`
      );
      setSubmitting(false);
      return;
    }

    const paymentRecord = {
      id: `pay-${Date.now()}`,
      referencia,
      planId: plan.id,
      planNombre: plan.name || plan.nombre,
      tipo: isRenewal ? 'renovacion' : 'contratacion',
      monto: price,
      tarjetaUltimos4: last4,
      estado: 'aprobado',
      fecha: nowIso,
    };

    const nextReceipt = {
      referencia,
      monto: price,
      tarjetaUltimos4: last4,
      fecha: nowIso,
      planNombre: plan.name || plan.nombre,
      claseDecorador: decoratorClass,
      almacenamiento: storageLabel,
      mensaje: isRenewal
        ? `Tu suscripción al Plan ${plan.name || plan.nombre} fue renovada por +${vigenciaDias} días adicionales.`
        : `Se activó el Plan ${plan.name || plan.nombre} (${storageLabel}) exitosamente en tu cuenta.`,
    };

    setReceipt(nextReceipt);
    setSubmitting(false);

    if (onPaymentSuccess) {
      onPaymentSuccess({
        plan,
        mode,
        pago: paymentRecord,
      });
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    color: colors.text,
    background: colors.surface,
    border: `1.5px solid ${colors.border}`,
    borderRadius: 10,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: colors.primaryDark,
    marginBottom: 6,
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: '28px 40px 80px 40px',
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box',
        background: colors.surfaceAlt,
      }}
    >
      {/* Barra superior de navegación de la pasarela */}
      <div
        style={{
          maxWidth: 1060,
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: colors.surface,
            color: colors.primaryDark,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>←</span>
          Volver a Planes y Suscripciones
        </button>
      </div>

      {/* Vista de Comprobante cuando el pago fue aprobado */}
      {receipt ? (
        <div
          style={{
            maxWidth: 620,
            margin: '20px auto 0',
            background: colors.surface,
            borderRadius: 20,
            border: `1.5px solid ${colors.success}`,
            padding: '36px 32px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: colors.successSoft,
                color: colors.successDark,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Icon name="check" size={30} color={colors.successDark} strokeWidth={2.5} />
            </div>
            <div
              style={{
                display: 'inline-block',
                background: colors.successSoft,
                color: colors.successDark,
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 99,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginBottom: 8,
              }}
            >
              Transacción Aprobada
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: '0 0 6px' }}>
              ¡Tu plan {receipt.planNombre} está activo!
            </h2>
            <p style={{ fontSize: 14, color: colors.muted, margin: 0 }}>
              {receipt.mensaje}
            </p>
          </div>

          <div
            style={{
              background: colors.surfaceAlt,
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              padding: '20px 22px',
              marginBottom: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: colors.muted, fontWeight: 600 }}>Referencia de pago</span>
              <span style={{ color: colors.primaryDark, fontWeight: 800, fontFamily: 'monospace' }}>
                {receipt.referencia}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: colors.muted, fontWeight: 600 }}>Plan y Decorador aplicado</span>
              <span style={{ color: colors.text, fontWeight: 700 }}>
                {receipt.planNombre} ({receipt.claseDecorador})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: colors.muted, fontWeight: 600 }}>Nueva capacidad total</span>
              <span style={{ color: colors.primary, fontWeight: 800 }}>
                {receipt.almacenamiento}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: colors.muted, fontWeight: 600 }}>Método de pago</span>
              <span style={{ color: colors.text, fontWeight: 700 }}>
                Tarjeta terminada en •••• {receipt.tarjetaUltimos4}
              </span>
            </div>
            <div
              style={{
                borderTop: `1px dashed ${colors.borderDashed}`,
                paddingTop: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ color: colors.primaryDark, fontWeight: 800, fontSize: 14 }}>
                Monto total cobrado
              </span>
              <span style={{ color: colors.primary, fontWeight: 800, fontSize: 22 }}>
                Q{receipt.monto.toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={onBack}
            style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 14 }}
          >
            Volver a Suscripciones
          </Button>
        </div>
      ) : (
        /* Layout de 2 columnas: Resumen de Orden (Izquierda) + Formulario de Tarjeta (Derecha) */
        <div
          style={{
            maxWidth: 1060,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 28,
            alignItems: 'start',
          }}
        >
          {/* COLUMNA IZQUIERDA: Resumen del Plan y desglose del Patrón Decorator */}
          <div
            style={{
              background: colors.surface,
              borderRadius: 20,
              border: `1px solid ${colors.border}`,
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ ...sectionLabelStyle, color: colors.primary, marginBottom: 8 }}>
              {isRenewal ? 'RENOVACIÓN DE SUSCRIPCIÓN' : 'RESUMEN DE LA ORDEN'}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: '0 0 6px' }}>
              Plan {plan.name || plan.nombre}
            </h2>
            <p style={{ fontSize: 13, color: colors.muted, margin: '0 0 20px', lineHeight: 1.5 }}>
              {plan.subtitle || plan.descripcionOriginal || 'Suscripción de almacenamiento en la nube VinCloud.'}
            </p>

            {/* Tarjeta de capacidad de almacenamiento */}
            <div
              style={{
                background: colors.primarySoft,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: colors.primary,
                  color: colors.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name="cloud" size={22} color={colors.surface} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: colors.primaryDark, lineHeight: 1.1 }}>
                  {storageLabel} de almacenamiento
                </div>
                <div style={{ fontSize: 12, color: colors.primary, fontWeight: 600, marginTop: 3 }}>
                  Patrón Decorator: PlanGratuito → {decoratorClass}
                </div>
              </div>
            </div>

            {/* Beneficios incluidos */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>
                BENEFICIOS INCLUIDOS EN EL PLAN
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      fontSize: 13,
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
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Desglose de costos */}
            <div
              style={{
                borderTop: `1px solid ${colors.border}`,
                paddingTop: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: colors.muted }}>Plan actual antes del pago</span>
                <span style={{ color: colors.text, fontWeight: 700 }}>{currentPlanName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: colors.muted }}>Componente base (PlanGratuito · 5 GB)</span>
                <span style={{ color: colors.text, fontWeight: 600 }}>Q0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: colors.muted }}>Decorador {decoratorClass} (+ costo)</span>
                <span style={{ color: colors.text, fontWeight: 600 }}>Q{price.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: colors.muted }}>Vigencia de la suscripción</span>
                <span style={{ color: colors.text, fontWeight: 600 }}>{vigenciaDias} días</span>
              </div>

              <div
                style={{
                  borderTop: `1px dashed ${colors.borderDashed}`,
                  marginTop: 6,
                  paddingTop: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: colors.primaryDark }}>
                  Total a pagar
                </span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: colors.primary }}>
                    Q{price.toFixed(2)}
                  </span>
                  <div style={{ fontSize: 11, color: colors.muted }}>
                    Impuestos incluidos · Quetzales (GTQ)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Tarjeta Visual Interactiva + Formulario de Pago */}
          <div
            style={{
              background: colors.surface,
              borderRadius: 20,
              border: `1px solid ${colors.border}`,
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ ...sectionLabelStyle, color: colors.primary, marginBottom: 6 }}>
              MÉTODO DE PAGO
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: colors.primaryDark, margin: '0 0 18px' }}>
              Tarjeta de Crédito o Débito
            </h3>

            {/* Tarjeta bancaria interactiva */}
            <div
              style={{
                background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 65%, ${colors.ink} 100%)`,
                borderRadius: 18,
                padding: '22px 24px',
                color: colors.surface,
                marginBottom: 24,
                boxShadow: '0 10px 24px rgba(59, 10, 31, 0.22)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 184,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Chip EMV */}
                <div
                  style={{
                    width: 42,
                    height: 30,
                    borderRadius: 6,
                    background: colors.warningLight,
                    border: `1px solid ${colors.warning}`,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                    padding: 4,
                  }}
                >
                  <div style={{ border: `1px solid ${colors.warningDark}`, borderRadius: 2 }} />
                  <div style={{ border: `1px solid ${colors.warningDark}`, borderRadius: 2 }} />
                  <div style={{ border: `1px solid ${colors.warningDark}`, borderRadius: 2 }} />
                  <div style={{ border: `1px solid ${colors.warningDark}`, borderRadius: 2 }} />
                </div>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 1.4,
                    padding: '4px 10px',
                    borderRadius: 99,
                    background: colors.ink,
                    color: colors.surface,
                  }}
                >
                  {cardBrand}
                </span>
              </div>

              <div
                style={{
                  fontSize: 21,
                  fontWeight: 700,
                  letterSpacing: 2.5,
                  fontFamily: 'monospace',
                  margin: '18px 0 14px',
                  color: colors.surface,
                }}
              >
                {maskedDisplay}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 10, color: colors.border, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Titular de la tarjeta
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.surface, marginTop: 2 }}>
                    {holderDisplay}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: colors.border, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Vence
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.surface, marginTop: 2 }}>
                    {expiryDisplay}
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div style={{ marginBottom: 16 }}>
                <Alert variant="error">{errorMessage}</Alert>
              </div>
            )}

            {/* Formulario bancario */}
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle} htmlFor="payment-holder">
                  Nombre en la tarjeta
                </label>
                <input
                  id="payment-holder"
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  style={inputStyle}
                  disabled={submitting}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle} htmlFor="payment-number">
                  Número de tarjeta
                </label>
                <input
                  id="payment-number"
                  type="text"
                  inputMode="numeric"
                  placeholder="•••• •••• •••• ••••"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 1 }}
                  disabled={submitting}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label style={labelStyle} htmlFor="payment-expiry">
                    Fecha de expiración
                  </label>
                  <input
                    id="payment-expiry"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    style={inputStyle}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="payment-cvv">
                    Código CVV
                  </label>
                  <input
                    id="payment-cvv"
                    type="password"
                    inputMode="numeric"
                    placeholder="•••"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={inputStyle}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Opción para simular rechazo de pasarela en pruebas */}
              <div
                style={{
                  background: simulateReject ? colors.warningSoft : colors.surfaceAlt,
                  border: `1px solid ${simulateReject ? colors.warning : colors.border}`,
                  borderRadius: 12,
                  padding: '10px 14px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: simulateReject ? colors.warningDark : colors.muted,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={simulateReject}
                    onChange={(e) => setSimulateReject(e.target.checked)}
                    disabled={submitting}
                  />
                  Simular rechazo bancario (o usa terminación 0000)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!cardHolder) setCardHolder('Cliente VinCloud');
                    setCardNumber('4532 8910 2234 4242');
                    setExpiry('12/28');
                    setCvv('842');
                    setSimulateReject(false);
                  }}
                  style={{
                    background: colors.primarySoft,
                    color: colors.primary,
                    border: 'none',
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Autocompletar prueba
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background: submitting ? colors.subtle : colors.primary,
                    color: colors.surface,
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'background 0.2s ease',
                  }}
                >
                  <Icon name="card" size={18} color={colors.surface} />
                  {submitting
                    ? 'Procesando pago con la pasarela...'
                    : isRenewal
                      ? `Pagar Q${price.toFixed(2)} y Renovar Suscripción`
                      : `Pagar Q${price.toFixed(2)} y Activar Plan ${plan.name || plan.nombre}`}
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '11px 20px',
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    color: colors.muted,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancelar y volver a los planes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentGatewayScreen;
