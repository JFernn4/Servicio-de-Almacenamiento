import { NAV_ITEMS } from './navigation';
import { colors } from '../../styles/theme';

function MainContent({ activeTab, onRefreshUser }) {
  const item = NAV_ITEMS.find((navItem) => navItem.id === activeTab);

  if (item?.View) {
    return (
      <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <item.View onRefreshUser={onRefreshUser} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: 48, textAlign: 'center', color: colors.subtle }}>
      <h2>Vista en construcción</h2>
      <p>Has seleccionado: {item?.label ?? activeTab}</p>
    </div>
  );
}

export default MainContent;
