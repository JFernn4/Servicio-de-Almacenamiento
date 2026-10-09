import { useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import FieldInput from '../../components/ui/FieldInput';
import ErrorBanner from '../../components/ui/ErrorBanner';
import SubmitButton from '../../components/ui/SubmitButton';
import TextButton from '../../components/ui/TextButton';
import { register } from '../../services/authService';

const MIN_PASSWORD_LENGTH = 6;

function validate({ name, email, password, confirm }) {
  if (!name || !email || !password || !confirm) return 'Por favor completa todos los campos.';
  if (password.length < MIN_PASSWORD_LENGTH) return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (password !== confirm) return 'Las contraseñas no coinciden.';
  return '';
}

function RegisterScreen({ onRegister, onGoToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate({ name, email, password, confirm });
    setError(validationError);
    if (validationError) return;

    setLoading(true);
    try {
      onRegister(await register(name, email, password));
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Crea tu espacio"
      title="Empieza con VinCloud"
      subtitle="Tu espacio seguro en la nube está a unos pocos pasos."
      maxWidth={520}
      legalText="Al crear una cuenta"
      footer={<>¿Ya tienes una cuenta? <TextButton onClick={onGoToLogin}>Iniciar sesión</TextButton></>}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FieldInput label="Nombre completo" icon="person" value={name} onChange={setName} placeholder="Tu nombre y apellido" autoComplete="name" />
        <FieldInput label="Correo electrónico" icon="mail" type="email" value={email} onChange={setEmail} placeholder="nombre@empresa.com" autoComplete="email" />

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <FieldInput label="Contraseña" icon="lock" type="password" value={password} onChange={setPassword} placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`} autoComplete="new-password" />
          </div>
          <div style={{ flex: 1 }}>
            <FieldInput label="Confirmar contraseña" icon="lock" type="password" value={confirm} onChange={setConfirm} placeholder="Repite la contraseña" autoComplete="new-password" />
          </div>
        </div>

        {error && <ErrorBanner msg={error} />}
        <SubmitButton loading={loading} label="Crear mi cuenta" loadingLabel="Creando..." />
      </form>
    </AuthLayout>
  );
}

export default RegisterScreen;
