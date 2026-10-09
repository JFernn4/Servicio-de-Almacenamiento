import Icon from './Icon';
import { colors } from '../../styles/theme';

function SubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        background: colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        boxShadow: '0 4px 12px rgba(125, 21, 53, 0.3)',
      }}
    >
      {loading ? loadingLabel : label}
      {!loading && <Icon name="arrowRight" strokeWidth={2.5} />}
    </button>
  );
}

export default SubmitButton;
