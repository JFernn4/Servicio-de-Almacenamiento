import { useState, useEffect, useRef } from 'react';
import Icon from '../../ui/Icon';
import { colors } from '../../../styles/theme';

/**
 * Modal para compartir archivos y enviar invitaciones.
 * Permite invitar a un usuario registrado por correo o generar un enlace público de descarga.
 */
function ShareModal({ isOpen, file, onClose, onShare }) {
  const [email, setEmail] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [vigencia, setVigencia] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setShareUrl('');
      setVigencia('');
      setLoadingInvite(false);
      setLoadingLink(false);
      setFeedback(null);
      setCopied(false);

      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, file]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loadingInvite && !loadingLink) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loadingInvite, loadingLink, onClose]);

  if (!isOpen || !file) return null;

  async function handleSendInvite(e) {
    e?.preventDefault?.();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFeedback({ type: 'error', message: 'Ingresa el correo del usuario registrado.' });
      return;
    }

    setLoadingInvite(true);
    setFeedback(null);
    try {
      const data = await onShare(file, cleanEmail);
      if (data?.shareUrl) {
        setShareUrl(data.shareUrl);
      }
      if (data?.vigenciaEnlace) {
        setVigencia(data.vigenciaEnlace);
      }
      setFeedback({
        type: 'success',
        message: data?.message || `Invitación enviada exitosamente a ${cleanEmail}.`,
      });
      setEmail('');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'No se pudo enviar la invitación.',
      });
    } finally {
      setLoadingInvite(false);
    }
  }

  async function handleGeneratePublicLink() {
    setLoadingLink(true);
    setFeedback(null);
    try {
      const data = await onShare(file, '');
      if (data?.shareUrl) {
        setShareUrl(data.shareUrl);
        await copyToClipboard(data.shareUrl);
      }
      if (data?.vigenciaEnlace) {
        setVigencia(data.vigenciaEnlace);
      }
      setFeedback({
        type: 'success',
        message: '¡Enlace público generado y copiado al portapapeles!',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'No se pudo generar el enlace.',
      });
    } finally {
      setLoadingLink(false);
    }
  }

  async function copyToClipboard(textToCopy) {
    const text = textToCopy || shareUrl;
    if (!text) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  }

  return (
    <div
      onClick={!loadingInvite && !loadingLink ? onClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.surface,
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          padding: 26,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)',
        }}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 10,
              background: colors.primarySoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="share" size={22} color={colors.primary} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.primaryDark }}>
              Compartir archivo
            </h3>
            <p
              title={file.name}
              style={{
                margin: 0,
                fontSize: 13,
                color: colors.muted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {file.name}
            </p>
          </div>
        </div>

        {/* Notificación de feedback */}
        {feedback && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: feedback.type === 'success' ? colors.successSoft : '#FEF2F2',
              color: feedback.type === 'success' ? colors.successDark : colors.danger,
              border: `1px solid ${feedback.type === 'success' ? colors.success : colors.danger}`,
            }}
          >
            <Icon name={feedback.type === 'success' ? 'check' : 'alert'} size={16} />
            <span style={{ flex: 1 }}>{feedback.message}</span>
          </div>
        )}

        {/* Sección 1: Enviar invitación directa por correo */}
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="share-email-input"
            style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: colors.primaryDark, marginBottom: 6 }}
          >
            Invitar por correo electrónico
          </label>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: colors.subtle, lineHeight: 1.4 }}>
            Envía una notificación al usuario registrado para que acceda al archivo.
          </p>

          <form onSubmit={handleSendInvite} style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.subtle,
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Icon name="mail" size={16} />
              </span>
              <input
                id="share-email-input"
                ref={inputRef}
                type="email"
                value={email}
                disabled={loadingInvite}
                placeholder="ejemplo@correo.com"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (feedback) setFeedback(null);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.surfaceAlt,
                  fontSize: 13,
                  color: colors.text,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loadingInvite || !email.trim()}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: 'none',
                background: colors.primary,
                color: colors.surface,
                fontWeight: 700,
                fontSize: 12.5,
                cursor: loadingInvite || !email.trim() ? 'not-allowed' : 'pointer',
                opacity: loadingInvite || !email.trim() ? 0.6 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {loadingInvite ? 'Enviando...' : 'Invitar'}
            </button>
          </form>
        </div>

        {/* Separador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: colors.borderLight }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: colors.subtle, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            o enlace público
          </span>
          <div style={{ flex: 1, height: 1, background: colors.borderLight }} />
        </div>

        {/* Sección 2: Enlace público */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.primaryDark }}>
              Enlace de acceso
            </span>
            {vigencia && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.primary,
                  background: colors.primarySoft,
                  padding: '2px 8px',
                  borderRadius: 12,
                }}
              >
                Vigencia: {vigencia}
              </span>
            )}
          </div>

          {shareUrl ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.surfaceAlt,
                  fontSize: 12,
                  color: colors.muted,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => copyToClipboard()}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: `1px solid ${copied ? colors.success : colors.border}`,
                  background: copied ? colors.successSoft : colors.surface,
                  color: copied ? colors.successDark : colors.primaryDark,
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon name={copied ? 'check' : 'copy'} size={15} color={copied ? colors.successDark : colors.primaryDark} />
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={loadingLink}
              onClick={handleGeneratePublicLink}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: `1px dashed ${colors.borderDashed}`,
                background: colors.surfaceAlt,
                color: colors.primaryDark,
                fontWeight: 700,
                fontSize: 13,
                cursor: loadingLink ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: loadingLink ? 0.7 : 1,
              }}
            >
              <Icon name="link" size={16} color={colors.primary} />
              {loadingLink ? 'Generando enlace...' : 'Generar y copiar enlace público'}
            </button>
          )}
        </div>

        {/* Botón cerrar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.muted,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;

