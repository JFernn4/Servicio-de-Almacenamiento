import { Router } from 'express';
import {
  getUsers,
  updateUser,
  deleteUser,
  getPlans,
  createPlan,
  updatePlan,
  getUserPlans,
  getServiceReport,
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de administración exigen autenticación JWT y rol 'Administrador'
router.use(authenticateToken, requireAdmin);

// --- Reportes Generales del Servicio (Clase Reporte UML) ---
router.get('/reports', getServiceReport);

// --- Gestión de Cuentas y Consumo de Clientes ---
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// --- Visualización de Planes de Usuarios (Diagrama de Actividad UML) ---
router.get('/user-plans', getUserPlans);

// --- Administración del Catálogo de Planes ---
router.get('/plans', getPlans);
router.post('/plans', createPlan);
router.patch('/plans/:id', updatePlan);

export default router;
