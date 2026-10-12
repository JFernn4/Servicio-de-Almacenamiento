import MisArchivosView from './views/MisArchivosView';
import RecientesView from './views/RecientesView';
import PapeleraView from './views/PapeleraView';

// Registro de secciones del dashboard. Agregar una vista nueva = agregar una entrada aquí;
// el menú lateral y MainContent no necesitan cambios.
export const NAV_ITEMS = [
  { id: 'archivos', label: 'Mis Archivos', icon: 'folder', View: MisArchivosView },
  { id: 'recientes', label: 'Recientes', icon: 'clock', View: RecientesView },
  { id: 'papelera', label: 'Papelera', icon: 'trash', View: PapeleraView },
  { id: 'suscripciones', label: 'Suscripciones', icon: 'card' }, // vista pendiente
];
