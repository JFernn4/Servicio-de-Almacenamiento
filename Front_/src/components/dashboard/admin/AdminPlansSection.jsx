import { colors } from '../../../styles/theme';

function formatBytes(bytes = 0) {
  const num = Number(bytes) || 0;
  if (num === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Catálogo y gestión de planes de almacenamiento (Clean Code: responsabilidad única sobre planes).
 */
function AdminPlansSection({
  plans,
  planForm,
  setPlanForm,
  handleCreatePlan,
  handleTogglePlan,
  openEditPlanPrice,
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
        Catálogo de Planes de Almacenamiento
      </div>
      <div style={{ fontSize: 12.5, color: colors.muted, marginBottom: 14 }}>
        Crea nuevos planes o activa y desactiva los existentes en el catálogo.
      </div>

      <form
        onSubmit={handleCreatePlan}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 5 }}>
            Nombre del Plan
          </label>
          <input
            type="text"
            value={planForm.nombre}
            onChange={(e) => setPlanForm({ ...planForm, nombre: e.target.value })}
            placeholder="Ej. Corporativo Plus"
            required
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              border: `1px solid ${colors.borderDashed}`,
              borderRadius: 6,
              background: colors.surface,
              color: colors.text,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 5 }}>
            Descripción
          </label>
          <input
            type="text"
            value={planForm.descripcion}
            onChange={(e) => setPlanForm({ ...planForm, descripcion: e.target.value })}
            placeholder="Descripción breve"
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              border: `1px solid ${colors.borderDashed}`,
              borderRadius: 6,
              background: colors.surface,
              color: colors.text,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 5 }}>
            Precio (Q)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={planForm.precio}
            onChange={(e) => setPlanForm({ ...planForm, precio: e.target.value })}
            placeholder="95.00"
            required
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              border: `1px solid ${colors.borderDashed}`,
              borderRadius: 6,
              background: colors.surface,
              color: colors.text,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 5 }}>
            Capacidad (en GB) y Vigencia (días)
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              min="1"
              value={planForm.capacidadGb}
              onChange={(e) => setPlanForm({ ...planForm, capacidadGb: e.target.value })}
              placeholder="GB (ej. 500)"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 13,
                border: `1px solid ${colors.borderDashed}`,
                borderRadius: 6,
                background: colors.surface,
                color: colors.text,
              }}
            />
            <input
              type="number"
              min="1"
              value={planForm.vigenciaDias}
              onChange={(e) => setPlanForm({ ...planForm, vigenciaDias: e.target.value })}
              placeholder="Días"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 13,
                border: `1px solid ${colors.borderDashed}`,
                borderRadius: 6,
                background: colors.surface,
                color: colors.text,
              }}
            />
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <button
            type="submit"
            style={{
              background: colors.primary,
              color: colors.surface,
              border: 'none',
              borderRadius: 6,
              padding: '9px 16px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Crear Nuevo Plan
          </button>
        </div>
      </form>

      <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: colors.borderLight, color: colors.muted, textAlign: 'left', fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>ID</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Plan</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Precio</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Capacidad</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Vigencia</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Suscritos</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Estado</th>
              <th style={{ padding: '9px 12px', borderBottom: `1px solid ${colors.border}` }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '14px 12px', color: colors.muted }}>
                  No hay planes registrados en el catálogo todavía.
                </td>
              </tr>
            ) : (
              plans.map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                  <td style={{ padding: '9px 12px' }}>{p.id}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <strong style={{ color: colors.primaryDark }}>{p.nombre}</strong>
                    <br />
                    <small style={{ color: colors.muted }}>{p.descripcion || ''}</small>
                  </td>
                  <td style={{ padding: '9px 12px', fontWeight: 700 }}>Q {Number(p.precio).toFixed(2)}</td>
                  <td style={{ padding: '9px 12px' }}>{formatBytes(p.capacidadAlmacenamiento)}</td>
                  <td style={{ padding: '9px 12px' }}>{p.vigenciaDias} días</td>
                  <td style={{ padding: '9px 12px' }}>{p.suscripcionesActivas ?? 0}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 700,
                        background: p.activo ? colors.successSoft : '#FEE2E2',
                        color: p.activo ? colors.successDark : '#991B1B',
                      }}
                    >
                      {p.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePlan(p.id, !p.activo)}
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
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditPlanPrice(p.id, p.precio)}
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
                        Precio
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminPlansSection;
