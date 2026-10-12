import { NAV_ITEMS } from './navigation';
import { colors } from '../../styles/theme';

function MainContent({ activeTab }) {
  const item = NAV_ITEMS.find((navItem) => navItem.id === activeTab);

  if (item?.View) {
    return <item.View />;
  }

  return (
    <div style={{ padding: 48, textAlign: 'center', color: colors.subtle }}>
      <h2>Vista en construcción</h2>
      <p>Has seleccionado: {item?.label ?? activeTab}</p>
    </div>
  );
}

export default MainContent;
