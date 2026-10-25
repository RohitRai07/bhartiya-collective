/**
 * Donation & Patronage Data Models
 * 
 * Future-Ready Architecture:
 * - Clean service boundary
 * - NO fake payment processing
 * - Prepares metadata and donor intent cleanly for payment gateway
 */

export type DonationFrequency = 'one_time' | 'monthly' | 'annually';

export type DonationCause = 
  | 'general_research'
  | 'visiting_fellowships'
  | 'indic_monographs'
  | 'national_symposium'
  | 'youth_scholar_grants';

export interface DonationData {
  amount: number;
  frequency: DonationFrequency;
  cause: DonationCause;
  donorName: string;
  email: string;
  phone?: string;
  panNumber?: string; // Required for 80G Indian tax exemption receipt
  isIndianTaxResident: boolean;
  address?: string;
  notes?: string;
}

export interface DonationIntentResponse {
  donationId: string;
  amount: number;
  currency: 'INR';
  cause: DonationCause;
  status: 'prepared_for_payment_gateway' | 'completed' | 'failed' | 'cancelled';
  message: string;
  createdAt: string;
  paymentGatewayPayload?: {
    gateway: string;
    orderId?: string;
    checkoutUrl?: string;
    keyId?: string;
    amount?: number;
    currency?: string;
    isMock?: boolean;
  };
  paymentDetails?: {
    paymentId: string;
    orderId: string;
    signature?: string;
    verified: boolean;
  };
}
