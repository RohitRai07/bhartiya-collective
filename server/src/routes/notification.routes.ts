import { Router } from 'express';
import { sendNotification, broadcastNotification } from '../controllers/notification.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { adminApiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Secure notification endpoints: Only authenticated administrators with completed 2FA can dispatch
router.post('/send', adminApiRateLimiter, authenticateAdmin, sendNotification);
router.post('/broadcast', adminApiRateLimiter, authenticateAdmin, broadcastNotification);

export default router;
