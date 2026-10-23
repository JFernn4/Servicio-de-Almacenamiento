import { Router } from 'express';
import {
  getPlansCatalog,
  getMySubscription,
  subscribeOrChangePlan,
  renewSubscription,
  cancelSubscription,
  getPaymentHistory,
  previewDecoratorChain,
} from '../controllers/subscriptionController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// --- Rutas públicas (Invitado / Catálogo y Simulación del Patrón Decorator) ---
router.get('/plans', getPlansCatalog);
router.post('/decorator-preview', previewDecoratorChain);

// --- Rutas autenticadas (Cliente / Usuario) ---
router.use(authenticateToken);

router.get('/me', getMySubscription);
router.post('/subscribe', subscribeOrChangePlan);
router.post('/change', subscribeOrChangePlan);
router.post('/renew', renewSubscription);
router.post('/cancel', cancelSubscription);
router.get('/payments', getPaymentHistory);

export default router;
