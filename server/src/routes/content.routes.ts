import { Router } from 'express';
import { contentController } from '../controllers/content.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { adminApiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public Read Endpoints (used by website visitors and frontend services)
router.get('/', (req, res) => contentController.getSnapshot(req, res));
router.get('/:module', (req, res) => contentController.getModule(req, res));

// Protected Admin Mutation Endpoints (Rate limited & Authenticated)
router.post('/sync-all', adminApiRateLimiter, authenticateAdmin, (req, res) => contentController.syncAll(req, res));
router.post('/:module', adminApiRateLimiter, authenticateAdmin, (req, res) => contentController.upsertItem(req, res));
router.put('/:module', adminApiRateLimiter, authenticateAdmin, (req, res) => contentController.saveModule(req, res));
router.delete('/:module/:id', adminApiRateLimiter, authenticateAdmin, (req, res) => contentController.deleteItem(req, res));

export default router;
