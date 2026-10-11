import { colors } from '../../styles/theme';

const VARIANTS = {
  primary: { background: colors.primary, color: '#fff', border: `1px solid ${colors.primary}` },
  secondary: { background: colors.surface, color: colors.primary, border: `1px solid ${colors.primary}` },
  danger: { background: colors.surface, color: colors.danger, border: `1px solid ${colors.danger}` },
};

function Button({ variant = 'primary', type = 'button', disabled, onClick, children, style }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...VARIANTS[variant],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '8px 16px',
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default Button;
