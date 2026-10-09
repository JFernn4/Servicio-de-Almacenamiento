import Icon from '../../ui/Icon';
import ViewHeader from '../ViewHeader';
import SearchInput from '../SearchInput';
import EmptyState from '../EmptyState';
import FileTable from '../FileTable';
import { colors, sectionLabelStyle } from '../../../styles/theme';

// Sin backend de archivos todavía: el usuario siempre ve el estado vacío.
const folders = [];
const files = [];

const actionButtonStyle = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: `1px solid ${colors.primary}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' };

function MisArchivosView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ViewHeader title="Mis Archivos" subtitle={`${folders.length} carpetas · ${files.length} archivos`}>
        <SearchInput placeholder="Buscar archivos..." />
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" style={{ ...actionButtonStyle, background: colors.surface, color: colors.primary }}>
            <Icon name="upload" size={14} />
            Subir archivo
          </button>
          <button type="button" style={{ ...actionButtonStyle, background: colors.primary, color: '#fff' }}>
            <Icon name="folderPlus" size={14} />
            Nueva carpeta
          </button>
        </div>
      </ViewHeader>

      <div style={{ padding: 32, overflowY: 'auto' }}>
        <div style={{ ...sectionLabelStyle, marginBottom: 16 }}>Carpetas</div>
        {folders.length === 0 ? (
          <EmptyState style={{ padding: 32, marginBottom: 32 }}>
            Aún no tienes carpetas. Haz clic en &quot;Nueva carpeta&quot; para crear una.
          </EmptyState>
        ) : (
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
            {folders.map((folder) => (
              <div key={folder.id} style={{ background: colors.surface, borderRadius: 12, padding: 16, width: 200, border: `1px solid ${colors.border}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Icon name="folder" size={24} fill="#FCA5A5" />
                  <Icon name="more" size={16} color={colors.subtle} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.primaryDark, marginBottom: 4 }}>{folder.name}</div>
                <div style={{ fontSize: 12, color: colors.subtle }}>{folder.elements} elementos · {folder.date}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...sectionLabelStyle, marginBottom: 16 }}>Archivos</div>
        {files.length === 0 ? (
          <EmptyState icon="file">
            Tu espacio está vacío. Comienza subiendo tus primeros archivos corporativos.
          </EmptyState>
        ) : (
          <FileTable files={files} dateLabel="Modificado" />
        )}
      </div>
    </div>
  );
}

export default MisArchivosView;
