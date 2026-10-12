import Icon from '../ui/Icon';
import { colors, sectionLabelStyle } from '../../styles/theme';

/**
 * Tabla de archivos compartida por "Mis Archivos" y "Recientes".
 * Cada archivo: { id, name, type, size, date, color }.
 */
function FileTable({ files, dateLabel }) {
  return (
    <div style={{ background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
      <div style={{ ...sectionLabelStyle, display: 'flex', padding: '12px 24px', background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ flex: 2 }}>Nombre</div>
        <div style={{ flex: 1 }}>Tamaño</div>
        <div style={{ flex: 1 }}>{dateLabel}</div>
        <div style={{ width: 24 }} />
      </div>

      {files.map((file) => (
        <div key={file.id} className="file-row" style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', fontSize: 13, color: colors.muted }}>
          <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: `${file.color}33`, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: file.color, fontSize: 10, fontWeight: 800 }}>
              {file.type}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: colors.primaryDark }}>{file.name}</span>
          </div>
          <div style={{ flex: 1 }}>{file.size}</div>
          <div style={{ flex: 1 }}>{file.date}</div>
          <Icon name="more" size={16} color={colors.subtle} style={{ width: 24, cursor: 'pointer' }} />
        </div>
      ))}
    </div>
  );
}

export default FileTable;
