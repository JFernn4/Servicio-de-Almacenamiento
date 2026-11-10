import { colors } from '../../../styles/theme';
import { formatBytes } from '../../../utils/user';

/**
 * Barra de uso: cuánto ocupa `used` de `total`, con su porcentaje.
 */
function UsageBar({ label, used, total, percent, detail }) {
  const width = Math.min(100, percent ?? 0);
  const barColor = width >= 90 ? colors.danger : width >= 70 ? colors.warning : colors.primary;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, marginBottom: 6 }}>
        <span style={{ fontWeight: 700, color: colors.primaryDark }}>{label}</span>
        <span style={{ color: colors.muted }}>
          {formatBytes(used)} de {formatBytes(total)} · <strong style={{ color: barColor }}>{percent ?? 0}%</strong>
        </span>
      </div>
      <div style={{ height: 8, background: colors.border, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: barColor, borderRadius: 4 }} />
      </div>
      {detail && <div style={{ fontSize: 11.5, color: colors.subtle, marginTop: 4 }}>{detail}</div>}
    </div>
  );
}

/**
 * Métricas de almacenamiento del reporte del administrador: lo guardado en la nube
 * frente a la capacidad del proveedor y a la capacidad contratada por los usuarios.
 */
function AdminStorageMetrics({ almacenamiento }) {
  if (!almacenamiento) return null;
  const a = almacenamiento;

  return (
    <div
      style={{
        marginTop: 14,
        background: colors.surfaceAlt,
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.primary}`,
        borderRadius: 6,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' }}>
        Almacenamiento ({a.proveedor === 'supabase' ? 'Supabase Storage' : 'disco del servidor'})
      </div>

      {a.capacidadNubeBytes !== null ? (
        <UsageBar
          label="Espacio ocupado en la nube"
          used={a.almacenadoBytes}
          total={a.capacidadNubeBytes}
          percent={a.porcentajeNube}
          detail={`Quedan ${formatBytes(a.libreNubeBytes)} libres en el almacenamiento`}
        />
      ) : (
        <div style={{ fontSize: 12.5, color: colors.muted }}>
          Espacio ocupado: <strong style={{ color: colors.primaryDark }}>{formatBytes(a.almacenadoBytes)}</strong>{' '}
          (sin límite de capacidad configurado)
        </div>
      )}

      <UsageBar
        label="Uso de la capacidad contratada por los usuarios"
        used={a.almacenadoBytes}
        total={a.capacidadContratadaBytes}
        percent={a.porcentajeCapacidadContratada}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 12.5, color: colors.muted }}>
        <span>Archivos activos: <strong style={{ color: colors.primaryDark }}>{formatBytes(a.activosBytes)}</strong></span>
        <span>
          En papelera: <strong style={{ color: colors.primaryDark }}>{formatBytes(a.enPapeleraBytes)}</strong>{' '}
          ({a.archivosEnPapelera} {a.archivosEnPapelera === 1 ? 'archivo' : 'archivos'})
        </span>
      </div>
    </div>
  );
}

export default AdminStorageMetrics;
