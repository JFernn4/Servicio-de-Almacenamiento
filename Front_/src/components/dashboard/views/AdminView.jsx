import { useState, useEffect, useCallback } from 'react';
import BrandLogo from '../../ui/BrandLogo';
import Icon from '../../ui/Icon';
import ViewHeader from '../ViewHeader';
import SearchInput from '../SearchInput';
import { colors, sectionLabelStyle, resetButtonStyle } from '../../../styles/theme';
import { getInitials } from '../../../utils/user';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'vincloud_token';

const ADMIN_NAV_ITEMS = [
  { id: 'todo', label: 'Panel General', icon: 'zap' },
  { id: 'reporte', label: 'Reporte del Servicio', icon: 'cloud' },
  { id: 'planes', label: 'Catálogo de Planes', icon: 'card' },
  { id: 'usuarios', label: 'Cuentas y Usuarios', icon: 'users' },
];

function formatBytes(bytes = 0) {
  const num = Number(bytes) || 0;
  if (num === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function AdminView({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState('todo');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Estados de los módulos (inician vacíos)
  const [report, setReport] = useState(null);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  // Formulario de creación de planes
  const [planForm, setPlanForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    capacidadGb: '',
    vigenciaDias: 30,
  });

  // Modal para editar Precio o Cuota
  const [promptModal, setPromptModal] = useState(null); // { title, label, value, onConfirm }

  function showFeedback(type, message) {
    setFeedback({ type, message });
  }

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY) || '';
    return {
      ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
      'Content-Type': 'application/json',
    };
  }, []);

  const loadReport = useCallback(async () => {
    const res = await fetch(`${API_BASE}/admin/reports`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo cargar el reporte general');
    setReport(data.report);
  }, [authHeaders]);

  const loadPlans = useCallback(async () => {
    const res = await fetch(`${API_BASE}/admin/plans`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo cargar el catálogo de planes');
    setPlans(data.plans || []);
  }, [authHeaders]);

  const loadUsers = useCallback(async () => {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo cargar la lista de usuarios');
    setUsers(data.users || []);
  }, [authHeaders]);

  const loadAllAdminData = useCallback(
    async (silentIfNoToken = false) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (!silentIfNoToken) {
          showFeedback('error', 'No hay una sesión activa con el servidor.');
        }
        return;
      }
      try {
        await Promise.all([loadReport(), loadPlans(), loadUsers()]);
      } catch (err) {
        if (!silentIfNoToken) {
          showFeedback('error', err.message);
        }
      }
    },
    [loadReport, loadPlans, loadUsers]
  );

  useEffect(() => {
    loadAllAdminData(true);
  }, [loadAllAdminData]);

  // Crear nuevo plan
  async function handleCreatePlan(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/plans`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          nombre: planForm.nombre.trim(),
          descripcion: planForm.descripcion.trim(),
          precio: Number(planForm.precio),
          capacidadGb: Number(planForm.capacidadGb),
          vigenciaDias: Number(planForm.vigenciaDias),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el plan');

      setPlanForm({ nombre: '', descripcion: '', precio: '', capacidadGb: '', vigenciaDias: 30 });
      showFeedback('success', data.message || 'Plan creado correctamente.');
      await loadAllAdminData();
    } catch (err) {
      showFeedback('error', err.message);
    }
  }

  // Activar / Desactivar plan
  async function handleTogglePlan(id, activo) {
    try {
      const res = await fetch(`${API_BASE}/admin/plans/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ activo }),
      });
      const data = await res.json();
      if (!res.ok) return showFeedback('error', data.error || 'No se pudo actualizar el plan');
      showFeedback('success', data.message || 'Estado del plan actualizado.');
      await loadPlans();
    } catch (err) {
      showFeedback('error', err.message);
    }
  }

  // Editar precio del plan en Quetzales (Q)
  function openEditPlanPrice(id, currentPrice) {
    setPromptModal({
      title: 'Editar Precio del Plan',
      label: 'Nuevo precio en Quetzales (Q):',
      value: String(currentPrice ?? ''),
      onConfirm: async (val) => {
        try {
          const res = await fetch(`${API_BASE}/admin/plans/${id}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ precio: Number(val) }),
          });
          const data = await res.json();
          if (!res.ok) return showFeedback('error', data.error || 'Error al actualizar el precio');
          showFeedback('success', data.message || 'Precio actualizado.');
          await loadPlans();
        } catch (err) {
          showFeedback('error', err.message);
        }
      },
    });
  }

  // Cambiar cuota de espacio de un usuario
  function openChangeUserQuota(id) {
    setPromptModal({
      title: 'Modificar Cuota de Almacenamiento',
      label: 'Nueva cuota de espacio disponible en GB (ej. 10, 50, 200):',
      value: '10',
      onConfirm: async (gb) => {
        try {
          const res = await fetch(`${API_BASE}/admin/users/${id}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ cuotaGb: Number(gb) }),
          });
          const data = await res.json();
          if (!res.ok) return showFeedback('error', data.error || 'Error al cambiar cuota');
          showFeedback('success', data.message || 'Cuota actualizada.');
          await loadAllAdminData();
        } catch (err) {
          showFeedback('error', err.message);
        }
      },
    });
  }

  // Cambiar rol del usuario
  async function handleToggleUserRole(id, currentRol) {
    const nuevoRol = currentRol === 'Administrador' ? 'Usuario' : 'Administrador';
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ rol: nuevoRol }),
      });
      const data = await res.json();
      if (!res.ok) return showFeedback('error', data.error || 'Error al cambiar el rol');
      showFeedback('success', data.message || `Rol cambiado a ${nuevoRol}.`);
      await loadUsers();
    } catch (err) {
      showFeedback('error', err.message);
    }
  }

  // Eliminar usuario
  async function handleRemoveUser(id) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return showFeedback('error', data.error || 'Error al eliminar usuario');
      showFeedback('success', data.message || 'Usuario eliminado.');
      await loadAllAdminData();
    } catch (err) {
      showFeedback('error', err.message);
    }
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (!normalizedSearch) return true;
    return (
      (u.nombre || '').toLowerCase().includes(normalizedSearch) ||
      (u.correo || '').toLowerCase().includes(normalizedSearch) ||
      String(u.id).includes(normalizedSearch)
    );
  });

  const adminName = user?.nombre || 'Administrador';
  const showAll = activeSection === 'todo';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: colors.surfaceAlt, overflow: 'hidden' }}>
      {/* BARRA LATERAL DEL ADMINISTRADOR */}
      <aside
        style={{
          width: 270,
          background: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '24px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 24px', marginBottom: 24 }}>
          <BrandLogo compact />
        </div>

        {/* Tarjeta del Administrador */}
        <div
          style={{
            margin: '0 16px 24px',
            padding: '12px 14px',
            borderRadius: 12,
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: colors.primaryDark,
              color: colors.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {getInitials(adminName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: colors.primaryDark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {adminName}
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: 2,
                padding: '2px 8px',
                borderRadius: 99,
                background: colors.primarySoft,
                color: colors.primary,
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
              }}
            >
              Administrador
            </span>
          </div>
        </div>

        <div style={{ ...sectionLabelStyle, padding: '0 24px', marginBottom: 10 }}>
          Administración
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                style={{
                  ...resetButtonStyle,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 8,
                  textAlign: 'left',
                  background: isActive ? colors.primarySoft : 'transparent',
                  color: isActive ? colors.primary : colors.muted,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <Icon name={item.icon} size={18} color={isActive ? colors.primary : colors.muted} />
                <span style={{ fontSize: 13.5 }}>{item.label}</span>
                {isActive && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.primary, marginLeft: 'auto' }} />
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '0 20px' }}>
          <div style={{ borderTop: `1px solid ${colors.borderLight}`, paddingTop: 18 }}>
            <button
              type="button"
              onClick={onLogout}
              style={{
                ...resetButtonStyle,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: colors.subtle,
                fontSize: 13.5,
                fontWeight: 600,
                padding: '4px 4px',
              }}
            >
              <Icon name="logout" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL LIMPIO */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ViewHeader
          title="Panel de Administración"
          subtitle="Gestión de cuentas, consumo de almacenamiento, catálogo de planes y métricas generales"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SearchInput
              placeholder="Buscar usuario o correo..."
              value={search}
              onChange={setSearch}
            />
            <button
              type="button"
              onClick={() => loadAllAdminData(false)}
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                border: `1px solid ${colors.primary}`,
                background: colors.surface,
                color: colors.primary,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Actualizar datos
            </button>
          </div>
        </ViewHeader>

        <div style={{ padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Caja de notificaciones */}
          {feedback && (
            <div
              style={{
                padding: '11px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                background: feedback.type === 'success' ? colors.successSoft : '#FEE2E2',
                color: feedback.type === 'success' ? colors.successDark : '#991B1B',
                border: `1px solid ${feedback.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{feedback.message}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                style={{ ...resetButtonStyle, fontWeight: 800, fontSize: 14 }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Reporte General del Servicio */}
          {(showAll || activeSection === 'reporte') && (
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
          )}

          {/* Catálogo de Planes de Almacenamiento */}
          {(showAll || activeSection === 'planes') && (
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
          )}

          {/* Planes de Usuarios y Gestión de Cuentas */}
          {(showAll || activeSection === 'usuarios') && (
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
          )}
        </div>
      </main>

      {/* Modal para editar Precio o Cuota */}
      {promptModal && (
        <div
          onClick={() => setPromptModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: colors.surface,
              borderRadius: 12,
              width: '100%',
              maxWidth: 380,
              padding: 24,
              border: `1px solid ${colors.border}`,
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: colors.primaryDark }}>
              {promptModal.title}
            </h3>
            <label style={{ display: 'block', fontSize: 12.5, color: colors.muted, marginBottom: 8 }}>
              {promptModal.label}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              autoFocus
              value={promptModal.value}
              onChange={(e) => setPromptModal({ ...promptModal, value: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 6,
                border: `1px solid ${colors.borderDashed}`,
                fontSize: 14,
                marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setPromptModal(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.muted,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = promptModal.value;
                  const fn = promptModal.onConfirm;
                  setPromptModal(null);
                  fn(val);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: colors.primary,
                  color: colors.surface,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminView;
