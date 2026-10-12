import { colors } from '../../styles/theme';
import { formatBytes, getStorageUsage } from '../../utils/user';

/**
 * Uso de almacenamiento del usuario con barra de progreso.
 */
function StorageCard({ user }) {
  const { used, free, total, percent } = getStorageUsage(user);

  return (
    <div style={{ background: colors.surfaceAlt, borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: colors.primaryDark }}>{formatBytes(used)} usados</span>
        <span style={{ fontSize: 12, color: colors.subtle }}>de {formatBytes(total)}</span>
      </div>
      <div style={{ height: 6, background: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${percent}%`, background: colors.primary, borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: colors.primary, fontWeight: 700 }}>{percent}% usado</span>
        <span style={{ color: colors.subtle }}>{formatBytes(free)} libres</span>
      </div>
    </div>
  );
}

export default StorageCard;
