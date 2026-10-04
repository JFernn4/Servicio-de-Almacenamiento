import React from 'react';

function PapeleraView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header de Papelera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#3B0A1F' }}>Papelera</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>0 elementos eliminados</p>
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: 0.5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Vaciar papelera
        </button>
      </div>

      <div style={{ padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Banner de advertencia */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFBEB', border: '1px solid #FEF08A', padding: '16px 24px', borderRadius: 12, color: '#B45309', fontSize: 14, fontWeight: 500 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          Los archivos en la papelera se eliminan permanentemente después de 30 días.
        </div>

        {/* Empty state de papelera */}
        <div style={{ padding: '48px 32px', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #CBD5E1', color: '#94A3B8' }}>
          <svg style={{ margin: '0 auto 12px', color: '#CBD5E1' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          <p style={{ margin: 0 }}>Tu papelera está vacía.</p>
        </div>
      </div>
    </div>
  );
}

export default PapeleraView;
