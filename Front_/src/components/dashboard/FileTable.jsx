import { useState } from 'react';
import Icon from '../ui/Icon';
import { colors, sectionLabelStyle, resetButtonStyle } from '../../styles/theme';

/**
 * Tabla de archivos compartida por "Mis Archivos", "Recientes" y "Papelera".
 * Cada archivo: { id, name, type, size, date, color }.
 */
function FileTable({
  files,
  dateLabel,
  onPreview,
  onDownload,
  onShare,
  onRename,
  onRestore,
  onDelete,
  deleteLabel = 'Eliminar',
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <div style={{ background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'visible' }}>
      <div style={{ ...sectionLabelStyle, display: 'flex', padding: '12px 24px', background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}`, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
        <div style={{ flex: 2 }}>Nombre</div>
        <div style={{ flex: 1 }}>Tamaño</div>
        <div style={{ flex: 1 }}>{dateLabel}</div>
        <div style={{ width: 32 }} />
      </div>

      {files.map((file) => {
        const isMenuOpen = openMenuId === file.id;
        return (
          <div
            key={file.id}
            className="file-row"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '16px 24px', fontSize: 13, color: colors.muted, borderBottom: `1px solid ${colors.borderLight}` }}
          >
            <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: `${file.color}22`, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: file.color, fontSize: 10, fontWeight: 800 }}>
                {file.type}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.primaryDark }}>{file.name}</span>
            </div>
            <div style={{ flex: 1 }}>{file.size}</div>
            <div style={{ flex: 1 }}>{file.date}</div>

            {(onPreview || onDownload || onShare || onRename || onRestore || onDelete) && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  aria-label={`Opciones de ${file.name}`}
                  onClick={() => setOpenMenuId(isMenuOpen ? null : file.id)}
                  style={{ ...resetButtonStyle, padding: 6, borderRadius: 6, color: colors.subtle }}
                >
                  <Icon name="more" size={16} color={colors.subtle} />
                </button>

                {isMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: 4,
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.1)',
                      zIndex: 20,
                      minWidth: 180,
                      overflow: 'hidden',
                    }}
                  >
                    {onRestore && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onRestore(file);
                        }}
                        style={{ ...resetButtonStyle, display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: colors.primary }}
                      >
                        Restaurar
                      </button>
                    )}
                    {onPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onPreview(file);
                        }}
                        style={{ ...resetButtonStyle, display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: colors.primaryDark }}
                      >
                        Visualizar
                      </button>
                    )}
                    {onDownload && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onDownload(file);
                        }}
                        style={{ ...resetButtonStyle, display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: colors.primaryDark }}
                      >
                        Descargar
                      </button>
                    )}
                    {onShare && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onShare(file);
                        }}
                        style={{ ...resetButtonStyle, display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: colors.primary }}
                      >
                        Enviar invitación / Compartir
                      </button>
                    )}
                    {onRename && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onRename(file);
                        }}
                        style={{ ...resetButtonStyle, display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: colors.primaryDark }}
                      >
                        Renombrar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onDelete(file);
                        }}
                        style={{ ...resetButtonStyle, display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: colors.danger }}
                      >
                        {deleteLabel}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default FileTable;
