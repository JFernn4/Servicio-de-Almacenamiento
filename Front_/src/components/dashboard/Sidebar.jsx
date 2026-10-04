import React from 'react';
import AuthLogo from '../auth/AuthLogo';

function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
  const navItems = [
    { id: 'archivos', label: 'Mis Archivos', icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /> },
    { id: 'recientes', label: 'Recientes', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
    { id: 'papelera', label: 'Papelera', icon: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></> },
    { id: 'suscripciones', label: 'Suscripciones', icon: <><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></> }
  ];

  return (
    <div style={{ width: 280, background: '#fff', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 0' }}>
      <div style={{ padding: '0 24px', marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#7D1535", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" stroke="none"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#3B0A1F", lineHeight: 1 }}>VinCloud</span>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>Almacenamiento</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#7D1535', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
          {user ? user.initials : 'CA'}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#3B0A1F" }}>{user ? user.name : 'Carlos Alvarado'}</div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>{user ? user.role : 'Cliente'}</div>
        </div>
      </div>

      <div style={{ padding: '0 24px', marginBottom: 12, fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1 }}>NAVEGACIÓN</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <div 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: isActive ? '#FDF2F5' : 'transparent', color: isActive ? '#7D1535' : '#64748B', fontWeight: isActive ? 700 : 500 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
              <span style={{ fontSize: 14 }}>{item.label}</span>
              {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7D1535', marginLeft: 'auto' }}></div>}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', padding: '0 24px' }}>
        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 24, marginBottom: 12, fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1 }}>ALMACENAMIENTO</div>
        
        <div style={{ background: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#3B0A1F' }}>18.4 GB usados</span>
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>de 50 GB</div>
          </div>
          <div style={{ height: 6, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: '37%', background: '#7D1535', borderRadius: 4 }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: '#7D1535', fontWeight: 700 }}>37% usado</span>
            <span style={{ color: '#94A3B8' }}>31.6 GB libres</span>
          </div>
        </div>

        <button style={{ width: '100%', padding: '10px 0', background: '#7D1535', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 24 }}>
          Ampliar almacenamiento
        </button>

        <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94A3B8', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Cerrar sesión
        </div>
      </div>
    </div>
  );
}
export default Sidebar;
