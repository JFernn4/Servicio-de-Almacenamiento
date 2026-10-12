import Icon from '../ui/Icon';
import { colors } from '../../styles/theme';

function SearchInput({ placeholder }) {
  return (
    <div style={{ position: 'relative', width: 300 }}>
      <Icon name="search" size={16} color={colors.subtle} style={{ position: 'absolute', left: 12, top: 10 }} />
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontSize: 14, outline: 'none' }}
      />
    </div>
  );
}

export default SearchInput;
