import Icon from '../ui/Icon';
import { colors } from '../../styles/theme';

/**
 * Recuadro punteado para listas vacías. `icon` es opcional.
 */
function EmptyState({ icon, children, style }) {
  return (
    <div style={{ padding: '48px 32px', textAlign: 'center', background: colors.surface, borderRadius: 12, border: `1px dashed ${colors.borderDashed}`, color: colors.subtle, ...style }}>
      {icon && <Icon name={icon} size={48} strokeWidth={1} color={colors.borderDashed} style={{ display: 'block', margin: '0 auto 12px' }} />}
      <p style={{ margin: 0 }}>{children}</p>
    </div>
  );
}

export default EmptyState;
