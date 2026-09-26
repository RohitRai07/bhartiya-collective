/**
 * Authentication Service for Bharat Collective Foundation
 * 
 * Manages Admin Authentication, persistent credential updates,
 * Two-Factor Authentication (2FA) verification, and session storage.
 */

import { apiConfig } from '../config/apiConfig';
import { featureConfig } from '../config/featureConfig';
import { apiClient } from './apiClient';
import { 
  AuthSession, 
  AuthUser, 
  AdminCredentials, 
  TwoFactorChallenge,
  OtpRequestInput, 
  OtpVerificationInput 
} from '../types/auth';

const CREDS_STORAGE_KEY = 'bharat_collective_admin_creds';
const SESSION_STORAGE_KEY = 'bharat_collective_admin_session';

export const DEFAULT_ADMIN_CREDS: AdminCredentials = {
  email: 'admin@bharatcollective.org',
  password: 'BharatAdmin@2026',
  name: 'Chief Administrator (Bharat Collective)',
  twoFactorEnabled: true, // 2FA active by default as requested
  twoFactorMethod: 'email_otp',
  twoFactorSecret: 'BHARAT-2FA-SEC-2026',
};

// Backward compatibility alias
export const DUMMY_ADMIN_CREDS = {
  email: DEFAULT_ADMIN_CREDS.email,
  password: DEFAULT_ADMIN_CREDS.password,
  role: 'admin' as const,
  name: DEFAULT_ADMIN_CREDS.name,
};

let activeChallenges: Record<string, TwoFactorChallenge> = {};
let inMemoryCredentials: AdminCredentials = { ...DEFAULT_ADMIN_CREDS };

function loadStoredCredentials(): AdminCredentials {
  if (typeof window === 'undefined') return inMemoryCredentials;
  try {
    const raw = localStorage.getItem(CREDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_CREDS));
      return DEFAULT_ADMIN_CREDS;
    }
    return JSON.parse(raw);
  } catch {
    return inMemoryCredentials;
  }
}

function saveStoredCredentials(creds: AdminCredentials) {
  inMemoryCredentials = { ...creds };
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(creds));
  } catch (e) {
    console.error('Failed to save admin credentials:', e);
  }
}

export const authService = {
  /**
   * Get current admin credentials
   */
  getAdminCredentials(): AdminCredentials {
    return loadStoredCredentials();
  },

  /**
   * Update admin credentials (email, password, 2FA settings)
   */
  updateAdminCredentials(
    updates: Partial<AdminCredentials>,
    currentPassword?: string
  ): { success: boolean; message: string; credentials?: AdminCredentials } {
    const current = loadStoredCredentials();

    // If changing password or email, verify current password
    if ((updates.password || updates.email) && currentPassword) {
      if (currentPassword !== current.password) {
        return { success: false, message: 'Current password does not match.' };
      }
    }

    const updated: AdminCredentials = {
      ...current,
      ...updates,
      email: (updates.email || current.email).trim().toLowerCase(),
    };

    saveStoredCredentials(updated);

    // Also update active session if email or name changed
    const session = this.getAdminSession();
    if (session && typeof window !== 'undefined') {
      session.user.email = updated.email;
      session.user.fullName = updated.name;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    return {
      success: true,
      message: 'Admin credentials and security settings updated successfully.',
      credentials: updated,
    };
  },

  /**
   * Get active admin session if present
   */
  getAdminSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;
      const session = JSON.parse(stored) as AuthSession;
      if (session?.token) {
        apiClient.setAuthToken(session.token);
      }
      return session;
    } catch {
      return null;
    }
  },

  /**
   * Check if current user has an active admin session
   */
  isAdminAuthenticated(): boolean {
    const session = this.getAdminSession();
    return !!session && session.user?.role === 'admin';
  },

  /**
   * Initiate 2FA verification challenge
   */
  createTwoFactorChallenge(email: string): TwoFactorChallenge {
    const creds = loadStoredCredentials();
    const challengeId = `2fa-${Date.now()}`;
    // Generate a random 6-digit OTP code e.g. 582914
    const code = String(Math.floor(100000 + Math.random() * 900000));
    
    const challenge: TwoFactorChallenge = {
      challengeId,
      email,
      method: creds.twoFactorMethod || 'email_otp',
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
    };

    activeChallenges[challengeId] = challenge;
    return challenge;
  },

  /**
   * Step 1: Login verification
   */
  async loginAdmin(emailInput: string, passwordInput: string): Promise<{ 
    success: boolean; 
    session?: AuthSession; 
    requiresTwoFactor?: boolean;
    challenge?: TwoFactorChallenge;
    error?: string 
  }> {
    const email = (emailInput || '').trim().toLowerCase();
    const password = (passwordInput || '').trim();

    // 1. Check if backend API authentication is enabled
    if (!apiConfig.useMockData && featureConfig.isEnabled('authentication')) {
      try {
        const response = await apiClient.post<AuthSession>(apiConfig.endpoints.auth.login, {
          email,
          password,
        });
        const session = response.data;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        apiClient.setAuthToken(session.token);
        return { success: true, session };
      } catch (err: any) {
        return { success: false, error: err.message || 'Invalid administrative credentials.' };
      }
    }

    // 2. Local verification against stored credentials
    await new Promise(resolve => setTimeout(resolve, 250));
    const creds = loadStoredCredentials();

    if (email === creds.email && password === creds.password) {
      // If Two-Factor Authentication is enabled, issue challenge
      if (creds.twoFactorEnabled) {
        const challenge = this.createTwoFactorChallenge(email);
        return {
          success: true,
          requiresTwoFactor: true,
          challenge,
        };
      }

      // If 2FA disabled, directly issue session
      const user: AuthUser = {
        id: 'admin-001',
        email: creds.email,
        fullName: creds.name,
        role: 'admin',
        permissions: ['read:registrations', 'write:registrations', 'export:csv', 'read:submissions', 'read:newsletter', 'admin:content'],
      };

      const session: AuthSession = {
        token: `bcf-jwt-token-${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        user,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
      apiClient.setAuthToken(session.token);

      return { success: true, session };
    }

    return {
      success: false,
      error: 'Invalid credentials. Please verify your administrator email and password.',
    };
  },

  /**
   * Step 2: Two-Factor Authentication code verification
   */
  async completeTwoFactorLogin(challengeId: string, codeInput: string): Promise<{
    success: boolean;
    session?: AuthSession;
    error?: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 250));
    const challenge = activeChallenges[challengeId];

    const cleanCode = (codeInput || '').trim().replace(/\D/g, '');

    // Allow the generated code or universal development demo bypass (123456)
    const isValid = (challenge && challenge.code === cleanCode && challenge.expiresAt > Date.now()) || cleanCode === '123456';

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid or expired 2FA verification code. Please check your code or request a new one.',
      };
    }

    const creds = loadStoredCredentials();
    const user: AuthUser = {
      id: 'admin-001',
      email: creds.email,
      fullName: creds.name,
      role: 'admin',
      permissions: ['read:registrations', 'write:registrations', 'export:csv', 'read:submissions', 'read:newsletter', 'admin:content'],
    };

    const session: AuthSession = {
      token: `bcf-jwt-token-${Date.now()}`,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      user,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
    apiClient.setAuthToken(session.token);

    // Clean up used challenge
    delete activeChallenges[challengeId];

    return { success: true, session };
  },

  /**
   * Terminate active admin session
   */
  logoutAdmin(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    apiClient.setAuthToken(null);
  },

  /**
   * OTP Request integration point
   */
  async requestOtp(input: OtpRequestInput): Promise<{ success: boolean; message: string }> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.post<{ message: string }>(apiConfig.endpoints.auth.requestOtp, input);
      return { success: true, message: response.message || 'OTP sent.' };
    }
    return { success: true, message: 'OTP sent to destination (Demo mode).' };
  },

  /**
   * OTP Verification integration point
   */
  async verifyOtp(input: OtpVerificationInput): Promise<AuthSession> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.post<AuthSession>(apiConfig.endpoints.auth.verifyOtp, input);
      return response.data;
    }
    throw new Error('OTP verification is prepared for Phase 4.');
  }
};
