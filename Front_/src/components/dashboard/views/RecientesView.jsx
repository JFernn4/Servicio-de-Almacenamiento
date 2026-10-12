import ViewHeader from '../ViewHeader';
import SearchInput from '../SearchInput';
import EmptyState from '../EmptyState';
import FileTable from '../FileTable';
import { sectionLabelStyle } from '../../../styles/theme';

// Sin backend de archivos todavía: el usuario siempre ve el estado vacío.
const files = [];

function RecientesView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ViewHeader title="Recientes" subtitle="Tus archivos abiertos o modificados en la última semana">
        <SearchInput placeholder="Buscar en recientes..." />
      </ViewHeader>

      <div style={{ padding: 32, overflowY: 'auto' }}>
        <div style={{ ...sectionLabelStyle, marginBottom: 16 }}>Esta semana</div>
        {files.length === 0 ? (
          <EmptyState icon="clock">
            Aún no tienes archivos recientes. Tus archivos abiertos recientemente aparecerán aquí.
          </EmptyState>
        ) : (
          <FileTable files={files} dateLabel="Última apertura" />
        )}
      </div>
    </div>
  );
}

export default RecientesView;
