import { colors, resetButtonStyle } from '../../styles/theme';

/**
 * Acción con apariencia de enlace (accesible por teclado, a diferencia de un <span>).
 */
function TextButton({ onClick, children, style }) {
  return (
    <button type="button" onClick={onClick} style={{ ...resetButtonStyle, color: colors.primary, fontWeight: 700, ...style }}>
      {children}
    </button>
  );
}

export default TextButton;
