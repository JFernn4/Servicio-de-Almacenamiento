import { useState, useEffect, useCallback } from 'react';
import BrandLogo from '../../ui/BrandLogo';
import Icon from '../../ui/Icon';
import ViewHeader from '../ViewHeader';
import SearchInput from '../SearchInput';
import { colors, sectionLabelStyle, resetButtonStyle } from '../../../styles/theme';
import { getInitials } from '../../../utils/user';
import AdminReportSection from '../admin/AdminReportSection';
import AdminPlansSection from '../admin/AdminPlansSection';
import AdminUsersSection from '../admin/AdminUsersSection';
import AdminPromptModal from '../admin/AdminPromptModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'vincloud_token';

const ADMIN_NAV_ITEMS = [
  { id: 'todo', label: 'Panel General', icon: 'zap' },
  { id: 'reporte', label: 'Reporte del Servicio', icon: 'cloud' },
  { id: 'planes', label: 'Catálogo de Planes', icon: 'card' },
  { id: 'usuarios', label: 'Cuentas y Usuarios', icon: 'users' },
];

/**
 * Panel de Administración refactorizado según el principio de Formato Vertical de Clean Code:
 * Componente orquestador de ~220 líneas delegando en subcomponentes atómicos especializados.
 */
function AdminView({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState('todo');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Estados de los módulos
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
      label: 'Ingresa el nuevo precio en Quetzales (Q):',
      value: currentPrice,
      onConfirm: async (val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) return showFeedback('error', 'El precio ingresado no es válido');
        try {
          const res = await fetch(`${API_BASE}/admin/plans/${id}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ precio: num }),
          });
          const data = await res.json();
          if (!res.ok) return showFeedback('error', data.error || 'Error al actualizar el precio');
          showFeedback('success', data.message || 'Precio del plan actualizado.');
          await loadPlans();
        } catch (err) {
          showFeedback('error', err.message);
        }
      },
    });
  }

  // Editar cuota personalizada de usuario
  function openChangeUserQuota(id) {
    setPromptModal({
      title: 'Modificar Cuota de Almacenamiento',
      label: 'Ingresa la nueva cuota en Gigabytes (GB):',
      value: 5,
      onConfirm: async (val) => {
        const numGb = parseFloat(val);
        if (isNaN(numGb) || numGb <= 0) return showFeedback('error', 'La cuota en GB no es válida');
        try {
          const res = await fetch(`${API_BASE}/admin/users/${id}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ espacioDisponibleGb: numGb }),
          });
          const data = await res.json();
          if (!res.ok) return showFeedback('error', data.error || 'Error al actualizar la cuota');
          showFeedback('success', data.message || 'Cuota de almacenamiento actualizada.');
          await loadUsers();
        } catch (err) {
          showFeedback('error', err.message);
        }
      },
    });
  }

  // Cambiar rol de usuario
  async function handleToggleUserRole(id, currentRole) {
    const nuevoRol = currentRole === 'Administrador' ? 'Usuario' : 'Administrador';
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

          {/* Subcomponente 1: Reporte General del Servicio */}
          {(showAll || activeSection === 'reporte') && (
            <AdminReportSection report={report} />
          )}

          {/* Subcomponente 2: Catálogo de Planes de Almacenamiento */}
          {(showAll || activeSection === 'planes') && (
            <AdminPlansSection
              plans={plans}
              planForm={planForm}
              setPlanForm={setPlanForm}
              handleCreatePlan={handleCreatePlan}
              handleTogglePlan={handleTogglePlan}
              openEditPlanPrice={openEditPlanPrice}
            />
          )}

          {/* Subcomponente 3: Planes de Usuarios y Gestión de Cuentas */}
          {(showAll || activeSection === 'usuarios') && (
            <AdminUsersSection
              filteredUsers={filteredUsers}
              openChangeUserQuota={openChangeUserQuota}
              handleToggleUserRole={handleToggleUserRole}
              handleRemoveUser={handleRemoveUser}
            />
          )}
        </div>
      </main>

      {/* Subcomponente 4: Modal para editar Precio o Cuota */}
      <AdminPromptModal promptModal={promptModal} setPromptModal={setPromptModal} />
    </div>
  );
}

export default AdminView;
