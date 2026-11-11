import { useState, useEffect } from 'react';
import Icon from '../../ui/Icon';
import Alert from '../../ui/Alert';
import { colors, resetButtonStyle } from '../../../styles/theme';
import { fetchAllFolders } from '../../../services/storageService';

/**
 * Modal para seleccionar la carpeta de destino y mover un archivo.
 */
function MoveModal({ isOpen, file, currentFolderId = null, onClose, onConfirm }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Identificar la carpeta actual del archivo
  const fileFolderId = file?.carpetaId ?? currentFolderId ?? null;

  useEffect(() => {
    if (!isOpen || !file) return;

    setError('');
    setSubmitting(false);
    setSelectedFolderId(fileFolderId);
    setLoading(true);

    let active = true;
    fetchAllFolders()
      .then((data) => {
        if (active) {
          setFolders(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'No se pudieron cargar las carpetas.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, file, fileFolderId]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !file) return null;

  const isSameLocation = (selectedFolderId ?? null) === (fileFolderId ?? null);

  async function handleMove() {
    if (isSameLocation) {
      setError('El archivo ya se encuentra en la carpeta seleccionada.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onConfirm(selectedFolderId);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al mover el archivo.');
      setSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.surface,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.22)',
          width: '100%',
          maxWidth: 460,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Encabezado */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: `1px solid ${colors.borderLight}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: colors.primarySoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.primary,
              }}
            >
              <Icon name="folder" size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.primaryDark }}>
                Mover archivo
              </h3>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 12,
                  color: colors.muted,
                  maxWidth: 320,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {file.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              ...resetButtonStyle,
              color: colors.subtle,
              padding: 4,
              borderRadius: 6,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Contenido / Lista de Carpetas */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {error && (
            <div style={{ marginBottom: 14 }}>
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.primaryDark, marginBottom: 10 }}>
            Elige la carpeta de destino:
          </div>

          {loading ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: colors.muted, fontSize: 13 }}>
              Cargando carpetas disponibles...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Opción: Mi unidad (Raíz) */}
              <div
                onClick={() => setSelectedFolderId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `1.5px solid ${selectedFolderId === null ? colors.primary : colors.borderLight}`,
                  background: selectedFolderId === null ? colors.primarySoft : colors.surface,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="cloud" size={18} color={selectedFolderId === null ? colors.primary : colors.muted} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: selectedFolderId === null ? colors.primaryDark : colors.text }}>
                      Mi unidad (Raíz)
                    </div>
                    <div style={{ fontSize: 11, color: colors.muted }}>Carpeta principal de tu cuenta</div>
                  </div>
                </div>
                {fileFolderId === null && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: colors.borderLight,
                      color: colors.muted,
                    }}
                  >
                    Ubicación actual
                  </span>
                )}
              </div>

              {/* Lista de Carpetas del Usuario */}
              {folders.map((f) => {
                const isSelected = Number(selectedFolderId) === Number(f.id);
                const isCurrent = Number(fileFolderId) === Number(f.id);

                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFolderId(f.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${isSelected ? colors.primary : colors.borderLight}`,
                      background: isSelected ? colors.primarySoft : colors.surface,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon name="folder" size={18} color={isSelected ? colors.primary : colors.muted} />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: isSelected ? colors.primaryDark : colors.text }}>
                          {f.nombre}
                        </div>
                        <div style={{ fontSize: 11, color: colors.muted }}>
                          {f.total_elementos ?? 0} elemento(s)
                        </div>
                      </div>
                    </div>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: colors.borderLight,
                          color: colors.muted,
                        }}
                      >
                        Ubicación actual
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '14px 24px',
            borderTop: `1px solid ${colors.borderLight}`,
            background: colors.surfaceAlt,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              ...resetButtonStyle,
              padding: '9px 16px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.muted,
              fontSize: 13,
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={submitting || isSameLocation || loading}
            style={{
              ...resetButtonStyle,
              padding: '9px 18px',
              borderRadius: 8,
              background: submitting || isSameLocation || loading ? colors.border : colors.primary,
              color: colors.surface,
              fontSize: 13,
              fontWeight: 700,
              cursor: submitting || isSameLocation || loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon name="folder" size={14} color={colors.surface} />
            {submitting ? 'Moviendo...' : 'Mover aquí'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoveModal;
