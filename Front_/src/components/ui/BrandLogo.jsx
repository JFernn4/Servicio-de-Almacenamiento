import Icon from './Icon';
import { colors } from '../../styles/theme';

/**
 * Logo de VinCloud. `compact` es la versión pequeña del menú lateral.
 */
function BrandLogo({ compact = false }) {
  const box = compact ? 32 : 42;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 12 }}>
      <div
        style={{
          width: box,
          height: box,
          background: colors.primary,
          borderRadius: compact ? 8 : 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(compact ? {} : { border: '2px solid #fff', boxShadow: '0 4px 12px rgba(125, 21, 53, 0.25)' }),
        }}
      >
        <Icon name="cloud" size={compact ? 18 : 22} fill="#fff" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: compact ? 16 : 22, fontWeight: 800, color: colors.primaryDark, lineHeight: compact ? 1 : 'normal' }}>
          VinCloud
        </span>
        {compact && <span style={{ fontSize: 11, color: colors.subtle }}>Almacenamiento</span>}
      </div>
    </div>
  );
}

export default BrandLogo;
