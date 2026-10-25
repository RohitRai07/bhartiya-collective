import { Router } from 'express';
import { 
  createOrder, 
  verifyPayment, 
  razorpayWebhook, 
  getPaymentConfig, 
  getTransactions 
} from '../controllers/payment.controller';

const router = Router();

// Public payment endpoints
router.get('/config', getPaymentConfig);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', razorpayWebhook);

// Protected transactions listing
router.get('/transactions', getTransactions);

export default router;
