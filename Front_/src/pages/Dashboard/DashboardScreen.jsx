import { useState } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import MainContent from '../../components/dashboard/MainContent';
import { colors } from '../../styles/theme';

function DashboardScreen({ user, onLogout, onRefreshUser, initialTab = 'archivos' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: colors.surfaceAlt, overflow: 'hidden' }}>
      <Sidebar user={user} activeTab={activeTab} onSelectTab={setActiveTab} onLogout={onLogout} />
      <main style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <MainContent activeTab={activeTab} onRefreshUser={onRefreshUser} />
      </main>
    </div>
  );
}

export default DashboardScreen;
