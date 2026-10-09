// Paleta única de la aplicación: cambiar un color aquí lo cambia en todas las vistas.
export const colors = {
  primary: '#7D1535',
  primaryDark: '#3B0A1F',
  ink: '#2D0615',
  primarySoft: '#FDF2F5',
  text: '#0F172A',
  muted: '#64748B',
  subtle: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDashed: '#CBD5E1',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F9FA',
  card: '#FCFAFA',
  danger: '#EF4444',
};

export const sectionLabelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: colors.subtle,
  letterSpacing: 1,
  textTransform: 'uppercase',
};

// Botón sin estilos nativos, para acciones con apariencia de texto/enlace
export const resetButtonStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
};
