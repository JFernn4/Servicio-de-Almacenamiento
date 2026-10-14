import { Router } from 'express';
import {
  uploadFile,
  downloadFile,
  deleteFile,
  renameFile,
  getDirectoryContents,
  getRecentFiles,
  searchFiles,
  createFolder,
  renameFolder,
  deleteFolder,
} from '../controllers/storageController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { handleSingleUpload } from '../middlewares/uploadMiddleware.js';

const router = Router();

// Todas las operaciones de almacenamiento requieren autenticación JWT
router.use(authenticateToken);

// --- Archivos ---
router.post('/upload', handleSingleUpload('archivo'), uploadFile);
router.get('/files', getDirectoryContents);
router.get('/files/recent', getRecentFiles);
router.get('/files/search', searchFiles);
router.get('/files/:id/download', downloadFile);
router.patch('/files/:id', renameFile);
router.delete('/files/:id', deleteFile);

// --- Carpetas ---
router.post('/folders', createFolder);
router.patch('/folders/:id', renameFolder);
router.delete('/folders/:id', deleteFolder);

export default router;
