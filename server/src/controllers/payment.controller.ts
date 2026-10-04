import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { amount, receiptId, notes } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const order = await paymentService.createOrder({
      amount: Number(amount),
      receiptId: receiptId || `rcpt_${Date.now()}`,
      notes
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      // Provide public key ID to frontend, never secret
      keyId: process.env.RAZORPAY_KEY_ID || 'mock_key_id'
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const isValid = paymentService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (isValid) {
      // Update your DB: mark payment as success
      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const razorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    
    // Express provides req.body as parsed JSON usually, but webhook verification
    // requires the raw body string. Assuming you use express.raw for this route or JSON stringify
    const payload = JSON.stringify(req.body); 

    const isValid = paymentService.verifyWebhookSignature(payload, signature);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    console.log('Received Razorpay Webhook Event:', event);

    switch (event) {
      case 'payment.captured':
        // Update DB: Payment successful
        break;
      case 'payment.failed':
        // Update DB: Payment failed
        break;
      // Handle others as needed
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
