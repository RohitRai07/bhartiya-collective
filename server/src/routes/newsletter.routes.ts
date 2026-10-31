import { Router } from 'express';
import { subscribe, unsubscribe, listSubscribers } from '../controllers/newsletter.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { adminApiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public newsletter endpoints
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin-only newsletter subscriber listing
router.get('/subscribers', adminApiRateLimiter, authenticateAdmin, listSubscribers);

export default router;
