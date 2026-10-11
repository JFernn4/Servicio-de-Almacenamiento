const VARIANTS = {
  error: { background: '#FEE2E2', color: '#B91C1C' },
  success: { background: '#DCFCE7', color: '#166534' },
  info: { background: '#FFFBEB', color: '#B45309', border: '1px solid #FEF08A' },
};

/**
 * Mensaje destacado. Los errores se anuncian a lectores de pantalla (role="alert").
 */
function Alert({ type = 'error', children, action }) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      style={{ ...VARIANTS[type], display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}
    >
      <span>{children}</span>
      {action}
    </div>
  );
}

export default Alert;
