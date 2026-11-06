import { useState, useEffect, useRef } from 'react';
import Icon from '../../ui/Icon';
import { colors } from '../../../styles/theme';

/**
 * Modal estilizado para renombrar archivos o carpetas.
 * Reemplaza a window.prompt con la identidad visual de VinCloud.
 */
function RenameModal({ isOpen, item, onClose, onConfirm }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && item) {
      setName(item.name || '');
      setError('');
      setSubmitting(false);

      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const fullName = item.name || '';
          const lastDot = fullName.lastIndexOf('.');
          if (item.type !== 'folder' && lastDot > 0) {
            inputRef.current.setSelectionRange(0, lastDot);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, item]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !item) return null;

  const isFolder = item.type === 'folder';

  async function handleSubmit(e) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError(`El nombre de ${isFolder ? 'la carpeta' : 'el archivo'} no puede estar vacío.`);
      return;
    }
    if (clean === item.name) {
      onClose();
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onConfirm(clean);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al renombrar el elemento.');
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
        zIndex: 200,
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
          maxWidth: 420,
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
            <Icon name={isFolder ? 'folder' : 'edit'} size={20} color={colors.primary} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.primaryDark }}>
              {isFolder ? 'Renombrar carpeta' : 'Renombrar archivo'}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: colors.subtle }}>
              {isFolder ? 'Cambia el nombre de la carpeta' : 'Escribe el nuevo nombre para este archivo'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              htmlFor="rename-item-input"
              style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 6 }}
            >
              Nuevo nombre
            </label>
            <input
              id="rename-item-input"
              ref={inputRef}
              type="text"
              value={name}
              disabled={submitting}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: `1px solid ${error ? colors.danger : colors.border}`,
                background: colors.surfaceAlt,
                fontSize: 14,
                color: colors.text,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: colors.danger, marginTop: 6, fontWeight: 600 }}>
                {error}
              </div>
            )}
          </div>

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
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RenameModal;

