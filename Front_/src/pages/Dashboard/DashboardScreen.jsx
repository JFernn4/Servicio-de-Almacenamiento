import { useState } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import MainContent from '../../components/dashboard/MainContent';
import { colors } from '../../styles/theme';

function DashboardScreen({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('archivos');

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: colors.surfaceAlt, overflow: 'hidden' }}>
      <Sidebar user={user} activeTab={activeTab} onSelectTab={setActiveTab} onLogout={onLogout} />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <MainContent activeTab={activeTab} />
      </main>
    </div>
  );
}

export default DashboardScreen;
