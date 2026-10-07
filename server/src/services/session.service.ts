import crypto from 'crypto';
import { config } from '../config/env';
import { signJwtToken, verifyJwtToken } from '../utils/crypto';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  permissions: string[];
}

export interface SessionPayload {
  sessionId: string;
  userId: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  permissions: string[];
  twoFactorVerified: boolean;
  iat: number;
  exp: number;
}

export interface ActiveSession {
  sessionId: string;
  userId: string;
  email: string;
  twoFactorVerified: boolean;
  createdAt: number;
  lastActivity: number;
  revoked: boolean;
  ip?: string;
  userAgent?: string;
}

export class SessionService {
  private activeSessions: Map<string, ActiveSession> = new Map();

  /**
   * Create a new secure session token
   */
  public createSession(
    user: SessionUser, 
    twoFactorVerified: boolean = false,
    metadata?: { ip?: string; userAgent?: string }
  ): { token: string; expiresAt: string; sessionId: string; user: SessionUser } {
    const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + config.security.sessionExpirySeconds;

    const payload: SessionPayload = {
      sessionId,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions,
      twoFactorVerified,
      iat: now,
      exp,
    };

    const token = signJwtToken(payload, config.security.sessionSecret);

    // Track in active registry
    this.activeSessions.set(sessionId, {
      sessionId,
      userId: user.id,
      email: user.email,
      twoFactorVerified,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      revoked: false,
      ip: metadata?.ip,
      userAgent: metadata?.userAgent,
    });

    return {
      token,
      expiresAt: new Date(exp * 1000).toISOString(),
      sessionId,
      user,
    };
  }

  /**
   * Verify and validate session token with idle timeout & revocation checks
   */
  public verifySessionToken(token: string): { 
    valid: boolean; 
    payload?: SessionPayload; 
    error?: string; 
    code?: 'INVALID' | 'EXPIRED' | 'REVOKED' | 'IDLE_TIMEOUT' | '2FA_REQUIRED' 
  } {
    const verification = verifyJwtToken<SessionPayload>(token, config.security.sessionSecret);
    if (!verification.valid || !verification.payload) {
      return { 
        valid: false, 
        error: verification.error || 'Invalid session token', 
        code: verification.error === 'Token expired' ? 'EXPIRED' : 'INVALID' 
      };
    }

    const payload = verification.payload;
    const session = this.activeSessions.get(payload.sessionId);

    // Check revocation
    if (!session || session.revoked) {
      return { valid: false, error: 'Session has been revoked or expired. Please sign in again.', code: 'REVOKED' };
    }

    // Check idle timeout
    const idleLimitMs = config.security.idleTimeoutSeconds * 1000;
    if (Date.now() - session.lastActivity > idleLimitMs) {
      session.revoked = true;
      return { valid: false, error: 'Session timed out due to inactivity.', code: 'IDLE_TIMEOUT' };
    }

    // Update last activity timestamp
    session.lastActivity = Date.now();

    return { valid: true, payload };
  }

  /**
   * Revoke an active session (Logout)
   */
  public revokeSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.revoked = true;
      this.activeSessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Revoke all sessions for a user (e.g. on password change)
   */
  public revokeAllUserSessions(userId: string): void {
    for (const [id, s] of this.activeSessions.entries()) {
      if (s.userId === userId) {
        s.revoked = true;
        this.activeSessions.delete(id);
      }
    }
  }

  /**
   * Upgrade session to 2FA verified
   */
  public upgradeSessionTo2FA(
    oldSessionId: string, 
    user: SessionUser, 
    metadata?: { ip?: string; userAgent?: string }
  ): { token: string; expiresAt: string; sessionId: string; user: SessionUser } {
    // Invalidate old pre-2FA session
    this.revokeSession(oldSessionId);
    // Create fresh authenticated session with twoFactorVerified = true
    return this.createSession(user, true, metadata);
  }
}

export const sessionService = new SessionService();
