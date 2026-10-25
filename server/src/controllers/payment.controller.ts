import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { config } from '../config/env';

/**
 * Creates a server-side order with Razorpay
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, receiptId, notes, purpose } = req.body;
    
    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({ error: 'A valid contribution amount is required.', code: 'INVALID_AMOUNT' });
      return;
    }

    const numAmount = Number(amount);

    // Enforce existing minimum donation constraint of ₹500 for donation flows
    if (purpose === 'donation' && numAmount < 500) {
      res.status(400).json({ 
        error: 'Minimum donation amount is ₹500.', 
        code: 'BELOW_MINIMUM_DONATION' 
      });
      return;
    }

    const order = await paymentService.createOrder({
      amount: numAmount,
      receiptId: receiptId || `rcpt_${Date.now()}`,
      notes: notes || {},
      purpose: purpose || 'donation',
    });

    // Provide public key ID to frontend, never the key secret
    const keyId = config.razorpay.keyId || process.env.RAZORPAY_KEY_ID || 'mock_key_id';

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount, // in paise
      currency: order.currency || 'INR',
      keyId,
      isMock: !paymentService.isConfigured(),
    });
  } catch (error: any) {
    console.error('Create Order Error:', error);
    res.status(500).json({ 
      error: error.message || 'Unable to create payment order. Please try again.',
      code: 'ORDER_CREATION_FAILED' 
    });
  }
};

/**
 * Cryptographically verifies Razorpay payment callback on the backend
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      donorDetails,
      purpose,
      amount
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required Razorpay payment verification parameters.',
        code: 'MISSING_PAYMENT_PARAMS' 
      });
      return;
    }

    const isValid = paymentService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (isValid) {
      const transaction = paymentService.recordTransaction({
        id: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        amount: Number(amount) || 0,
        purpose: purpose || 'donation',
        donorName: donorDetails?.donorName,
        email: donorDetails?.email,
        phone: donorDetails?.phone,
        panNumber: donorDetails?.panNumber,
        cause: donorDetails?.cause,
        frequency: donorDetails?.frequency,
        receiptId: donorDetails?.receiptId,
        status: 'captured',
        verifiedAt: new Date().toISOString(),
      });

      res.status(200).json({ 
        success: true, 
        message: 'Payment verified and confirmed successfully.',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        transaction,
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Payment verification failed: Invalid cryptographic signature.',
        code: 'INVALID_SIGNATURE' 
      });
    }
  } catch (error: any) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Internal Server Error during payment verification.' });
  }
};

/**
 * Handles incoming webhooks from Razorpay
 */
export const razorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = JSON.stringify(req.body); 

    const isValid = paymentService.verifyWebhookSignature(payload, signature);

    if (!isValid) {
      res.status(400).json({ error: 'Invalid webhook signature.' });
      return;
    }

    const event = req.body.event;
    console.log('[Razorpay Webhook Received]', event);

    switch (event) {
      case 'payment.captured':
        // Payment was captured by Razorpay
        break;
      case 'payment.failed':
        // Payment failed at provider
        break;
      case 'order.paid':
        // Order fully settled
        break;
      default:
        break;
    }

    res.status(200).json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error processing webhook.' });
  }
};

/**
 * Returns public payment configuration (public key ID, currency, status)
 */
export const getPaymentConfig = async (req: Request, res: Response): Promise<void> => {
  const isConfigured = paymentService.isConfigured();
  res.status(200).json({
    success: true,
    isConfigured,
    keyId: isConfigured ? config.razorpay.keyId : (process.env.RAZORPAY_KEY_ID || 'mock_key_id'),
    currency: 'INR',
    minDonationAmount: 500,
  });
};

/**
 * Returns transaction list and aggregate statistics
 */
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    transactions: paymentService.getAllTransactions(),
    stats: paymentService.getStats(),
  });
};
