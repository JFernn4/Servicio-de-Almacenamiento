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

const FOLDER_COLORS_KEY = 'vincloud_folder_colors';

const FOLDER_COLORS = [
  { label: 'Vino', value: colors.primary },
  { label: 'Azul', value: colors.info },
  { label: 'Esmeralda', value: colors.success },
  { label: 'Ámbar', value: colors.warning },
  { label: 'Coral', value: '#FCA5A5' },
];

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

function readFolderColors() {
  try {
    return JSON.parse(localStorage.getItem(FOLDER_COLORS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveFolderColor(folderId, color) {
  const current = readFolderColors();
  current[folderId] = color;
  localStorage.setItem(FOLDER_COLORS_KEY, JSON.stringify(current));
}

function MisArchivosView({ onRefreshUser }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'error' | 'success', msg: string }
  const [openFolderMenuId, setOpenFolderMenuId] = useState(null);

  // Estado del modal de Nueva Carpeta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FCA5A5');
  const [folderError, setFolderError] = useState('');

  const fileInputRef = useRef(null);

  function applyDirectoryData(data) {
    const colorMap = readFolderColors();
    setCurrentFolder(data.carpetaActual || null);
    setFolders(
      (data.carpetas || []).map((c) => ({
        id: c.id,
        name: c.nombre,
        elements: c.total_elementos ?? 0,
        date: String(c.fecha_creacion || '').slice(0, 10),
        color: colorMap[c.id] || '#FCA5A5',
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
    // Limpiar posibles restos antiguos en localStorage que causaban carpetas compartidas
    localStorage.removeItem('vincloud_folders');
    localStorage.removeItem('vincloud_files');

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

  function openNewFolderModal() {
    setNewFolderName('');
    setSelectedColor('#FCA5A5');
    setFolderError('');
    setIsModalOpen(true);
  }

  async function handleCreateFolder(e) {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      setFolderError('Escribe un nombre para la carpeta.');
      return;
    }

    setCreatingFolder(true);
    setFolderError('');
    setFeedback(null);
    try {
      const data = await createFolder(trimmed, currentFolder?.id ?? null);
      if (data?.carpeta?.id) {
        saveFolderColor(data.carpeta.id, selectedColor);
      }
      setIsModalOpen(false);
      setNewFolderName('');
      setFeedback({ type: 'success', msg: data.message || 'Carpeta creada exitosamente.' });
      await loadCurrentDirectory(currentFolder?.id ?? null);
    } catch (err) {
      setFolderError(err.message);
    } finally {
      setCreatingFolder(false);
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
        title={currentFolder ? currentFolder.nombre : 'Mis Archivos'}
        subtitle={`${folders.length} carpetas · ${files.length} archivos`}
      >
        <SearchInput
          placeholder="Buscar archivos..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div style={{ display: 'flex', gap: 12 }}>
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
            onClick={openNewFolderModal}
            style={{ ...actionButtonStyle, background: colors.primary, color: colors.surface }}
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

        {/* Barra de navegación (Breadcrumbs) cuando se está dentro de una carpeta */}
        {currentFolder && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 24,
              padding: '10px 14px',
              background: colors.surface,
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              fontSize: 13,
            }}
          >
            <button
              type="button"
              onClick={() => loadCurrentDirectory(currentFolder.carpeta_padre_id ?? null)}
              style={{
                ...resetButtonStyle,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: colors.primary,
                fontWeight: 700,
              }}
            >
              ← Volver
            </button>
            <span style={{ color: colors.border }}>|</span>
            <button
              type="button"
              onClick={() => loadCurrentDirectory(null)}
              style={{ ...resetButtonStyle, color: colors.muted, fontWeight: 600 }}
            >
              Mis Archivos
            </button>
            <span style={{ color: colors.subtle }}>/</span>
            <span style={{ color: colors.primaryDark, fontWeight: 700 }}>{currentFolder.nombre}</span>
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
                      style={{
                        position: 'relative',
                        background: colors.surface,
                        borderRadius: 12,
                        padding: 16,
                        width: 215,
                        border: `1px solid ${colors.border}`,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Icon name="folder" size={26} fill={folder.color || '#FCA5A5'} />
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
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: colors.primaryDark,
                          marginBottom: 4,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {folder.name}
                      </div>
                      <div style={{ fontSize: 12, color: colors.subtle }}>
                        {folder.elements} {folder.elements === 1 ? 'elemento' : 'elementos'} · {folder.date}
                      </div>

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

      {/* Modal para crear Nueva Carpeta */}
      {isModalOpen && (
        <div
          onClick={() => !creatingFolder && setIsModalOpen(false)}
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
            onClick={(e) => e.stopPropagation()}
            style={{
              background: colors.surface,
              borderRadius: 16,
              width: '100%',
              maxWidth: 420,
              padding: 28,
              border: `1px solid ${colors.border}`,
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: colors.primarySoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="folderPlus" size={20} color={colors.primary} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.primaryDark }}>
                  Nueva carpeta
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: colors.subtle }}>
                  {currentFolder ? `Se creará dentro de "${currentFolder.nombre}"` : 'Se creará en Mis Archivos'}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label
                  htmlFor="folder-name-input"
                  style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 6 }}
                >
                  Nombre de la carpeta
                </label>
                <input
                  id="folder-name-input"
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => {
                    setNewFolderName(e.target.value);
                    if (folderError) setFolderError('');
                  }}
                  placeholder="Ej. Proyectos 2026, Facturas..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1px solid ${folderError ? colors.danger : colors.border}`,
                    background: colors.surfaceAlt,
                    fontSize: 14,
                    color: colors.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {folderError && (
                  <div style={{ fontSize: 12, color: colors.danger, marginTop: 6, fontWeight: 600 }}>
                    {folderError}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.primaryDark, marginBottom: 8 }}>
                  Color de etiqueta
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {FOLDER_COLORS.map((c) => {
                    const isSelected = selectedColor === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        title={c.label}
                        onClick={() => setSelectedColor(c.value)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: c.value,
                          border: isSelected ? `3px solid ${colors.primaryDark}` : `2px solid ${colors.surface}`,
                          boxShadow: `0 0 0 1px ${colors.border}`,
                          cursor: 'pointer',
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  disabled={creatingFolder}
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    color: colors.muted,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: creatingFolder ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: colors.primary,
                    color: colors.surface,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: creatingFolder ? 'not-allowed' : 'pointer',
                    opacity: creatingFolder ? 0.7 : 1,
                  }}
                >
                  {creatingFolder ? 'Creando...' : 'Crear carpeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MisArchivosView;
