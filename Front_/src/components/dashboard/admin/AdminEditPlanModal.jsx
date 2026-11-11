import { useState, useEffect } from 'react';
import Icon from '../../ui/Icon';
import { colors } from '../../../styles/theme';

const GB_BYTES = 1024 ** 3;

/**
 * Formulario interno aislado por `key={plan.id}` para inicializar el estado sin useEffect.
 */
function EditPlanForm({ plan, onClose, onSave }) {
  const gbInitial = Number(plan.capacidadAlmacenamiento || 0) / GB_BYTES;
  const [nombre, setNombre] = useState(plan.nombre || '');
  const [descripcion, setDescripcion] = useState(plan.descripcion || '');
  const [precio, setPrecio] = useState(String(plan.precio ?? 0));
  const [capacidadGb, setCapacidadGb] = useState(
    Number.isInteger(gbInitial) ? String(gbInitial) : gbInitial.toFixed(2)
  );
  const [vigenciaDias, setVigenciaDias] = useState(String(plan.vigenciaDias ?? 30));
  const [activo, setActivo] = useState(Boolean(plan.activo));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitting, onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanName = nombre.trim();
    const numPrecio = Number(precio);
    const numGb = Number(capacidadGb);
    const numDias = Number(vigenciaDias);

    if (!cleanName) {
      setError('El nombre del plan es obligatorio.');
      return;
    }
    if (!Number.isFinite(numPrecio) || numPrecio < 0) {
      setError('El precio debe ser un número mayor o igual a 0.');
      return;
    }
    if (!Number.isFinite(numGb) || numGb <= 0) {
      setError('La capacidad debe ser mayor a 0 GB.');
      return;
    }
    if (!Number.isInteger(numDias) || numDias <= 0) {
      setError('La vigencia en días debe ser un número entero mayor a 0.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSave(plan.id, {
        nombre: cleanName,
        descripcion: descripcion.trim(),
        precio: Number(numPrecio.toFixed(2)),
        capacidadGb: numGb,
        vigenciaDias: numDias,
        activo,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el plan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      onClick={!submitting ? onClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 210,
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.surface,
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          padding: 24,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 42,
              height: 42,
              flexShrink: 0,
              borderRadius: 10,
              background: colors.primarySoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="edit" size={20} color={colors.primary} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.primaryDark }}>
              Editar Plan #{plan.id}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: colors.subtle }}>
              Modifica los detalles, precio, cuota o vigencia de este plan
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              background: '#FEE2E2',
              color: '#991B1B',
              border: '1px solid #FECACA',
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 5 }}>
              Nombre del Plan
            </label>
            <input
              type="text"
              required
              autoFocus
              disabled={submitting}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.surfaceAlt,
                fontSize: 13.5,
                color: colors.text,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 5 }}>
              Descripción
            </label>
            <input
              type="text"
              disabled={submitting}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción breve del plan"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.surfaceAlt,
                fontSize: 13.5,
                color: colors.text,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 5 }}>
                Precio (Q)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                disabled={submitting}
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.surfaceAlt,
                  fontSize: 13.5,
                  color: colors.text,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 5 }}>
                Capacidad (GB)
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                disabled={submitting}
                value={capacidadGb}
                onChange={(e) => setCapacidadGb(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.surfaceAlt,
                  fontSize: 13.5,
                  color: colors.text,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 5 }}>
                Vigencia (días)
              </label>
              <input
                type="number"
                min="1"
                required
                disabled={submitting}
                value={vigenciaDias}
                onChange={(e) => setVigenciaDias(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.surfaceAlt,
                  fontSize: 13.5,
                  color: colors.text,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              fontWeight: 600,
              color: colors.primaryDark,
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 8,
              background: colors.surfaceAlt,
              border: `1px solid ${colors.borderLight}`,
            }}
          >
            <input
              type="checkbox"
              checked={activo}
              disabled={submitting}
              onChange={(e) => setActivo(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: colors.primary }}
            />
            Plan visible y disponible para suscripción (Activo)
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                color: colors.muted,
                fontWeight: 700,
                fontSize: 13,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: 'none',
                background: colors.primary,
                color: colors.surface,
                fontWeight: 700,
                fontSize: 13,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal completo para editar todos los atributos de un plan existente
 * (nombre, descripción, precio, capacidad en GB, vigencia y estado activo).
 */
function AdminEditPlanModal({ plan, onClose, onSave }) {
  if (!plan) return null;
  return <EditPlanForm key={plan.id} plan={plan} onClose={onClose} onSave={onSave} />;
}

export default AdminEditPlanModal;
