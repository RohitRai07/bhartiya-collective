import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { validateLoginInput, validateOtpInput } from '../middleware/validation.middleware';
import { loginRateLimiter, otpRequestRateLimiter, otpVerifyRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public Authentication Flow
router.post('/login', loginRateLimiter, validateLoginInput, (req, res) => authController.login(req, res));
router.post('/otp/verify', otpVerifyRateLimiter, validateOtpInput, (req, res) => authController.verifyTwoFactor(req, res));
router.post('/otp/resend', otpRequestRateLimiter, (req, res) => authController.resendOtp(req, res));

// Protected Session Management
router.get('/session', authenticateAdmin, (req, res) => authController.getSession(req, res));
router.post('/logout', authenticateAdmin, (req, res) => authController.logout(req, res));

export default router;
