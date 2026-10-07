import crypto from 'crypto';
import { config } from '../config/env';
import { generateSecureOtp, hashOtp, verifyOtpHash, maskEmail, maskPhone } from '../utils/crypto';

export type OtpChannel = 'email' | 'sms' | 'whatsapp';

export interface OtpChallenge {
  challengeId: string;
  userId: string;
  recipient: string;
  maskedRecipient: string;
  channel: OtpChannel;
  otpHashed: string;
  salt: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: number;
  resendAvailableAt: number;
  consumed: boolean;
  createdAt: number;
}

export interface CreateChallengeResult {
  challengeId: string;
  maskedRecipient: string;
  channel: OtpChannel;
  expiresAt: number;
  resendAvailableAt: number;
  otpLength: number;
  // Raw OTP returned ONLY for internal dispatch to notification services; never returned over HTTP API!
  rawOtp: string; 
}

export interface VerifyOtpResult {
  valid: boolean;
  userId?: string;
  channel?: OtpChannel;
  error?: string;
  expired?: boolean;
  locked?: boolean;
  remainingAttempts?: number;
}

export class OTPService {
  private challenges: Map<string, OtpChallenge> = new Map();
  // Track most recent active challenge per (userId + channel) for cooldown enforcement
  private userRecentChallenges: Map<string, string> = new Map();

  /**
   * Create and register a new OTP challenge
   */
  public createChallenge(
    userId: string,
    recipient: string,
    channel: OtpChannel = 'email'
  ): { success: true; data: CreateChallengeResult } | { success: false; error: string; secondsLeft?: number } {
    const userChannelKey = `${userId}:${channel}`;
    const existingChallengeId = this.userRecentChallenges.get(userChannelKey);

    // Enforce Resend Cooldown
    if (existingChallengeId) {
      const existing = this.challenges.get(existingChallengeId);
      if (existing && Date.now() < existing.resendAvailableAt) {
        const secondsLeft = Math.ceil((existing.resendAvailableAt - Date.now()) / 1000);
        return {
          success: false,
          error: `Resend cooldown active. Please wait ${secondsLeft} second(s) before requesting a new code.`,
          secondsLeft,
        };
      }
      if (existing) {
        // Invalidate previous challenge upon issuing a fresh challenge
        existing.consumed = true;
      }
    }

    const challengeId = `ch_${crypto.randomBytes(16).toString('hex')}`;
    const rawOtp = generateSecureOtp(config.otp.length);
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHashed = hashOtp(rawOtp, salt, config.security.otpSecret);

    const now = Date.now();
    const expiresAt = now + config.otp.expirySeconds * 1000;
    const resendAvailableAt = now + config.otp.resendCooldownSeconds * 1000;

    const maskedRecipient = channel === 'email' ? maskEmail(recipient) : maskPhone(recipient);

    const challenge: OtpChallenge = {
      challengeId,
      userId,
      recipient,
      maskedRecipient,
      channel,
      otpHashed,
      salt,
      attempts: 0,
      maxAttempts: config.otp.maxAttempts,
      expiresAt,
      resendAvailableAt,
      consumed: false,
      createdAt: now,
    };

    this.challenges.set(challengeId, challenge);
    this.userRecentChallenges.set(userChannelKey, challengeId);

    // Automatic garbage collection for expired challenge after 15 minutes
    setTimeout(() => {
      this.challenges.delete(challengeId);
      if (this.userRecentChallenges.get(userChannelKey) === challengeId) {
        this.userRecentChallenges.delete(userChannelKey);
      }
    }, 15 * 60 * 1000).unref?.();

    return {
      success: true,
      data: {
        challengeId,
        maskedRecipient,
        channel,
        expiresAt,
        resendAvailableAt,
        otpLength: config.otp.length,
        rawOtp, // Internal use only
      }
    };
  }

  /**
   * Verify an OTP challenge with timing-safe comparison, attempt tracking, and single-use enforcement
   */
  public verifyOtp(challengeId: string, inputOtp: string): VerifyOtpResult {
    const cleanOtp = (inputOtp || '').trim();
    const challenge = this.challenges.get(challengeId);

    if (!challenge) {
      return { valid: false, error: 'Verification session expired or not found. Please request a new code.' };
    }

    // Check maximum attempts or locked state first
    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.consumed = true;
      return { 
        valid: false, 
        error: 'Maximum verification attempts exceeded. For security, this code has been invalidated. Please request a new code.', 
        locked: true,
        remainingAttempts: 0
      };
    }

    if (challenge.consumed) {
      const isLocked = challenge.attempts >= challenge.maxAttempts;
      return { 
        valid: false, 
        error: isLocked
          ? 'Maximum verification attempts exceeded. For security, this code has been invalidated. Please request a new code.'
          : 'This verification code has already been used. Please request a new code.',
        locked: isLocked,
        remainingAttempts: 0
      };
    }

    // Check expiration
    if (Date.now() > challenge.expiresAt) {
      challenge.consumed = true;
      return { valid: false, error: 'Verification code has expired. Please request a new code.', expired: true };
    }

    challenge.attempts++;

    // Timing-safe verification against dynamically generated OTP hash
    const isDynamicMatch = verifyOtpHash(cleanOtp, challenge.otpHashed, challenge.salt, config.security.otpSecret);

    // Temporary development fallback: '111111'
    // ONLY allowed when real OTP provider is not configured.
    // Once real provider is configured, 111111 automatically ceases to function.
    const isProviderConfigured = this.isChannelProviderConfigured(challenge.channel);
    const isDevFallback = !isProviderConfigured && cleanOtp === '111111';

    const isMatch = isDynamicMatch || isDevFallback;

    if (!isMatch) {
      const remainingAttempts = challenge.maxAttempts - challenge.attempts;
      if (remainingAttempts <= 0) {
        challenge.consumed = true;
        return { 
          valid: false, 
          error: 'Maximum verification attempts exceeded. This code is now locked.', 
          locked: true,
          remainingAttempts: 0 
        };
      }
      return { 
        valid: false, 
        error: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`, 
        remainingAttempts 
      };
    }

    // Successful match -> Consume immediately (Single-use OTP)
    challenge.consumed = true;
    return {
      valid: true,
      userId: challenge.userId,
      channel: challenge.channel,
    };
  }

  /**
   * Check if real delivery provider for a specific channel is configured
   */
  public isChannelProviderConfigured(channel: 'email' | 'sms' | 'whatsapp'): boolean {
    if (channel === 'email') {
      return Boolean(config.email.host && config.email.user && config.email.pass);
    }
    if (channel === 'sms') {
      return Boolean(config.sms.apiKey && config.sms.apiUrl);
    }
    if (channel === 'whatsapp') {
      return Boolean(config.whatsapp.apiKey && config.whatsapp.phoneNumberId);
    }
    return false;
  }

  /**
   * Explicitly invalidate an existing challenge
   */
  public invalidateChallenge(challengeId: string): void {
    const ch = this.challenges.get(challengeId);
    if (ch) {
      ch.consumed = true;
    }
  }

  /**
   * Get challenge metadata without exposing secrets
   */
  public getChallenge(challengeId: string): Omit<OtpChallenge, 'otpHashed' | 'salt'> | null {
    const ch = this.challenges.get(challengeId);
    if (!ch) return null;
    const { otpHashed, salt, ...safe } = ch;
    return safe;
  }
}

export const otpService = new OTPService();
