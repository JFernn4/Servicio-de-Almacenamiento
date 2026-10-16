import { useEffect, useRef, useState } from 'react';
import Icon from '../../ui/Icon';
import Alert from '../../ui/Alert';
import ViewHeader from '../ViewHeader';
import SearchInput from '../SearchInput';
import EmptyState from '../EmptyState';
import FileTable from '../FileTable';
import { colors, sectionLabelStyle, resetButtonStyle } from '../../../styles/theme';
import { mapFileForTable } from '../../../utils/user';
import {
  fetchDirectory,
  searchFiles,
  uploadFile,
  previewFile,
  downloadFile,
  shareFile,
  renameFile,
  deleteFile,
  createFolder,
  renameFolder,
  deleteFolder,
} from '../../../services/storageService';

const actionButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  border: `1px solid ${colors.primary}`,
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};

function MisArchivosView({ onRefreshUser }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'error' | 'success', msg: string }
  const [openFolderMenuId, setOpenFolderMenuId] = useState(null);

  const fileInputRef = useRef(null);

  function applyDirectoryData(data) {
    setCurrentFolder(data.carpetaActual || null);
    setFolders(
      (data.carpetas || []).map((c) => ({
        id: c.id,
        name: c.nombre,
        elements: c.total_elementos ?? 0,
        date: String(c.fecha_creacion || '').slice(0, 10),
      }))
    );
    setFiles((data.archivos || []).map(mapFileForTable));
  }

  async function loadCurrentDirectory(carpetaId = currentFolder?.id ?? null) {
    try {
      applyDirectoryData(await fetchDirectory(carpetaId));
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  useEffect(() => {
    let active = true;
    fetchDirectory(null).then(
      (data) => active && applyDirectoryData(data),
      (err) => active && setFeedback({ type: 'error', msg: err.message })
    );
    return () => {
      active = false;
    };
  }, []);

  async function handleSearchChange(value) {
    setSearchTerm(value);
    const clean = value.trim();
    if (!clean) {
      loadCurrentDirectory(currentFolder?.id ?? null);
      return;
    }

    try {
      const resultados = await searchFiles(clean);
      setFiles(resultados.map(mapFileForTable));
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setFeedback(null);
    try {
      const data = await uploadFile(file, currentFolder?.id ?? null);
      setFeedback({ type: 'success', msg: data.message || 'Archivo subido exitosamente.' });
      await loadCurrentDirectory(currentFolder?.id ?? null);
      if (onRefreshUser) await onRefreshUser();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateFolder() {
    const nombre = window.prompt('Nombre de la nueva carpeta:');
    if (!nombre || !nombre.trim()) return;

    setFeedback(null);
    try {
      const data = await createFolder(nombre.trim(), currentFolder?.id ?? null);
      setFeedback({ type: 'success', msg: data.message || 'Carpeta creada exitosamente.' });
      await loadCurrentDirectory(currentFolder?.id ?? null);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  async function handleRenameFolder(folder) {
    const nuevoNombre = window.prompt('Nuevo nombre para la carpeta:', folder.name);
    if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === folder.name) return;

    setFeedback(null);
    try {
      const data = await renameFolder(folder.id, nuevoNombre.trim());
      setFeedback({ type: 'success', msg: data.message || 'Carpeta renombrada.' });
      await loadCurrentDirectory(currentFolder?.id ?? null);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  async function handleDeleteFolder(folder) {
    if (!window.confirm(`¿Eliminar la carpeta "${folder.name}" y todo su contenido?`)) return;

    setFeedback(null);
    try {
      const data = await deleteFolder(folder.id);
      setFeedback({ type: 'success', msg: data.message || 'Carpeta eliminada.' });
      await loadCurrentDirectory(currentFolder?.id ?? null);
      if (onRefreshUser) await onRefreshUser();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  async function handlePreviewFile(file) {
    try {
      await previewFile(file.id);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  async function handleShareFile(file) {
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

  async function handleDownloadFile(file) {
    try {
      await downloadFile(file.id, file.name);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  async function handleRenameFile(file) {
    const nuevoNombre = window.prompt('Nuevo nombre para el archivo:', file.name);
    if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === file.name) return;

    setFeedback(null);
    try {
      const data = await renameFile(file.id, nuevoNombre.trim());
      setFeedback({ type: 'success', msg: data.message || 'Archivo renombrado.' });
      await loadCurrentDirectory(currentFolder?.id ?? null);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  async function handleDeleteFile(file) {
    if (!window.confirm(`¿Eliminar el archivo "${file.name}"?`)) return;

    setFeedback(null);
    try {
      const data = await deleteFile(file.id);
      setFeedback({ type: 'success', msg: data.message || 'Archivo eliminado.' });
      await loadCurrentDirectory(currentFolder?.id ?? null);
      if (onRefreshUser) await onRefreshUser();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      <ViewHeader
        title={currentFolder ? `Mis Archivos / ${currentFolder.nombre}` : 'Mis Archivos'}
        subtitle={`${folders.length} carpetas · ${files.length} archivos`}
      >
        <SearchInput
          placeholder="Buscar archivos..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          {currentFolder && (
            <button
              type="button"
              onClick={() => loadCurrentDirectory(currentFolder.carpeta_padre_id ?? null)}
              style={{ ...actionButtonStyle, background: colors.surface, color: colors.muted, borderColor: colors.border }}
            >
              ← Volver
            </button>
          )}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            style={{ ...actionButtonStyle, background: colors.surface, color: colors.primary, opacity: uploading ? 0.6 : 1 }}
          >
            <Icon name="upload" size={14} />
            {uploading ? 'Subiendo...' : 'Subir archivo'}
          </button>
          <button
            type="button"
            onClick={handleCreateFolder}
            style={{ ...actionButtonStyle, background: colors.primary, color: '#fff' }}
          >
            <Icon name="folderPlus" size={14} />
            Nueva carpeta
          </button>
        </div>
      </ViewHeader>

      <div style={{ padding: 32, overflowY: 'auto' }}>
        {feedback && (
          <div style={{ marginBottom: 20 }}>
            <Alert type={feedback.type}>{feedback.msg}</Alert>
          </div>
        )}

        {!searchTerm.trim() && (
          <>
            <div style={{ ...sectionLabelStyle, marginBottom: 16 }}>Carpetas</div>
            {folders.length === 0 ? (
              <EmptyState style={{ padding: 32, marginBottom: 32 }}>
                Aún no tienes carpetas en este nivel. Haz clic en &quot;Nueva carpeta&quot; para crear una.
              </EmptyState>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
                {folders.map((folder) => {
                  const isMenuOpen = openFolderMenuId === folder.id;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => loadCurrentDirectory(folder.id)}
                      style={{ position: 'relative', background: colors.surface, borderRadius: 12, padding: 16, width: 200, border: `1px solid ${colors.border}`, cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Icon name="folder" size={24} fill="#FCA5A5" />
                        <button
                          type="button"
                          aria-label={`Opciones de carpeta ${folder.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFolderMenuId(isMenuOpen ? null : folder.id);
                          }}
                          style={{ ...resetButtonStyle, padding: 4 }}
                        >
                          <Icon name="more" size={16} color={colors.subtle} />
                        </button>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: colors.primaryDark, marginBottom: 4 }}>{folder.name}</div>
                      <div style={{ fontSize: 12, color: colors.subtle }}>{folder.elements} elementos · {folder.date}</div>

                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            right: 12,
                            top: 42,
                            background: colors.surface,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.1)',
                            zIndex: 20,
                            minWidth: 130,
                            overflow: 'hidden',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenFolderMenuId(null);
                              handleRenameFolder(folder);
                            }}
                            style={{ ...resetButtonStyle, display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: colors.primaryDark }}
                          >
                            Renombrar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenFolderMenuId(null);
                              handleDeleteFolder(folder);
                            }}
                            style={{ ...resetButtonStyle, display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: colors.danger }}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div style={{ ...sectionLabelStyle, marginBottom: 16 }}>Archivos</div>
        {files.length === 0 ? (
          <EmptyState icon="file">
            {searchTerm.trim()
              ? 'No se encontraron archivos que coincidan con tu búsqueda.'
              : 'Tu espacio está vacío. Comienza subiendo tus primeros archivos corporativos.'}
          </EmptyState>
        ) : (
          <FileTable
            files={files}
            dateLabel="Modificado"
            onPreview={handlePreviewFile}
            onShare={handleShareFile}
            onDownload={handleDownloadFile}
            onRename={handleRenameFile}
            onDelete={handleDeleteFile}
          />
        )}
      </div>
    </div>
  );
}

export default MisArchivosView;
