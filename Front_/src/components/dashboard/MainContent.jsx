import React from 'react';
import MisArchivosView from './views/MisArchivosView';
import PapeleraView from './views/PapeleraView';
import RecientesView from './views/RecientesView';

function MainContent({ activeTab }) {
  if (activeTab === 'papelera') {
    return <PapeleraView />;
  }

  if (activeTab === 'archivos') {
    return <MisArchivosView />;
  }

  if (activeTab === 'recientes') {
    return <RecientesView />;
  }

  // Vista por defecto para tabs no implementados aún
  return (
    <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
      <h2>Vista en construcción</h2>
      <p>Has seleccionado: {activeTab}</p>
    </div>
  );
}

export default MainContent;
