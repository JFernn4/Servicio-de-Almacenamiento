import { colors } from '../../../styles/theme';

function formatBytes(bytes = 0) {
  const num = Number(bytes) || 0;
  if (num === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Tabla y gestión de usuarios clientes (Clean Code: responsabilidad única sobre usuarios).
 */
function AdminUsersSection({
  filteredUsers,
  openChangeUserQuota,
  handleToggleUserRole,
  handleRemoveUser,
}) {
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
        Planes de Usuarios y Gestión de Cuentas
      </div>
      <div style={{ fontSize: 12.5, color: colors.muted, marginBottom: 14 }}>
        Supervisa el plan contratado, consumo de almacenamiento y administra cuentas de clientes.
      </div>

      <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: colors.borderLight, color: colors.muted, textAlign: 'left', fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>ID</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Usuario</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Rol</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Plan Actual</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Consumo / Cuota</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Verificado</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '14px 12px', color: colors.muted }}>
                  No hay usuarios registrados para mostrar.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const planText = u.suscripcionActiva
                  ? `${u.suscripcionActiva.planNombre} (${u.suscripcionActiva.diasRestantes}d)`
                  : 'Gratuito (5 GB)';
                const isAdmin = u.rol === 'Administrador';
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                    <td style={{ padding: '9px 12px' }}>{u.id}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <strong style={{ color: colors.primaryDark }}>{u.nombre}</strong>
                      <br />
                      <small style={{ color: colors.muted }}>{u.correo}</small>
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          background: isAdmin ? colors.primarySoft : colors.infoSoft,
                          color: isAdmin ? colors.primary : colors.info,
                        }}
                      >
                        {u.rol}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px' }}>{planText}</td>
                    <td style={{ padding: '9px 12px' }}>
                      {formatBytes(u.espacioConsumido)} / {formatBytes(u.espacioDisponible)}
                    </td>
                    <td style={{ padding: '9px 12px' }}>{u.correoVerificado ? 'Sí' : 'No'}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => openChangeUserQuota(u.id)}
                          style={{
                            background: colors.surface,
                            color: colors.primary,
                            border: `1px solid ${colors.primary}`,
                            borderRadius: 6,
                            padding: '5px 9px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Cuota
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleUserRole(u.id, u.rol)}
                          style={{
                            background: colors.surface,
                            color: colors.primary,
                            border: `1px solid ${colors.primary}`,
                            borderRadius: 6,
                            padding: '5px 9px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Rol
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(u.id)}
                          style={{
                            background: '#FEE2E2',
                            color: '#991B1B',
                            border: '1px solid #FECACA',
                            borderRadius: 6,
                            padding: '5px 9px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminUsersSection;
