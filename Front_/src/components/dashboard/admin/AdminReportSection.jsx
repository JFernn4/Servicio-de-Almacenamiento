import { colors } from '../../../styles/theme';

function formatBytes(bytes = 0) {
  const num = Number(bytes) || 0;
  if (num === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Sección de métricas generales del servicio (Clean Code: componente enfocado < 100 líneas).
 */
function AdminReportSection({ report }) {
  return (
    <section
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 800, color: colors.primaryDark, marginBottom: 4 }}>
        Reporte General del Servicio
      </div>
      <div style={{ fontSize: 12.5, color: colors.muted, marginBottom: 14 }}>
        Supervisión del consumo total de infraestructura, usuarios activos e ingresos por suscripciones.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <div
          style={{
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            borderLeft: `4px solid ${colors.primary}`,
            borderRadius: 6,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' }}>
            Usuarios Activos
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.primaryDark, marginTop: 4 }}>
            {report ? `${report.usuariosActivos} (${report.usuariosVerificados} verif.)` : '-'}
          </div>
        </div>

        <div
          style={{
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            borderLeft: `4px solid ${colors.primary}`,
            borderRadius: 6,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' }}>
            Espacio Total Consumido
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.primaryDark, marginTop: 4 }}>
            {report
              ? `${formatBytes(report.espacioTotalConsumido)} / ${formatBytes(report.espacioTotalDisponible)}`
              : '-'}
          </div>
        </div>

        <div
          style={{
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            borderLeft: `4px solid ${colors.primary}`,
            borderRadius: 6,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' }}>
            Ingresos por Suscripciones
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.primaryDark, marginTop: 4 }}>
            {report ? `Q ${Number(report.ingresosSimulados).toFixed(2)}` : '-'}
          </div>
        </div>

        <div
          style={{
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            borderLeft: `4px solid ${colors.primary}`,
            borderRadius: 6,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' }}>
            Archivos / Carpetas
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.primaryDark, marginTop: 4 }}>
            {report ? `${report.totalArchivos} arch. / ${report.totalCarpetas} carp.` : '-'}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminReportSection;
