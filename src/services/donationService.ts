/**
 * Donation Service
 * 
 * Clean service boundary for future payment gateway integration.
 * 
 * Architectural Guarantees:
 * 1. NO fake payment processing or fake gateway transactions.
 * 2. Prepares donor intent and returns a prepared donation record.
 * 3. In Phase 5, the real payment gateway (Razorpay, Cashfree, Stripe, UPI)
 *    is integrated entirely within this service without rewriting the Support Us UI.
 */

import { apiConfig } from '../config/apiConfig';
import { featureConfig } from '../config/featureConfig';
import { apiClient } from './apiClient';
import { DonationData, DonationIntentResponse } from '../types/donation';

/**
 * Donation functionality is currently prepared for future
 * payment integration. The actual payment provider can
 * be connected here later without changing the Donation UI.
 */
export async function createDonation(donationData: DonationData): Promise<DonationIntentResponse> {
  // Check if live payment integration feature flag is active
  const isLivePaymentEnabled = featureConfig.isEnabled('paymentIntegration');

  if (isLivePaymentEnabled && !apiConfig.useMockData) {
    // Future API integration point:
    // Calls backend to generate gateway order ID, checkout token, or UPI intent
    const response = await apiClient.post<DonationIntentResponse>(
      apiConfig.endpoints.donations.create,
      donationData
    );
    return response.data;
  }

  // Phase 1: Pure service boundary without fake gateway processing
  // Simulates asynchronous order registration & intent preparation
  await new Promise(resolve => setTimeout(resolve, 300));

  const donationId = `DON-INTENT-${Date.now()}`;

  return {
    donationId,
    amount: donationData.amount,
    currency: 'INR',
    cause: donationData.cause,
    status: 'prepared_for_payment_gateway',
    message: 'Your donation intent has been registered. Payment gateway integration will be activated in Phase 5.',
    createdAt: new Date().toISOString(),
  };
}

export const donationService = {
  createDonation,
  
  /**
   * Future Phase 5 receipt verification endpoint
   */
  async verifyPayment(paymentSignature: string, orderId: string): Promise<boolean> {
    if (!featureConfig.isEnabled('paymentIntegration')) {
      return false;
    }
    const response = await apiClient.post<{ verified: boolean }>(
      apiConfig.endpoints.donations.verify,
      { paymentSignature, orderId }
    );
    return !!response.data.verified;
  }
};
