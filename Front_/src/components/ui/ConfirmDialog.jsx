import { useEffect } from 'react';
import Icon from './Icon';
import { colors } from '../../styles/theme';

const DANGER_SOFT = '#FEF2F2';

/**
 * Diálogo de confirmación con el mismo estilo que el modal de "Nueva carpeta".
 * Reemplaza a window.confirm. Escape o clic fuera = cancelar.
 */
function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', icon = 'trash', onConfirm, onCancel }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 20,
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.surface,
          borderRadius: 16,
          width: '100%',
          maxWidth: 420,
          padding: 28,
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
              background: DANGER_SOFT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={icon} size={20} color={colors.danger} />
          </div>
          <h3 id="confirm-dialog-title" style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.primaryDark }}>
            {title}
          </h3>
        </div>

        <p id="confirm-dialog-message" style={{ margin: '0 0 24px', fontSize: 14, lineHeight: 1.5, color: colors.muted }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.muted,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              background: colors.primary,
              color: colors.surface,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
