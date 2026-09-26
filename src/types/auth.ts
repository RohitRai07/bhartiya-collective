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
  expiresAt: string;
  user: AuthUser;
}

export interface AdminCredentials {
  email: string;
  password: string;
  name: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'email_otp' | 'authenticator_app';
  twoFactorSecret?: string;
}

export interface TwoFactorChallenge {
  challengeId: string;
  email: string;
  method: 'email_otp' | 'authenticator_app';
  code: string;
  expiresAt: number;
}

export interface OtpRequestInput {
  destination: string; // email or phone
  channel: 'email' | 'sms';
}

export interface OtpVerificationInput {
  destination: string;
  otpCode: string;
}
