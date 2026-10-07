import { config } from '../config/env';
import { otpService, OtpChannel, CreateChallengeResult, VerifyOtpResult } from './otp.service';
import { emailService } from './email.service';
import { smsService } from './sms.service';
import { whatsappService } from './whatsapp.service';

export interface TwoFactorInitiateResult {
  challengeId: string;
  maskedRecipient: string;
  channel: OtpChannel;
  expiresAt: number;
  resendAvailableAt: number;
  otpLength: number;
}

export class TwoFactorService {

  /**
   * Dispatches the 2FA code across the requested notification channel
   */
  private async dispatchCode(channel: OtpChannel, recipient: string, otp: string): Promise<boolean> {
    switch (channel) {
      case 'email':
        return await emailService.sendTwoFactorEmail(recipient, otp);
      case 'sms':
        return await smsService.sendTwoFactorSMS(recipient, otp);
      case 'whatsapp':
        return await whatsappService.sendTwoFactorWhatsApp(recipient, otp);
      default:
        return await emailService.sendTwoFactorEmail(recipient, otp);
    }
  }

  /**
   * Initiate 2FA verification challenge and dispatch OTP through the notification layer
   */
  public async initiateTwoFactor(
    userId: string,
    recipient: string,
    channel: OtpChannel = 'email'
  ): Promise<{ success: true; challenge: TwoFactorInitiateResult } | { success: false; error: string; secondsLeft?: number }> {
    // 1. Generate challenge through OTP Service
    const challengeResult = otpService.createChallenge(userId, recipient, channel);

    if (!challengeResult.success) {
      return challengeResult;
    }

    const { rawOtp, ...safeMetadata } = challengeResult.data;

    // 2. Dispatch OTP via Notification Integration Layer
    try {
      await this.dispatchCode(channel, recipient, rawOtp);
    } catch (err) {
      console.error(`Failed to dispatch 2FA OTP via ${channel}:`, err);
    }

    return {
      success: true,
      challenge: safeMetadata,
    };
  }

  /**
   * Verify candidate 2FA OTP
   */
  public verifyTwoFactor(challengeId: string, otp: string): VerifyOtpResult {
    return otpService.verifyOtp(challengeId, otp);
  }

  /**
   * Resend 2FA verification code
   */
  public async resendTwoFactor(
    userId: string,
    recipient: string,
    channel: OtpChannel = 'email'
  ): Promise<{ success: true; challenge: TwoFactorInitiateResult } | { success: false; error: string; secondsLeft?: number }> {
    return this.initiateTwoFactor(userId, recipient, channel);
  }
}

export const twoFactorService = new TwoFactorService();
