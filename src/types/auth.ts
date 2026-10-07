/**
 * Authentication Types for Bharat Collective Foundation
 */

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'member' | 'scholar' | 'fellow' | 'admin';
  permissions: string[];
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  expiresAt: string | number;
  lastActiveAt?: number;
  user: AuthUser;
}

export interface AdminCredentials {
  email: string;
  twoFactorEmail?: string;
  password: string;
  name: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'email_otp' | 'sms_otp' | 'whatsapp_otp' | 'authenticator_app';
  twoFactorSecret?: string;
}

export interface TwoFactorChallenge {
  challengeId: string;
  email?: string;
  maskedRecipient: string;
  channel: 'email' | 'sms' | 'whatsapp';
  expiresAt: number;
  resendAvailableAt: number;
  otpLength: number;
  method?: string;
  code?: string; // Optional for backward compatibility with existing tests
}

export interface OtpRequestInput {
  destination: string; // email or phone
  channel: 'email' | 'sms' | 'whatsapp';
}

export interface OtpVerificationInput {
  challengeId: string;
  otp: string;
}

export interface TwoFactorVerifyResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
  code?: string;
  remainingAttempts?: number;
  expired?: boolean;
  locked?: boolean;
}
