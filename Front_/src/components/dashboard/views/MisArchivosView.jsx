import { useState, useEffect, useRef } from 'react';
import Icon from '../../ui/Icon';
import Alert from '../../ui/Alert';
import ViewHeader from '../ViewHeader';
import SearchInput from '../SearchInput';
import EmptyState from '../EmptyState';
import FileTable from '../FileTable';
import { colors, sectionLabelStyle, resetButtonStyle } from '../../../styles/theme';

const FOLDERS_STORAGE_KEY = 'vincloud_folders';
const FILES_STORAGE_KEY = 'vincloud_files';

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

function formatFileSize(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function getFileBadge(fileName) {
  const ext = (fileName.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);
  if (['PDF', 'PPT', 'PPTX'].includes(ext)) return { type: ext, color: colors.danger };
  if (['DOC', 'DOCX', 'TXT'].includes(ext)) return { type: ext, color: colors.info };
  if (['XLS', 'XLSX', 'CSV'].includes(ext)) return { type: ext, color: colors.successDark };
  if (['PNG', 'JPG', 'JPEG', 'SVG', 'WEBP'].includes(ext)) return { type: ext, color: colors.warningDark };
  return { type: ext, color: colors.primary };
}

function formatToday() {
  return new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function MisArchivosView() {
  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem(FOLDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem(FILES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors.primary);
  const [folderError, setFolderError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
  }, [files]);

  const currentFolder = folders.find((f) => f.id === currentFolderId) || null;

  // Filtrar carpetas y archivos según la carpeta abierta y la búsqueda
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleFolders = folders.filter((f) => {
    const matchesParent = (f.parentId || null) === currentFolderId;
    const matchesSearch = !normalizedQuery || f.name.toLowerCase().includes(normalizedQuery);
    return matchesParent && matchesSearch;
  });

  const visibleFiles = files.filter((file) => {
    const matchesFolder = (file.folderId || null) === currentFolderId;
    const matchesSearch = !normalizedQuery || file.name.toLowerCase().includes(normalizedQuery);
    return matchesFolder && matchesSearch;
  });

  function openNewFolderModal() {
    setNewFolderName('');
    setSelectedColor(colors.primary);
    setFolderError('');
    setIsModalOpen(true);
  }

  function handleCreateFolder(e) {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      setFolderError('Escribe un nombre para la carpeta.');
      return;
    }

    const exists = folders.some(
      (f) => (f.parentId || null) === currentFolderId && f.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setFolderError('Ya existe una carpeta con ese nombre en esta ubicación.');
      return;
    }

    const created = {
      id: `folder_${Date.now()}`,
      name: trimmed,
      parentId: currentFolderId,
      color: selectedColor,
      date: formatToday(),
    };

    setFolders((prev) => [created, ...prev]);
    setIsModalOpen(false);
    setNewFolderName('');
    setFolderError('');
  }

  function handleDeleteFolder(e, folderId) {
    e.stopPropagation();
    setFolders((prev) => prev.filter((f) => f.id !== folderId && f.parentId !== folderId));
    setFiles((prev) => prev.filter((file) => file.folderId !== folderId));
  }

  function handleFilesSelected(e) {
    const pickedFiles = Array.from(e.target.files || []);
    if (pickedFiles.length === 0) return;

    const uploaded = pickedFiles.map((rawFile, idx) => {
      const badge = getFileBadge(rawFile.name);
      return {
        id: `file_${Date.now()}_${idx}`,
        name: rawFile.name,
        type: badge.type,
        color: badge.color,
        size: formatFileSize(rawFile.size),
        date: formatToday(),
        folderId: currentFolderId,
      };
    });

    setFiles((prev) => [...uploaded, ...prev]);
    e.target.value = '';
  }

  function handleDeleteFile(fileId) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  function countElementsInFolder(folderId) {
    const subFolders = folders.filter((f) => f.parentId === folderId).length;
    const subFiles = files.filter((f) => f.folderId === folderId).length;
    return subFolders + subFiles;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ViewHeader
        title={currentFolder ? currentFolder.name : 'Mis Archivos'}
        subtitle={`${visibleFolders.length} carpetas · ${visibleFiles.length} archivos`}
      >
        <SearchInput
          placeholder="Buscar carpetas o archivos..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFilesSelected}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ ...actionButtonStyle, background: colors.surface, color: colors.primary }}
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
              onClick={() => setCurrentFolderId(currentFolder.parentId || null)}
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
              onClick={() => setCurrentFolderId(null)}
              style={{ ...resetButtonStyle, color: colors.muted, fontWeight: 600 }}
            >
              Mis Archivos
            </button>
            <span style={{ color: colors.subtle }}>/</span>
            <span style={{ color: colors.primaryDark, fontWeight: 700 }}>{currentFolder.name}</span>
          </div>
        )}

        <div style={{ ...sectionLabelStyle, marginBottom: 16 }}>Carpetas</div>
        {visibleFolders.length === 0 ? (
          <EmptyState style={{ padding: 32, marginBottom: 32 }}>
            Aún no tienes carpetas aquí. Haz clic en &quot;Nueva carpeta&quot; para crear una.
          </EmptyState>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            {visibleFolders.map((folder) => {
              const count = countElementsInFolder(folder.id);
              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  style={{
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
                      title="Eliminar carpeta"
                      onClick={(e) => handleDeleteFolder(e, folder.id)}
                      style={{
                        ...resetButtonStyle,
                        padding: 4,
                        borderRadius: 6,
                        color: colors.subtle,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Icon name="trash" size={14} color={colors.subtle} />
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
                    {count} {count === 1 ? 'elemento' : 'elementos'} · {folder.date}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ ...sectionLabelStyle, marginBottom: 16 }}>Archivos</div>
        {visibleFiles.length === 0 ? (
          <EmptyState icon="file">
            {searchTerm.trim()
              ? 'No se encontraron archivos que coincidan con tu búsqueda.'
              : 'Tu espacio está vacío. Comienza subiendo tus primeros archivos corporativos.'}
          </EmptyState>
        ) : (
          <FileTable files={visibleFiles} dateLabel="Modificado" onDelete={handleDeleteFile} />
        )}
      </div>

      {/* Modal para crear Nueva Carpeta */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
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
                  {currentFolder ? `Se creará dentro de "${currentFolder.name}"` : 'Se creará en Mis Archivos'}
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
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    color: colors.muted,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: colors.primary,
                    color: colors.surface,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Crear carpeta
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
