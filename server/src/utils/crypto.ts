import crypto from 'crypto';

/**
 * Production Cryptographic Utilities
 * Uses Node.js native crypto module for constant-time comparisons,
 * secure random generation, and PBKDF2 password hashing.
 */

/**
 * Generate a cryptographically secure numeric OTP of given length
 */
export function generateSecureOtp(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const num = crypto.randomInt(min, max + 1);
  return num.toString().padStart(length, '0');
}

/**
 * Hash a password using PBKDF2 (SHA-512, 100,000 iterations)
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

/**
 * Verify a password using timing-safe comparison
 */
export function verifyPassword(password: string, expectedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const a = Buffer.from(computedHash, 'hex');
    const b = Buffer.from(expectedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Hash an OTP with a salt and secret
 */
export function hashOtp(otp: string, salt: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${otp}:${salt}`).digest('hex');
}

/**
 * Verify an OTP using timing-safe comparison
 */
export function verifyOtpHash(otp: string, expectedHash: string, salt: string, secret: string): boolean {
  try {
    const computed = hashOtp(otp, salt, secret);
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(expectedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Create an HMAC-SHA256 signed JWT token
 */
export function signJwtToken(payload: Record<string, any>, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  
  const headerPart = encode(header);
  const payloadPart = encode(payload);
  const message = `${headerPart}.${payloadPart}`;
  
  const signature = crypto.createHmac('sha256', secret).update(message).digest('base64url');
  return `${message}.${signature}`;
}

/**
 * Verify an HMAC-SHA256 signed JWT token
 */
export function verifyJwtToken<T = any>(token: string, secret: string): { valid: boolean; payload?: T; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed token structure' };
    }
    const [headerPart, payloadPart, signaturePart] = parts;
    const message = `${headerPart}.${payloadPart}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(message).digest('base64url');
    
    const sigA = Buffer.from(signaturePart);
    const sigB = Buffer.from(expectedSig);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8')) as T & { exp?: number };
    
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Token verification failed' };
  }
}

/**
 * Mask an email address: e.g. "admin@bharatcollective.org" -> "a***n@bharatcollective.org"
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '******';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

/**
 * Mask a phone number: e.g. "+91 80768 02450" -> "+91 ******2450"
 */
export function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.length <= 4) return '******';
  const prefix = clean.startsWith('+91') ? '+91 ' : '';
  const last4 = clean.slice(-4);
  return `${prefix}******${last4}`;
}
