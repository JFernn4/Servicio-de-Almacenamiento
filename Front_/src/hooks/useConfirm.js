import { useState } from 'react';

/**
 * Reemplazo de window.confirm con el diálogo propio de la app.
 *
 *   const { askConfirm, confirmDialogProps } = useConfirm();
 *   if (!(await askConfirm({ title, message, confirmLabel }))) return;
 *   ...
 *   {confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />}
 *
 * `askConfirm` devuelve una promesa que se resuelve en true (aceptar) o false (cancelar).
 */
export function useConfirm() {
  const [request, setRequest] = useState(null); // { title, message, confirmLabel, resolve }

  function askConfirm({ title, message, confirmLabel }) {
    return new Promise((resolve) => setRequest({ title, message, confirmLabel, resolve }));
  }

  function close(accepted) {
    request?.resolve(accepted);
    setRequest(null);
  }

  const confirmDialogProps = request && {
    title: request.title,
    message: request.message,
    confirmLabel: request.confirmLabel,
    onConfirm: () => close(true),
    onCancel: () => close(false),
  };

  return { askConfirm, confirmDialogProps };
}
