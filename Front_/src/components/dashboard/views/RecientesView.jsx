import React, { useState } from 'react';

const mockRecentFiles = [];

function RecientesView() {
  const [files] = useState(mockRecentFiles);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#3B0A1F' }}>Recientes</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>Tus archivos abiertos o modificados en la última semana</p>
        </div>

        <div style={{ position: 'relative', width: 300 }}>
          <svg style={{ position: 'absolute', left: 12, top: 10, color: '#94A3B8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Buscar en recientes..." style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8F9FA', fontSize: 14, outline: 'none' }} />
        </div>
      </div>

      <div style={{ padding: 32, overflowY: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, marginBottom: 16 }}>ESTA SEMANA</div>
        
        {files.length === 0 ? (
          <div style={{ padding: '48px 32px', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #CBD5E1', color: '#94A3B8' }}>
            <svg style={{ margin: '0 auto 12px', color: '#CBD5E1' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <p style={{ margin: 0 }}>Aún no tienes archivos recientes. Tus archivos abiertos recientemente aparecerán aquí.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', padding: '12px 24px', background: '#F8F9FA', borderBottom: '1px solid #E2E8F0', fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1 }}>
              <div style={{ flex: 2 }}>NOMBRE</div>
              <div style={{ flex: 1 }}>TAMAÑO</div>
              <div style={{ flex: 1 }}>ÚLTIMA APERTURA</div>
              <div style={{ width: 24 }}></div>
            </div>
            
            {files.map((file, i) => (
              <div key={file.id} style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: i === files.length - 1 ? 'none' : '1px solid #F1F5F9', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.background = '#FDF2F5'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: file.color + '33', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: file.color.replace('A5', '60'), fontSize: 10, fontWeight: 800 }}>
                    {file.type}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#3B0A1F' }}>{file.name}</span>
                </div>
                <div style={{ flex: 1, fontSize: 13, color: '#64748B' }}>{file.size}</div>
                <div style={{ flex: 1, fontSize: 13, color: '#64748B', fontWeight: 500 }}>{file.date}</div>
                <div style={{ width: 24, color: '#94A3B8' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecientesView;
