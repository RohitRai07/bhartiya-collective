import { Router } from 'express';
import { submitPaper, getSubmissions } from '../controllers/submission.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { adminApiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public submission intake endpoint
router.post('/papers', submitPaper);

// Admin-only submission review list
router.get('/papers', adminApiRateLimiter, authenticateAdmin, getSubmissions);

export default router;
