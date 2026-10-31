import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import {
  loginRateLimiter,
  passwordResetRateLimiter,
} from '../middlewares/rateLimitMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.get('/me', authenticateToken, getProfile);
router.get('/verify', verifyEmail);
router.post('/verify', verifyEmail);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', passwordResetRateLimiter, resendVerification);
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);
router.post('/reset-password', passwordResetRateLimiter, resetPassword);

export default router;
