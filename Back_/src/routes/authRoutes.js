import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  verifyEmail, 
  forgotPassword, 
  resetPassword 
} from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getProfile);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
