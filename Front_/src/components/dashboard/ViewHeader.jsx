import { colors } from '../../styles/theme';

/**
 * Encabezado común de las vistas del dashboard; `children` va a la derecha.
 */
function ViewHeader({ title, subtitle, children }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '24px 32px', background: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: colors.primaryDark }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 13, color: colors.subtle }}>{subtitle}</p>
      </div>
      {children}
    </header>
  );
}

export default ViewHeader;
