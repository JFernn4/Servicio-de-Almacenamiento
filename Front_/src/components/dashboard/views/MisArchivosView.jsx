import React, { useState } from 'react';

// Estado inicial vacío para un usuario nuevo
const initialFolders = [];
const initialFiles = [];

function MisArchivosView() {
  const [folders, setFolders] = useState(initialFolders);
  const [files, setFiles] = useState(initialFiles);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#3B0A1F' }}>Mis Archivos</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>{folders.length} carpetas · {files.length} archivos</p>
        </div>

        <div style={{ position: 'relative', width: 300 }}>
          <svg style={{ position: 'absolute', left: 12, top: 10, color: '#94A3B8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Buscar archivos..." style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8F9FA', fontSize: 14, outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1px solid #7D1535', color: '#7D1535', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Subir archivo
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#7D1535', border: '1px solid #7D1535', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
            Nueva carpeta
          </button>
        </div>
      </div>

      <div style={{ padding: 32, overflowY: 'auto' }}>
        {/* Carpetas */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, marginBottom: 16 }}>CARPETAS</div>
        
        {folders.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #CBD5E1', marginBottom: 32, color: '#94A3B8' }}>
            Aún no tienes carpetas. Haz clic en "Nueva carpeta" para crear una.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
            {folders.map(folder => (
              <div key={folder.id} style={{ background: '#fff', borderRadius: 12, padding: 16, width: 200, border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#FCA5A5" stroke="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  <svg style={{ color: '#94A3B8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#3B0A1F', marginBottom: 4 }}>{folder.name}</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{folder.elements} elementos · {folder.date}</div>
              </div>
            ))}
          </div>
        )}

        {/* Archivos */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, marginBottom: 16 }}>ARCHIVOS</div>
        
        {files.length === 0 ? (
          <div style={{ padding: '48px 32px', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #CBD5E1', color: '#94A3B8' }}>
            <svg style={{ margin: '0 auto 12px', color: '#CBD5E1' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
            <p style={{ margin: 0 }}>Tu espacio está vacío. Comienza subiendo tus primeros archivos corporativos.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', padding: '12px 24px', background: '#F8F9FA', borderBottom: '1px solid #E2E8F0', fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1 }}>
              <div style={{ flex: 2 }}>NOMBRE</div>
              <div style={{ flex: 1 }}>TAMAÑO</div>
              <div style={{ flex: 1 }}>MODIFICADO</div>
              <div style={{ width: 24 }}></div>
            </div>
            {files.map((file, i) => (
              <div key={file.id} style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: i === files.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: file.color + '33', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: file.color.replace('A5', '60'), fontSize: 10, fontWeight: 800 }}>
                    {file.type}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#3B0A1F' }}>{file.name}</span>
                </div>
                <div style={{ flex: 1, fontSize: 13, color: '#64748B' }}>{file.size}</div>
                <div style={{ flex: 1, fontSize: 13, color: '#64748B' }}>{file.date}</div>
                <div style={{ width: 24, cursor: 'pointer', color: '#94A3B8' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MisArchivosView;
