import { useEffect, useState } from 'react';
import Alert from '../../ui/Alert';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { useConfirm } from '../../../hooks/useConfirm';
import RenameModal from '../modals/RenameModal';
import ShareModal from '../modals/ShareModal';
import MoveModal from '../modals/MoveModal';
import ViewHeader from '../ViewHeader';
import SearchInput from '../SearchInput';
import EmptyState from '../EmptyState';
import FileTable from '../FileTable';
import { sectionLabelStyle } from '../../../styles/theme';
import { mapFileForTable } from '../../../utils/user';
import { fetchRecentFiles, previewFile, shareFile, downloadFile, renameFile, moveFile, deleteFile } from '../../../services/storageService';

function RecientesView({ onRefreshUser }) {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState(null);
  const { askConfirm, confirmDialogProps } = useConfirm();
  const [renameTarget, setRenameTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);

  async function loadRecent() {
    try {
      const recientes = await fetchRecentFiles(15);
      setFiles(recientes.map(mapFileForTable));
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  useEffect(() => {
    let active = true;
    fetchRecentFiles(15).then(
      (recientes) => active && setFiles(recientes.map(mapFileForTable)),
      (err) => active && setFeedback({ type: 'error', msg: err.message })
    );
    return () => {
      active = false;
    };
  }, []);

  async function handlePreview(file) {
    try {
      await previewFile(file.id);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  function handleShare(file) {
    setShareTarget(file);
  }

  async function handleDownload(file) {
    try {
      await downloadFile(file.id, file.name);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  function handleRename(file) {
    setRenameTarget({ id: file.id, name: file.name, type: 'file' });
  }

  async function handleConfirmRename(newName) {
    if (!renameTarget) return;
    setFeedback(null);
    const data = await renameFile(renameTarget.id, newName);
    setFeedback({ type: 'success', msg: data.message || 'Archivo renombrado.' });
    await loadRecent();
  }

  async function handleConfirmMove(targetFolderId) {
    if (!moveTarget) return;
    setFeedback(null);
    const data = await moveFile(moveTarget.id, targetFolderId);
    setFeedback({ type: 'success', msg: data.message || 'Archivo movido exitosamente.' });
    await loadRecent();
    if (onRefreshUser) await onRefreshUser();
  }

  async function handleDelete(file) {
    const accepted = await askConfirm({
      title: 'Eliminar archivo',
      message: `¿Eliminar el archivo "${file.name}"?`,
      confirmLabel: 'Eliminar archivo',
    });
    if (!accepted) return;

    try {
      await deleteFile(file.id);
      await loadRecent();
      if (onRefreshUser) await onRefreshUser();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  const filteredFiles = searchTerm.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    : files;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, overflow: 'hidden' }}>
      <ViewHeader title="Recientes" subtitle="Tus archivos subidos o modificados recientemente">
        <SearchInput
          placeholder="Buscar en recientes..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </ViewHeader>

      <div style={{ padding: '32px 32px 240px 32px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {feedback && (
          <div style={{ marginBottom: 20 }}>
            <Alert type={feedback.type}>{feedback.msg}</Alert>
          </div>
        )}

        <div style={{ ...sectionLabelStyle, marginBottom: 16 }}>Esta semana</div>
        {filteredFiles.length === 0 ? (
          <EmptyState icon="clock">
            Aún no tienes archivos recientes. Tus archivos subidos recientemente aparecerán aquí.
          </EmptyState>
        ) : (
          <FileTable
            files={filteredFiles}
            dateLabel="Subido"
            onPreview={handlePreview}
            onShare={handleShare}
            onDownload={handleDownload}
            onRename={handleRename}
            onMove={setMoveTarget}
            onDelete={handleDelete}
          />
        )}
      </div>

      {confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />}

      <RenameModal
        isOpen={Boolean(renameTarget)}
        item={renameTarget}
        onClose={() => setRenameTarget(null)}
        onConfirm={handleConfirmRename}
      />

      <ShareModal
        isOpen={Boolean(shareTarget)}
        file={shareTarget}
        onClose={() => setShareTarget(null)}
        onShare={async (file, correo) => {
          return await shareFile(file.id, correo);
        }}
      />

      <MoveModal
        isOpen={Boolean(moveTarget)}
        file={moveTarget}
        currentFolderId={moveTarget?.carpetaId ?? null}
        onClose={() => setMoveTarget(null)}
        onConfirm={handleConfirmMove}
      />
    </div>
  );
}

export default RecientesView;
