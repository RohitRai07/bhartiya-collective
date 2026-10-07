import { Request, Response } from 'express';
import { config } from '../config/env';
import { verifyPassword } from '../utils/crypto';
import { twoFactorService } from '../services/twoFactor.service';
import { sessionService, SessionUser } from '../services/session.service';
import { otpService } from '../services/otp.service';

export class AuthController {

  /**
   * Step 1: Admin Login with Credentials
   * Validates email & password, then issues a 2FA challenge
   */
  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();
    const allowedAdminLogins = [
      config.admin.email.toLowerCase(),
      config.admin.twoFactorEmail.toLowerCase(),
      'rohitraicr10@gmail.com',
      'rohiraicr10@gmail.com'
    ];

    const isAdminEmail = allowedAdminLogins.includes(normalizedEmail);
    const isPasswordValid = isAdminEmail && verifyPassword(
      password, 
      config.admin.passwordHash, 
      config.admin.passwordSalt
    );

    if (!isAdminEmail || !isPasswordValid) {
      res.status(401).json({
        error: 'Invalid administrator email or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Determine target 2FA verification email
    let target2FAEmail = config.admin.twoFactorEmail;
    if (normalizedEmail === 'rohiraicr10@gmail.com') {
      target2FAEmail = 'rohiraicr10@gmail.com';
    } else if (normalizedEmail === 'rohitraicr10@gmail.com') {
      target2FAEmail = 'rohitraicr10@gmail.com';
    }

    // Credentials verified -> Initiate Two-Factor Authentication
    const twoFactorResult = await twoFactorService.initiateTwoFactor(
      config.admin.id,
      target2FAEmail,
      'email'
    );

    if (!twoFactorResult.success) {
      res.status(429).json({
        error: twoFactorResult.error,
        code: 'COOLDOWN_ACTIVE',
        secondsLeft: twoFactorResult.secondsLeft,
      });
      return;
    }

    res.status(200).json({
      success: true,
      requiresTwoFactor: true,
      challenge: twoFactorResult.challenge,
    });
  }

  /**
   * Step 2: Verify 2FA OTP Code
   * Completes authentication and issues production session token
   */
  public async verifyTwoFactor(req: Request, res: Response): Promise<void> {
    const { challengeId, otp } = req.body;

    const result = twoFactorService.verifyTwoFactor(challengeId, otp);

    if (!result.valid) {
      const statusCode = result.locked ? 429 : 401;
      res.status(statusCode).json({
        error: result.error || 'Invalid verification code.',
        code: result.locked ? 'OTP_LOCKED' : (result.expired ? 'OTP_EXPIRED' : 'INVALID_OTP'),
        remainingAttempts: result.remainingAttempts,
      });
      return;
    }

    // Successfully verified -> Create production session with twoFactorVerified = true
    const user: SessionUser = {
      id: config.admin.id,
      email: config.admin.email,
      fullName: config.admin.name,
      role: 'admin',
      permissions: ['all', 'read:all', 'write:all', 'admin:portal'],
    };

    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress) || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    const session = sessionService.createSession(user, true, {
      ip: clientIp,
      userAgent,
    });

    res.status(200).json({
      success: true,
      session,
    });
  }

  /**
   * Resend 2FA verification code
   */
  public async resendOtp(req: Request, res: Response): Promise<void> {
    const { challengeId } = req.body;

    let recipient = config.admin.twoFactorEmail || config.admin.email;
    let channel: any = 'email';

    if (challengeId) {
      const existing = otpService.getChallenge(challengeId);
      if (existing) {
        recipient = existing.recipient;
        channel = existing.channel;
      }
    }

    const result = await twoFactorService.resendTwoFactor(
      config.admin.id,
      recipient,
      channel
    );

    if (!result.success) {
      res.status(429).json({
        error: result.error,
        code: 'COOLDOWN_ACTIVE',
        secondsLeft: result.secondsLeft,
      });
      return;
    }

    res.status(200).json({
      success: true,
      challenge: result.challenge,
    });
  }

  /**
   * Validate and inspect current active session
   */
  public async getSession(req: Request, res: Response): Promise<void> {
    // Reached here via authenticateAdmin middleware -> guarantees valid 2FA and admin role
    res.status(200).json({
      success: true,
      authenticated: true,
      user: req.user,
    });
  }

  /**
   * Terminate and revoke active session
   */
  public async logout(req: Request, res: Response): Promise<void> {
    if (req.sessionId) {
      sessionService.revokeSession(req.sessionId);
    }

    res.status(200).json({
      success: true,
      message: 'Administrative session successfully revoked.',
    });
  }
}

export const authController = new AuthController();
