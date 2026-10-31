import { Router } from 'express';
import { 
  sendNotification, 
  broadcastNotification, 
  getEmailActivityLogs, 
  sendTestEmail, 
  verifySmtpConnection 
} from '../controllers/notification.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { adminApiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Secure notification endpoints: Only authenticated administrators with completed 2FA can dispatch
router.post('/send', adminApiRateLimiter, authenticateAdmin, sendNotification);
router.post('/broadcast', adminApiRateLimiter, authenticateAdmin, broadcastNotification);
router.get('/logs', adminApiRateLimiter, authenticateAdmin, getEmailActivityLogs);
router.post('/test', adminApiRateLimiter, authenticateAdmin, sendTestEmail);
router.get('/smtp/verify', adminApiRateLimiter, authenticateAdmin, verifySmtpConnection);

export default router;
