import { useId, useState } from 'react';
import Icon from './Icon';
import { colors, resetButtonStyle } from '../../styles/theme';

/**
 * Campo de formulario con etiqueta e icono. Los campos de contraseña
 * gestionan su propio botón Mostrar/Ocultar.
 */
function FieldInput({ label, icon, type = 'text', value, onChange, placeholder, autoComplete, labelAction }) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <label htmlFor={id} style={{ fontSize: 12.5, fontWeight: 700, color: colors.ink }}>{label}</label>
        {labelAction}
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Icon name={icon} size={15} color={colors.subtle} style={{ position: 'absolute', left: 14 }} />
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            fontSize: 14,
            color: colors.text,
            backgroundColor: colors.surface,
            outline: 'none',
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            style={{ ...resetButtonStyle, position: 'absolute', right: 14, color: colors.subtle }}
          >
            {revealed ? 'Ocultar' : 'Mostrar'}
          </button>
        )}
      </div>
    </div>
  );
}

export default FieldInput;
