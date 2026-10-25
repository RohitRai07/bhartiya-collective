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

export const MIN_DONATION_AMOUNT = 500;
export const SUGGESTED_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

export function validateDonationAmount(rawAmount: string | number): { isValid: boolean; error?: string; amount?: number } {
  const str = typeof rawAmount === 'number' ? rawAmount.toString() : (rawAmount || '').trim();
  if (!str) {
    return { isValid: false, error: 'Minimum donation amount is ₹500.' };
  }
  const parsed = parseFloat(str);
  if (isNaN(parsed) || parsed < MIN_DONATION_AMOUNT) {
    return { isValid: false, error: 'Minimum donation amount is ₹500.' };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    return { isValid: false, error: 'Contribution amount can have at most two decimal places and must be positive.' };
  }
  return { isValid: true, amount: parsed };
}

export function validateDonationPhone(phone: string): { isValid: boolean; error?: string; cleanPhone?: string } {
  const raw = (phone || '').trim();
  const digitsOnly = raw.replace(/\D/g, '');
  if (!digitsOnly) {
    return { isValid: false, error: 'Please enter your mobile number.' };
  }
  let nationalNumber = digitsOnly;
  if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
    nationalNumber = digitsOnly.slice(2);
  } else if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
    nationalNumber = digitsOnly.slice(1);
  }
  if (nationalNumber.length !== 10 || !/^[6-9]\d{9}$/.test(nationalNumber)) {
    return { isValid: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }
  return { isValid: true, cleanPhone: `+91 ${nationalNumber}` };
}

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
  validateDonationAmount,
  validateDonationPhone,
  MIN_DONATION_AMOUNT,
  SUGGESTED_AMOUNTS,
  
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
