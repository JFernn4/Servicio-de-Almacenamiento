import MisArchivosView from './views/MisArchivosView';
import RecientesView from './views/RecientesView';
import PapeleraView from './views/PapeleraView';
import SuscripcionesView from './views/SuscripcionesView';

// Registro de secciones del dashboard del cliente.
export const NAV_ITEMS = [
  { id: 'archivos', label: 'Mis Archivos', icon: 'folder', View: MisArchivosView },
  { id: 'recientes', label: 'Recientes', icon: 'clock', View: RecientesView },
  { id: 'papelera', label: 'Papelera', icon: 'trash', View: PapeleraView },
  { id: 'suscripciones', label: 'Suscripciones', icon: 'card', View: SuscripcionesView },
];
