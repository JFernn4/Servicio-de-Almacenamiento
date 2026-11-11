import { colors } from '../../../styles/theme';
import AdminStorageMetrics from './AdminStorageMetrics';

function formatBytes(bytes = 0) {
  const num = Number(bytes) || 0;
  if (num === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function formatDate(dateVal) {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal).slice(0, 10);
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Sección de métricas generales del servicio, almacenamiento en la nube,
 * desglose por plan e historial reciente de ingresos.
 */
function AdminReportSection({ report }) {
  const plans = report?.planes || [];
  const recentPayments = report?.pagosRecientes || [];

  return (
    <section
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: colors.primaryDark, marginBottom: 4 }}>
          Reporte General del Servicio
        </div>
        <div style={{ fontSize: 12.5, color: colors.muted }}>
          Supervisión en vivo del consumo de infraestructura, suscripciones activas e ingresos registrados.
        </div>
      </div>

      {/* Tarjetas de métricas principales */}
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
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' }}>
            Usuarios Activos
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.primaryDark, marginTop: 4 }}>
            {report ? report.usuariosActivos : '-'}
          </div>
          <div style={{ fontSize: 11.5, color: colors.subtle, marginTop: 2 }}>
            {report ? `${report.usuariosVerificados} con correo verificado` : ''}
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
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' }}>
            Espacio Total Consumido
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.primaryDark, marginTop: 4 }}>
            {report ? formatBytes(report.espacioTotalConsumido) : '-'}
          </div>
          <div style={{ fontSize: 11.5, color: colors.subtle, marginTop: 2 }}>
            {report ? `de ${formatBytes(report.espacioTotalDisponible)} asignados` : ''}
          </div>
        </div>

        <div
          style={{
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            borderLeft: `4px solid ${colors.info}`,
            borderRadius: 6,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' }}>
            Suscripciones Activas
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.primaryDark, marginTop: 4 }}>
            {report ? report.suscripcionesActivas : '-'}
          </div>
          <div style={{ fontSize: 11.5, color: colors.subtle, marginTop: 2 }}>
            {report ? `MRR: Q ${Number(report.ingresosMensualesActivos || 0).toFixed(2)} / mes` : ''}
          </div>
        </div>

        <div
          style={{
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            borderLeft: `4px solid ${colors.success}`,
            borderRadius: 6,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' }}>
            Ingresos por Suscripciones
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.successDark, marginTop: 4 }}>
            {report ? `Q ${Number(report.ingresosSimulados).toFixed(2)}` : '-'}
          </div>
          <div style={{ fontSize: 11.5, color: colors.subtle, marginTop: 2 }}>
            {report ? `${report.totalPagosAprobados || 0} pago(s) aprobado(s)` : ''}
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
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' }}>
            Archivos / Carpetas
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.primaryDark, marginTop: 4 }}>
            {report ? `${report.totalArchivos} arch.` : '-'}
          </div>
          <div style={{ fontSize: 11.5, color: colors.subtle, marginTop: 2 }}>
            {report ? `${report.totalCarpetas} carpetas creadas` : ''}
          </div>
        </div>
      </div>

      {/* Métricas de almacenamiento físico vs cuota contratada */}
      <AdminStorageMetrics almacenamiento={report?.almacenamiento} />

      {/* Desglose de ingresos por plan */}
      {plans.length > 0 && (
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: colors.primaryDark, marginBottom: 8 }}>
            Ingresos y Suscriptores por Plan
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {plans.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: colors.surfaceAlt,
                  border: `1px solid ${colors.borderLight}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.primaryDark }}>
                    {p.nombre}{' '}
                    {!p.activo && (
                      <span style={{ fontSize: 10, color: colors.muted, fontWeight: 600 }}>(Inactivo)</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: colors.muted }}>
                    {p.usuariosSuscritos} {p.usuariosSuscritos === 1 ? 'suscriptor' : 'suscriptores'} · Q {Number(p.precio).toFixed(2)}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: colors.successDark }}>
                  Q {Number(p.ingresosPlan || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimos pagos registrados */}
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: colors.primaryDark, marginBottom: 8 }}>
          Últimos Pagos Registrados
        </div>
        {recentPayments.length === 0 ? (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: colors.surfaceAlt,
              border: `1px dashed ${colors.borderDashed}`,
              fontSize: 12,
              color: colors.muted,
            }}
          >
            Aún no hay pagos aprobados registrados en PostgreSQL. Las métricas se actualizan automáticamente en cuanto un cliente contrata o renueva un plan conectado al servidor.
          </div>
        ) : (
          <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: colors.borderLight, color: colors.muted, textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 10px', borderBottom: `1px solid ${colors.border}` }}>Cliente</th>
                  <th style={{ padding: '8px 10px', borderBottom: `1px solid ${colors.border}` }}>Plan</th>
                  <th style={{ padding: '8px 10px', borderBottom: `1px solid ${colors.border}` }}>Tipo</th>
                  <th style={{ padding: '8px 10px', borderBottom: `1px solid ${colors.border}` }}>Monto</th>
                  <th style={{ padding: '8px 10px', borderBottom: `1px solid ${colors.border}` }}>Estado</th>
                  <th style={{ padding: '8px 10px', borderBottom: `1px solid ${colors.border}` }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((pg) => (
                  <tr key={pg.id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                    <td style={{ padding: '8px 10px' }}>
                      <strong style={{ color: colors.primaryDark }}>{pg.usuarioNombre}</strong>
                      <br />
                      <small style={{ color: colors.muted }}>{pg.usuarioCorreo}</small>
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{pg.planNombre}</td>
                    <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>{pg.tipo}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: colors.primaryDark }}>
                      Q {Number(pg.monto).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: 99,
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background:
                            pg.estado === 'aprobado'
                              ? colors.successSoft
                              : pg.estado === 'rechazado'
                              ? '#FEE2E2'
                              : colors.warningSoft,
                          color:
                            pg.estado === 'aprobado'
                              ? colors.successDark
                              : pg.estado === 'rechazado'
                              ? '#991B1B'
                              : colors.warningDark,
                        }}
                      >
                        {pg.estado}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: colors.muted }}>{formatDate(pg.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminReportSection;
