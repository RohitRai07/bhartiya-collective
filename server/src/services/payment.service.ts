import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config/env';

export interface OrderOptions {
  amount: number; // in INR (converted to paise inside service)
  receiptId: string;
  notes?: Record<string, string>;
  purpose?: string;
}

export interface PaymentTransaction {
  id: string; // razorpay_payment_id e.g. pay_XXXXX
  orderId: string;
  amount: number; // in INR
  amountPaise: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded';
  purpose: string;
  donorName?: string;
  email?: string;
  phone?: string;
  panNumber?: string;
  cause?: string;
  frequency?: string;
  receiptId?: string;
  signature?: string;
  verifiedAt: string;
  notes?: Record<string, string>;
}

export class PaymentService {
  private razorpay: Razorpay | null = null;
  private transactions: Map<string, PaymentTransaction> = new Map();
  private orders: Map<string, any> = new Map();

  constructor() {
    this.initRazorpay();
  }

  private initRazorpay(): void {
    if (config.razorpay.keyId && config.razorpay.keySecret) {
      try {
        this.razorpay = new Razorpay({
          key_id: config.razorpay.keyId,
          key_secret: config.razorpay.keySecret,
        });
        console.log('✓ Razorpay SDK initialized successfully with server credentials.');
      } catch (err) {
        console.error('Failed to initialize Razorpay SDK:', err);
        this.razorpay = null;
      }
    } else {
      console.warn('Razorpay credentials not configured. Payment service operating in development/test fallback mode.');
    }
  }

  /**
   * Check whether live or test Razorpay API credentials are configured
   */
  public isConfigured(): boolean {
    return !!(config.razorpay.keyId && config.razorpay.keySecret);
  }

  /**
   * Creates an order ID from Razorpay backend.
   * Converts amount into paise (smallest currency unit) without rounding errors.
   */
  public async createOrder(options: OrderOptions) {
    const amountInPaise = Math.round(options.amount * 100);

    if (!this.razorpay) {
      // Mock / test fallback order for testing and development
      const mockOrder = {
        id: `order_mock_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: options.receiptId,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000),
        notes: options.notes,
      };
      this.orders.set(mockOrder.id, mockOrder);
      return mockOrder;
    }

    try {
      const order = await this.razorpay.orders.create({
        amount: amountInPaise, // in paise
        currency: 'INR',
        receipt: options.receiptId,
        notes: options.notes,
      });

      this.orders.set(order.id, order);
      return order;
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      throw new Error(error.error?.description || error.message || 'Failed to create payment order on Razorpay');
    }
  }

  /**
   * Cryptographically verifies the HMAC-SHA256 signature of the payment callback
   */
  public verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!config.razorpay.keySecret) {
      // Mock mode: accept mock signatures for testing without credentials
      return signature === 'mock_signature' || orderId.startsWith('order_mock_');
    }

    try {
      const generatedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const a = Buffer.from(generatedSignature, 'utf8');
      const b = Buffer.from(signature, 'utf8');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch (err) {
      console.error('Signature verification error:', err);
      return false;
    }
  }

  /**
   * Cryptographically verifies the webhook signature triggered by Razorpay backend
   */
  public verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!config.razorpay.webhookSecret) {
      return true; // Webhook secret not configured in dev
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.webhookSecret)
        .update(payload)
        .digest('hex');

      const a = Buffer.from(expectedSignature, 'utf8');
      const b = Buffer.from(signature, 'utf8');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  /**
   * Records a verified payment transaction
   */
  public recordTransaction(data: Omit<PaymentTransaction, 'amountPaise'>): PaymentTransaction {
    const transaction: PaymentTransaction = {
      ...data,
      amountPaise: Math.round(data.amount * 100),
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  /**
   * Retrieve a transaction by Razorpay payment ID
   */
  public getTransaction(paymentId: string): PaymentTransaction | undefined {
    return this.transactions.get(paymentId);
  }

  /**
   * Retrieve all recorded transactions
   */
  public getAllTransactions(): PaymentTransaction[] {
    return Array.from(this.transactions.values()).reverse();
  }

  /**
   * Retrieve transaction metrics
   */
  public getStats() {
    const all = Array.from(this.transactions.values());
    const totalAmount = all.reduce((sum, t) => sum + (t.status === 'captured' ? t.amount : 0), 0);
    return {
      totalCount: all.length,
      totalAmount,
      successfulCount: all.filter(t => t.status === 'captured').length,
    };
  }
}

export const paymentService = new PaymentService();
