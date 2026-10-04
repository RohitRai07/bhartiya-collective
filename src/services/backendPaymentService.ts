import { apiClient } from './apiClient';

export interface OrderOptions {
  amount: number;
  receiptId?: string;
  notes?: Record<string, string>;
}

export class BackendPaymentService {
  /**
   * Request Razorpay Order ID from backend
   */
  public async createOrder(options: OrderOptions) {
    const response = await apiClient.post<any>('/payment/create-order', options);
    if (!response.success || !response.data) {
      throw new Error('Failed to create payment order');
    }
    return response.data;
  }

  /**
   * Verify Razorpay payment signature
   */
  public async verifyPayment(razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) {
    const response = await apiClient.post<any>('/payment/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });
    
    if (!response.success || !response.data?.success) {
      throw new Error(response.message || 'Payment verification failed');
    }
    return true;
  }
}

export const backendPaymentService = new BackendPaymentService();
