import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { registerSchema, loginSchema, refreshTokenSchema, verifyEmailSchema } from '../validation/authValidation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.post('/resend-verification', authenticateToken, AuthController.resendVerificationEmail);

export default router;