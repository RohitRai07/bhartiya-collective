import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config/env';

export interface OrderOptions {
  amount: number; // in INR (not paise, we convert it here)
  receiptId: string;
  notes?: Record<string, string>;
}

export class PaymentService {
  private razorpay: Razorpay | null = null;

  constructor() {
    // ============================================
    // RAZORPAY CONFIGURATION
    // Initialize Razorpay SDK if keys are present
    // ============================================
    if (config.razorpay.keyId && config.razorpay.keySecret) {
      this.razorpay = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
      });
    } else {
      console.warn('Razorpay config missing. Payment service running in mock mode.');
    }
  }

  /**
   * Creates an order ID from Razorpay backend.
   */
  public async createOrder(options: OrderOptions) {
    if (!this.razorpay) {
      // Return a mock order for development when keys aren't set
      return {
        id: `order_mock_${Date.now()}`,
        amount: options.amount * 100,
        currency: 'INR',
        receipt: options.receiptId,
        status: 'created',
      };
    }

    try {
      const order = await this.razorpay.orders.create({
        amount: options.amount * 100, // Razorpay requires amount in paise
        currency: 'INR',
        receipt: options.receiptId,
        notes: options.notes,
      });
      return order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verifies the signature of the Razorpay successful payment callback
   */
  public verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!config.razorpay.keySecret) return true; // mock mode

    const generatedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    return generatedSignature === signature;
  }

  /**
   * Verifies the webhook signature triggered by Razorpay backend
   */
  public verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!config.razorpay.webhookSecret) return true; // mock mode

    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }
}

export const paymentService = new PaymentService();
