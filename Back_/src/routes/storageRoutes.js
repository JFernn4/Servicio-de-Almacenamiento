import { Router } from 'express';
import {
  uploadFile,
  downloadFile,
  viewFile,
  shareFile,
  getSharedFileInfo,
  downloadSharedFile,
  deleteFile,
  renameFile,
  getDirectoryContents,
  getRecentFiles,
  searchFiles,
  getTrashFiles,
  restoreFile,
  permanentDeleteFile,
  emptyTrash,
  createFolder,
  renameFolder,
  deleteFolder,
} from '../controllers/storageController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { handleSingleUpload } from '../middlewares/uploadMiddleware.js';
import { uploadRateLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = Router();

// --- Acceso Público por Enlace de Invitación (Invitado) ---
router.get('/shared/:token', getSharedFileInfo);
router.get('/shared/:token/download', downloadSharedFile);

// Todas las demás operaciones de almacenamiento requieren autenticación JWT
router.use(authenticateToken);

// --- Archivos ---
router.post('/upload', uploadRateLimiter, handleSingleUpload('archivo'), uploadFile);
router.get('/files', getDirectoryContents);
router.get('/files/recent', getRecentFiles);
router.get('/files/search', searchFiles);
router.get('/files/:id/view', viewFile);
router.get('/files/:id/download', downloadFile);
router.post('/files/:id/share', shareFile);
router.patch('/files/:id', renameFile);
router.delete('/files/:id', deleteFile);

// --- Papelera ---
router.get('/trash', getTrashFiles);
router.delete('/trash', emptyTrash);
router.post('/trash/:id/restore', restoreFile);
router.delete('/trash/:id', permanentDeleteFile);

// --- Carpetas ---
router.post('/folders', createFolder);
router.patch('/folders/:id', renameFolder);
router.delete('/folders/:id', deleteFolder);

export default router;
