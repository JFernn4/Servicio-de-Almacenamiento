import { useEffect, useState } from 'react';
import Icon from '../../ui/Icon';
import Alert from '../../ui/Alert';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { useConfirm } from '../../../hooks/useConfirm';
import ViewHeader from '../ViewHeader';
import EmptyState from '../EmptyState';
import FileTable from '../FileTable';
import { colors, sectionLabelStyle, resetButtonStyle } from '../../../styles/theme';
import { mapFileForTable, formatBytes } from '../../../utils/user';
import {
  fetchTrash,
  restoreFile,
  permanentDeleteFile,
  restoreFolder,
  permanentDeleteFolder,
  emptyTrash,
} from '../../../services/storageService';

const RETENTION_NOTICE = 'Los archivos en la papelera se eliminan permanentemente después de 30 días.';

function describeFolder(folder) {
  const parts = [`${folder.total_archivos} ${folder.total_archivos === 1 ? 'archivo' : 'archivos'}`];
  if (folder.total_subcarpetas > 0) {
    parts.push(`${folder.total_subcarpetas} ${folder.total_subcarpetas === 1 ? 'subcarpeta' : 'subcarpetas'}`);
  }
  parts.push(formatBytes(folder.tamano_total));
  return parts.join(' · ');
}

function PapeleraView({ onRefreshUser }) {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [emptying, setEmptying] = useState(false);
  const { askConfirm, confirmDialogProps } = useConfirm();

  function applyTrash({ archivos, carpetas }) {
    setFiles(archivos.map(mapFileForTable));
    setFolders(carpetas);
  }

  async function loadTrash() {
    try {
      applyTrash(await fetchTrash());
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  useEffect(() => {
    let active = true;
    fetchTrash().then(
      (contenido) => active && applyTrash(contenido),
      (err) => active && setFeedback({ type: 'error', msg: err.message })
    );
    return () => {
      active = false;
    };
  }, []);

  // Ejecuta una acción de la papelera, muestra su mensaje y recarga la lista
  async function runAction(action, fallbackMsg, { refreshUser = false } = {}) {
    setFeedback(null);
    try {
      const data = await action();
      setFeedback({ type: 'success', msg: data.message || fallbackMsg });
      await loadTrash();
      if (refreshUser && onRefreshUser) await onRefreshUser();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  function handleRestore(file) {
    return runAction(() => restoreFile(file.id), 'Archivo restaurado exitosamente.');
  }

  async function handlePermanentDelete(file) {
    const accepted = await askConfirm({
      title: 'Eliminar permanentemente',
      message: `¿Eliminar permanentemente "${file.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar permanentemente',
    });
    if (accepted) {
      await runAction(() => permanentDeleteFile(file.id), 'Archivo eliminado permanentemente.', { refreshUser: true });
    }
  }

  function handleRestoreFolder(folder) {
    return runAction(() => restoreFolder(folder.id), 'Carpeta restaurada exitosamente.');
  }

  async function handlePermanentDeleteFolder(folder) {
    const accepted = await askConfirm({
      title: 'Eliminar carpeta permanentemente',
      message: `¿Eliminar permanentemente la carpeta "${folder.nombre}" y todo su contenido (${describeFolder(folder)})? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar permanentemente',
    });
    if (accepted) {
      await runAction(() => permanentDeleteFolder(folder.id), 'Carpeta eliminada permanentemente.', { refreshUser: true });
    }
  }

  async function handleEmptyTrash() {
    if (isEmpty) return;
    const accepted = await askConfirm({
      title: 'Vaciar papelera',
      message: '¿Vaciar toda la papelera de forma permanente, incluidas las carpetas y su contenido? Esta acción liberará tu espacio y no se puede deshacer.',
      confirmLabel: 'Vaciar papelera',
    });
    if (!accepted) return;

    setEmptying(true);
    await runAction(emptyTrash, 'Papelera vaciada exitosamente.', { refreshUser: true });
    setEmptying(false);
  }

  const totalItems = files.length + folders.length;
  const isEmpty = totalItems === 0;

  const notice = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFBEB', border: '1px solid #FEF08A', padding: '16px 24px', borderRadius: 12, color: '#B45309', fontSize: 14, fontWeight: 500 }}>
      <Icon name="alert" />
      {RETENTION_NOTICE}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, overflow: 'hidden' }}>
      <ViewHeader title="Papelera" subtitle={`${totalItems} elementos eliminados`}>
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

      <div style={{ padding: '32px 32px 240px 32px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {feedback && <Alert type={feedback.type}>{feedback.msg}</Alert>}

        {isEmpty ? (
          <>
            {notice}
            <EmptyState icon="trash">Tu papelera está vacía.</EmptyState>
          </>
        ) : (
          <>
            {folders.length > 0 && (
              <div>
                <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>Carpetas</div>
                <div style={{ background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                  {folders.map((folder, index) => (
                    <div
                      key={folder.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 20px',
                        borderTop: index === 0 ? 'none' : `1px solid ${colors.borderLight}`,
                      }}
                    >
                      <Icon name="folder" size={24} fill="#FCA5A5" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: colors.primaryDark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {folder.nombre}
                        </div>
                        <div style={{ fontSize: 12, color: colors.subtle }}>
                          {describeFolder(folder)} · eliminada el {String(folder.fecha_eliminacion || '').slice(0, 10)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreFolder(folder)}
                        style={{ ...resetButtonStyle, fontSize: 13, fontWeight: 700, color: colors.primary, padding: '6px 10px' }}
                      >
                        Restaurar
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDeleteFolder(folder)}
                        style={{ ...resetButtonStyle, fontSize: 13, fontWeight: 700, color: colors.danger, padding: '6px 10px' }}
                      >
                        Eliminar definitivamente
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div>
                {folders.length > 0 && <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>Archivos</div>}
                <FileTable
                  files={files}
                  dateLabel="Eliminado el"
                  onRestore={handleRestore}
                  onDelete={handlePermanentDelete}
                  deleteLabel="Eliminar definitivamente"
                />
              </div>
            )}

            {notice}
          </>
        )}
      </div>

      {confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />}
    </div>
  );
}

export default PapeleraView;
