import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { registerSchema, loginSchema, refreshTokenSchema, verifyEmailSchema, verify2FASchema, disable2FASchema } from '../validation/authValidation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);

// 2FA routes (public — uses temp token for auth)
router.post('/2fa/verify', validate(verify2FASchema), AuthController.verify2FA);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.post('/resend-verification', authenticateToken, AuthController.resendVerificationEmail);
router.post('/2fa/enable', authenticateToken, AuthController.enable2FA);
router.post('/2fa/disable', authenticateToken, validate(disable2FASchema), AuthController.disable2FA);

export default router;