import { Router } from 'express';
import { createOrder, verifyPayment, razorpayWebhook } from '../controllers/payment.controller';

const router = Router();

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', razorpayWebhook);

export default router;
