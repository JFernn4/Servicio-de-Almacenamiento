import { useEffect, useState } from 'react';
import Alert from '../../ui/Alert';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { useConfirm } from '../../../hooks/useConfirm';
import ViewHeader from '../ViewHeader';
import SearchInput from '../SearchInput';
import EmptyState from '../EmptyState';
import FileTable from '../FileTable';
import { sectionLabelStyle } from '../../../styles/theme';
import { mapFileForTable } from '../../../utils/user';
import { fetchRecentFiles, previewFile, shareFile, downloadFile, renameFile, deleteFile } from '../../../services/storageService';

function RecientesView({ onRefreshUser }) {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState(null);
  const { askConfirm, confirmDialogProps } = useConfirm();

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

  async function handleShare(file) {
    const correo = window.prompt(
      `Ingresa el correo del usuario registrado para enviarle una invitación a "${file.name}" (o déjalo vacío para generar solo el enlace público):`,
      ''
    );
    if (correo === null) return;

    setFeedback(null);
    try {
      const data = await shareFile(file.id, correo.trim());
      if (navigator.clipboard && data.shareUrl) {
        await navigator.clipboard.writeText(data.shareUrl).catch(() => {});
      }
      setFeedback({
        type: 'success',
        msg: `${data.message} Enlace: ${data.shareUrl}`,
      });
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  async function handleDownload(file) {
    try {
      await downloadFile(file.id, file.name);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  async function handleRename(file) {
    const nuevoNombre = window.prompt('Nuevo nombre para el archivo:', file.name);
    if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === file.name) return;

    try {
      await renameFile(file.id, nuevoNombre.trim());
      await loadRecent();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
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
            onDelete={handleDelete}
          />
        )}
      </div>

      {confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />}
    </div>
  );
}

export default RecientesView;
