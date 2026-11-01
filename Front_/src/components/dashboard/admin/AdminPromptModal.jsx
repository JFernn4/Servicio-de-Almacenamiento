import { colors } from '../../../styles/theme';

/**
 * Modal interactivo para edición de precio o cuota (Clean Code: componente modal desacoplado < 95 líneas).
 */
function AdminPromptModal({ promptModal, setPromptModal }) {
  if (!promptModal) return null;

  return (
    <div
      onClick={() => setPromptModal(null)}
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
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.surface,
          borderRadius: 12,
          width: '100%',
          maxWidth: 380,
          padding: 24,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: colors.primaryDark }}>
          {promptModal.title}
        </h3>
        <label style={{ display: 'block', fontSize: 12.5, color: colors.muted, marginBottom: 8 }}>
          {promptModal.label}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          autoFocus
          value={promptModal.value}
          onChange={(e) => setPromptModal({ ...promptModal, value: e.target.value })}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 6,
            border: `1px solid ${colors.borderDashed}`,
            fontSize: 14,
            marginBottom: 16,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={() => setPromptModal(null)}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.muted,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              const val = promptModal.value;
              const fn = promptModal.onConfirm;
              setPromptModal(null);
              fn(val);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              background: colors.primary,
              color: colors.surface,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPromptModal;
