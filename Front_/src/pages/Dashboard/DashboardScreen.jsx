import React, { useState } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import MainContent from '../../components/dashboard/MainContent';

function DashboardScreen({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('archivos'); // 'archivos', 'recientes', 'papelera', 'suscripciones'

  // Adaptación de los datos del usuario que vienen del backend de la rama 'main'
  const displayUser = {
    ...user,
    name: user?.nombre || user?.name || 'Usuario',
    role: user?.rol || user?.role || 'Cliente',
    initials: user?.initials || (user?.nombre ? user.nombre.substring(0, 2).toUpperCase() : 'US')
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#F8F9FA', fontFamily: "'Nunito', sans-serif", overflow: "hidden" }}>
      <Sidebar user={displayUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <MainContent activeTab={activeTab} />
      </div>
    </div>
  );
}

export default DashboardScreen;

