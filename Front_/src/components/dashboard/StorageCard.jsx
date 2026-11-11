import { colors } from '../../styles/theme';
import { formatBytes, getStorageUsage } from '../../utils/user';

/**
 * Uso de almacenamiento del usuario con barra de progreso.
 */
function StorageCard({ user }) {
  const { used, total, percent, percentLabel, barWidth, freeFormatted } = getStorageUsage(user);
  const barColor = percent >= 90 ? colors.danger : percent >= 75 ? colors.warningDark : colors.primary;

  return (
    <div style={{ background: colors.surfaceAlt, borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: colors.primaryDark }}>{formatBytes(used)} usados</span>
        <span style={{ fontSize: 12, color: colors.subtle }}>de {formatBytes(total)}</span>
      </div>
      <div style={{ height: 6, background: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
        <div
          style={{
            height: '100%',
            width: `${barWidth}%`,
            background: barColor,
            borderRadius: 4,
            transition: 'width 0.35s ease, background-color 0.35s ease',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: barColor, fontWeight: 700 }}>{percentLabel}% usado</span>
        <span style={{ color: colors.subtle }}>{freeFormatted} libres</span>
      </div>
    </div>
  );
}

export default StorageCard;
