import { Router } from 'express';
import { subscribe, unsubscribe, listSubscribers, auditDuplicates } from '../controllers/newsletter.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { adminApiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public newsletter endpoints
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin-only newsletter subscriber listing & duplicate audit
router.get('/subscribers', adminApiRateLimiter, authenticateAdmin, listSubscribers);
router.get('/audit-duplicates', adminApiRateLimiter, authenticateAdmin, auditDuplicates);

export default router;
