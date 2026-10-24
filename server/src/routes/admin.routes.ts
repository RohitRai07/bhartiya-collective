import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { adminApiRateLimiter } from '../middleware/rateLimit.middleware';
import { validateFileUpload } from '../middleware/validation.middleware';

const router = Router();

// Apply administrative authentication and rate limiting to all /api/admin/* endpoints
router.use(adminApiRateLimiter);
router.use(authenticateAdmin);

// Dashboard Overview
router.get('/overview', (req, res) => adminController.getOverview(req, res));

// Content Management (CRUD / Publish)
router.post('/content/action', (req, res) => adminController.handleContentAction(req, res));

// Secure File Uploads
router.post('/upload', validateFileUpload, (req, res) => adminController.handleFileUpload(req, res));

// Subscriber Management
router.get('/subscribers', (req, res) => adminController.getSubscribers(req, res));

// Career Management
router.put('/careers/:id/status', (req, res) => adminController.updateCareerStatus(req, res));

export default router;
