import Icon from '../../ui/Icon';
import ViewHeader from '../ViewHeader';
import EmptyState from '../EmptyState';
import { colors } from '../../../styles/theme';

function PapeleraView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ViewHeader title="Papelera" subtitle="0 elementos eliminados">
        <button
          type="button"
          disabled
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: colors.surface, border: `1px solid ${colors.danger}`, color: colors.danger, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'not-allowed', opacity: 0.5 }}
        >
          <Icon name="trash" size={14} />
          Vaciar papelera
        </button>
      </ViewHeader>

      <div style={{ padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFBEB', border: '1px solid #FEF08A', padding: '16px 24px', borderRadius: 12, color: '#B45309', fontSize: 14, fontWeight: 500 }}>
          <Icon name="alert" />
          Los archivos en la papelera se eliminan permanentemente después de 30 días.
        </div>

        <EmptyState icon="trash">Tu papelera está vacía.</EmptyState>
      </div>
    </div>
  );
}

export default PapeleraView;
