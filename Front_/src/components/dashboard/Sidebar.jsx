import BrandLogo from '../ui/BrandLogo';
import Icon from '../ui/Icon';
import StorageCard from './StorageCard';
import { NAV_ITEMS } from './navigation';
import { colors, sectionLabelStyle, resetButtonStyle } from '../../styles/theme';
import { getInitials } from '../../utils/user';

function Sidebar({ user, activeTab, onSelectTab, onLogout }) {
  return (
    <aside style={{ width: 280, background: colors.surface, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 0' }}>
      <div style={{ padding: '0 24px', marginBottom: 32 }}>
        <BrandLogo compact />
      </div>

      <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
          {getInitials(user.nombre)}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.primaryDark }}>{user.nombre}</div>
          <div style={{ fontSize: 12, color: colors.subtle }}>{user.rol}</div>
        </div>
      </div>

      <div style={{ ...sectionLabelStyle, padding: '0 24px', marginBottom: 12 }}>Navegación</div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              style={{ ...resetButtonStyle, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, textAlign: 'left', background: isActive ? colors.primarySoft : 'transparent', color: isActive ? colors.primary : colors.muted, fontWeight: isActive ? 700 : 500 }}
            >
              <Icon name={item.icon} />
              <span style={{ fontSize: 14 }}>{item.label}</span>
              {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.primary, marginLeft: 'auto' }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '0 24px' }}>
        <div style={{ ...sectionLabelStyle, borderTop: `1px solid ${colors.borderLight}`, paddingTop: 24, marginBottom: 12 }}>Almacenamiento</div>

        <StorageCard user={user} />

        <button type="button" style={{ width: '100%', padding: '10px 0', background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 24 }}>
          Ampliar almacenamiento
        </button>

        <button type="button" onClick={onLogout} style={{ ...resetButtonStyle, display: 'flex', alignItems: 'center', gap: 10, color: colors.subtle, fontSize: 14, fontWeight: 600 }}>
          <Icon name="logout" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
