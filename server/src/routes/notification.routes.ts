import { Router } from 'express';
import { sendNotification, broadcastNotification } from '../controllers/notification.controller';

const router = Router();

router.post('/send', sendNotification);
router.post('/broadcast', broadcastNotification);

export default router;
