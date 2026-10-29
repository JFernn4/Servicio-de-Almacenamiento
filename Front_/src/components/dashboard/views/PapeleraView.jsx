import { useEffect, useState } from 'react';
import Icon from '../../ui/Icon';
import Alert from '../../ui/Alert';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { useConfirm } from '../../../hooks/useConfirm';
import ViewHeader from '../ViewHeader';
import EmptyState from '../EmptyState';
import FileTable from '../FileTable';
import { colors } from '../../../styles/theme';
import { mapFileForTable } from '../../../utils/user';
import {
  fetchTrashFiles,
  restoreFile,
  permanentDeleteFile,
  emptyTrash,
} from '../../../services/storageService';

function PapeleraView({ onRefreshUser }) {
  const [files, setFiles] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [emptying, setEmptying] = useState(false);
  const { askConfirm, confirmDialogProps } = useConfirm();

  async function loadTrash() {
    try {
      const enPapelera = await fetchTrashFiles();
      setFiles(enPapelera.map(mapFileForTable));
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  useEffect(() => {
    let active = true;
    fetchTrashFiles().then(
      (enPapelera) => active && setFiles(enPapelera.map(mapFileForTable)),
      (err) => active && setFeedback({ type: 'error', msg: err.message })
    );
    return () => {
      active = false;
    };
  }, []);

  async function handleRestore(file) {
    setFeedback(null);
    try {
      const data = await restoreFile(file.id);
      setFeedback({ type: 'success', msg: data.message || 'Archivo restaurado exitosamente.' });
      await loadTrash();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  async function handlePermanentDelete(file) {
    const accepted = await askConfirm({
      title: 'Eliminar permanentemente',
      message: `¿Eliminar permanentemente "${file.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar permanentemente',
    });
    if (!accepted) return;

    setFeedback(null);
    try {
      const data = await permanentDeleteFile(file.id);
      setFeedback({ type: 'success', msg: data.message || 'Archivo eliminado permanentemente.' });
      await loadTrash();
      if (onRefreshUser) await onRefreshUser();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  async function handleEmptyTrash() {
    if (files.length === 0) return;
    const accepted = await askConfirm({
      title: 'Vaciar papelera',
      message: '¿Vaciar toda la papelera de forma permanente? Esta acción liberará tu espacio y no se puede deshacer.',
      confirmLabel: 'Vaciar papelera',
    });
    if (!accepted) return;

    setEmptying(true);
    setFeedback(null);
    try {
      const data = await emptyTrash();
      setFeedback({ type: 'success', msg: data.message || 'Papelera vaciada exitosamente.' });
      await loadTrash();
      if (onRefreshUser) await onRefreshUser();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setEmptying(false);
    }
  }

  const isEmpty = files.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ViewHeader title="Papelera" subtitle={`${files.length} elementos eliminados`}>
        <button
          type="button"
          disabled={isEmpty || emptying}
          onClick={handleEmptyTrash}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: colors.surface,
            border: `1px solid ${colors.danger}`,
            color: colors.danger,
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: isEmpty || emptying ? 'not-allowed' : 'pointer',
            opacity: isEmpty || emptying ? 0.5 : 1,
          }}
        >
          <Icon name="trash" size={14} />
          {emptying ? 'Vaciando...' : 'Vaciar papelera'}
        </button>
      </ViewHeader>

      <div style={{ padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {feedback && <Alert type={feedback.type}>{feedback.msg}</Alert>}

        {isEmpty ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFBEB', border: '1px solid #FEF08A', padding: '16px 24px', borderRadius: 12, color: '#B45309', fontSize: 14, fontWeight: 500 }}>
              <Icon name="alert" />
              Los archivos en la papelera se eliminan permanentemente después de 30 días.
            </div>
            <EmptyState icon="trash">Tu papelera está vacía.</EmptyState>
          </>
        ) : (
          <>
            <FileTable
              files={files}
              dateLabel="Eliminado el"
              onRestore={handleRestore}
              onDelete={handlePermanentDelete}
              deleteLabel="Eliminar definitivamente"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFBEB', border: '1px solid #FEF08A', padding: '16px 24px', borderRadius: 12, color: '#B45309', fontSize: 14, fontWeight: 500 }}>
              <Icon name="alert" />
              Los archivos en la papelera se eliminan permanentemente después de 30 días.
            </div>
          </>
        )}
      </div>

      {confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />}
    </div>
  );
}

export default PapeleraView;
