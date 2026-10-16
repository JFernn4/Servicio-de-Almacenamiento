import { useEffect, useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import TextButton from '../../components/ui/TextButton';
import { colors } from '../../styles/theme';
import { formatBytes } from '../../utils/user';
import { fetchSharedFileInfo, getSharedFileUrl } from '../../services/storageService';

/**
 * Pantalla para invitados que abren un enlace de invitación (?mode=shared-file&token=...).
 * Cubre los casos de uso: "Aceptar enlace de invitación", "Visualizar archivos públicos"
 * y "Descargar archivos públicos".
 */
function SharedFileScreen({ token, onGoToLogin }) {
  const [state, setState] = useState(() =>
    token
      ? { status: 'loading', file: null, error: '' }
      : { status: 'error', file: null, error: 'Enlace de invitación no válido o incompleto.' }
  );
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    fetchSharedFileInfo(token).then(
      (archivo) => active && setState({ status: 'ready', file: archivo, error: '' }),
      (err) => active && setState({ status: 'error', file: null, error: err.message })
    );
    return () => {
      active = false;
    };
  }, [token]);

  const { status, file, error } = state;

  return (
    <AuthLayout
      eyebrow="Enlace de invitación compartido"
      title="Archivo compartido contigo"
      subtitle="Has recibido una invitación para acceder a un archivo en VinCloud."
      footer={<TextButton onClick={onGoToLogin}>Ir al inicio de sesión de VinCloud</TextButton>}
    >
      {status === 'loading' && (
        <Alert type="info">Verificando enlace de invitación...</Alert>
      )}

      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Alert>{error}</Alert>
          <Button onClick={onGoToLogin} style={{ padding: 12, fontSize: 14 }}>
            Ir a VinCloud
          </Button>
        </div>
      )}

      {status === 'ready' && file && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              background: colors.surfaceAlt,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: colors.primaryDark }}>
              📄 {file.nombre}
            </div>
            <div style={{ fontSize: 13, color: colors.muted }}>
              Compartido por: <strong>{file.propietario}</strong>
            </div>
            <div style={{ fontSize: 12.5, color: colors.subtle }}>
              Tamaño: {formatBytes(file.tamano)} · Subido: {String(file.fecha_subida || '').slice(0, 10)}
            </div>
          </div>

          {!accepted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 13, color: colors.muted, lineHeight: 1.5 }}>
                ¿Deseas aceptar la invitación para visualizar o descargar este archivo?
              </p>
              <Button onClick={() => setAccepted(true)} style={{ padding: 12, fontSize: 14 }}>
                Aceptar invitación
              </Button>
              <Button variant="secondary" onClick={onGoToLogin} style={{ padding: 12, fontSize: 14 }}>
                Rechazar invitación
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Alert type="success">Invitación aceptada. Ya tienes acceso al archivo.</Alert>
              <Button
                onClick={() => window.open(getSharedFileUrl(token, { inline: true }), '_blank', 'noopener,noreferrer')}
                style={{ padding: 12, fontSize: 14 }}
              >
                Visualizar archivo público
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  window.location.href = getSharedFileUrl(token, { inline: false });
                }}
                style={{ padding: 12, fontSize: 14 }}
              >
                Descargar archivo público
              </Button>
            </div>
          )}
        </div>
      )}
    </AuthLayout>
  );
}

export default SharedFileScreen;
