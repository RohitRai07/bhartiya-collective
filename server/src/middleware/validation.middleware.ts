import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

/**
 * Validate Admin Login Request Body
 */
export function validateLoginInput(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'Administrator email is required.', code: 'INVALID_INPUT' });
    return;
  }

  // Standard robust email validation
  const emailValidation = validateEmailAddress(email);
  if (!emailValidation.isValid) {
    res.status(400).json({ error: emailValidation.error || 'Please enter a valid email address.', code: 'INVALID_INPUT' });
    return;
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    res.status(400).json({ error: 'Password is required.', code: 'INVALID_INPUT' });
    return;
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validate 2FA Verification Request Body
 */
export function validateOtpInput(req: Request, res: Response, next: NextFunction): void {
  const { challengeId, otp } = req.body || {};

  if (!challengeId || typeof challengeId !== 'string' || !challengeId.trim()) {
    res.status(400).json({ error: '2FA challenge ID is required.', code: 'INVALID_INPUT' });
    return;
  }

  if (!otp || typeof otp !== 'string' || !otp.trim()) {
    res.status(400).json({ error: 'Verification code is required.', code: 'INVALID_INPUT' });
    return;
  }

  const cleanOtp = otp.trim().replace(/\s+/g, '');
  const expectedLength = config.otp.length;

  if (cleanOtp.length !== expectedLength || !/^\d+$/.test(cleanOtp)) {
    res.status(400).json({ 
      error: `Verification code must be exactly ${expectedLength} digits.`, 
      code: 'INVALID_OTP_FORMAT' 
    });
    return;
  }

  req.body.challengeId = challengeId.trim();
  req.body.otp = cleanOtp;
  next();
}

/**
 * File Upload Metadata Security Validation
 */
export function validateFileUpload(req: Request, res: Response, next: NextFunction): void {
  const { fileName, mimeType, fileSize, dataUrl } = req.body || {};

  if (!fileName || typeof fileName !== 'string') {
    res.status(400).json({ error: 'File name is required.', code: 'INVALID_FILE' });
    return;
  }

  // Path traversal check
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    res.status(400).json({ error: 'Invalid file name. Path traversal detected.', code: 'MALICIOUS_INPUT' });
    return;
  }

  // Allowed extensions & mime types
  const allowedMimes: Record<string, string[]> = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  };

  const ext = ('.' + fileName.split('.').pop()?.toLowerCase()) || '';
  const declaredMime = (mimeType || '').toLowerCase();

  // Block executable extensions
  const forbiddenExts = ['.exe', '.bat', '.sh', '.php', '.phtml', '.js', '.ts', '.html', '.svg', '.py', '.rb'];
  if (forbiddenExts.includes(ext)) {
    res.status(400).json({ error: 'Disallowed file extension.', code: 'FORBIDDEN_FILE_TYPE' });
    return;
  }

  if (!allowedMimes[declaredMime] || !allowedMimes[declaredMime].includes(ext)) {
    res.status(400).json({ 
      error: 'Invalid file format. Only PDF documents and standard image formats (JPEG, PNG, WebP) are permitted.', 
      code: 'UNSUPPORTED_MEDIA_TYPE' 
    });
    return;
  }

  // Max 5 MB limit for uploads
  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
  if (fileSize && typeof fileSize === 'number' && fileSize > MAX_UPLOAD_BYTES) {
    res.status(400).json({ error: 'File size exceeds maximum permitted limit (5 MB).', code: 'FILE_TOO_LARGE' });
    return;
  }

  next();
}

export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'yopmail.com',
  'trashmail.com',
  'dispostable.com',
  'throwawaymail.com',
  'sharklasers.com',
  'fakeinbox.com',
  'getairmail.com',
  'mohmal.com',
  'mytemp.email',
  'tempail.com',
  'burnermail.io',
]);

/**
 * Server-Side Robust Email Address Validation
 */
export function validateEmailAddress(rawInput: string): { isValid: boolean; error?: string; formatted: string } {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Please enter a valid email address.', formatted: '' };
  }

  if (/\s/.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.', formatted: trimmed };
  }

  // Strict rule: email must only contain alphanumeric characters, '.' and '@' (no other special characters)
  if (/[^a-zA-Z0-9.@]/.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.', formatted: trimmed };
  }

  const atParts = trimmed.split('@');
  if (atParts.length !== 2) {
    return { isValid: false, error: 'Please enter a valid email address.', formatted: trimmed };
  }

  const [localPart, domainPart] = atParts;
  if (!localPart || localPart.length > 64) {
    return { isValid: false, error: 'Please enter a valid email address.', formatted: trimmed };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { isValid: false, error: 'Please enter a valid email address.', formatted: trimmed };
  }

  if (!domainPart || !domainPart.includes('.')) {
    return { isValid: false, error: 'Please enter a valid email address.', formatted: trimmed };
  }

  if (domainPart.startsWith('.') || domainPart.endsWith('.') || domainPart.includes('..')) {
    return { isValid: false, error: 'Please enter a valid email address.', formatted: trimmed };
  }

  const domainParts = domainPart.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]{2,}$/.test(tld)) {
    return { isValid: false, error: 'Please enter a valid email address.', formatted: trimmed };
  }

  if (domainParts.some(p => !p || !/^[a-zA-Z0-9]+$/.test(p))) {
    return { isValid: false, error: 'Please enter a valid email address.', formatted: trimmed };
  }

  const emailRegex = /^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.', formatted: trimmed };
  }

  const domainLower = domainPart.toLowerCase();
  if (DISPOSABLE_EMAIL_DOMAINS.has(domainLower)) {
    return { isValid: false, error: 'Disposable email addresses are not accepted. Please enter a valid email address.', formatted: trimmed };
  }

  return { isValid: true, formatted: trimmed.toLowerCase() };
}

/**
 * Server-Side Indian Mobile Validation
 */
export function validateIndianMobile(rawInput: string): { isValid: boolean; error?: string; formatted: string; nationalNumber?: string } {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Please enter a valid 10-digit Indian mobile number.', formatted: '' };
  }

  if (/[^\d\s\-+()]/.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid 10-digit Indian mobile number.', formatted: trimmed };
  }

  let digits = trimmed.replace(/[\s\-()]/g, '');
  if (digits.startsWith('+91')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0091')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { isValid: false, error: 'Please enter a valid 10-digit Indian mobile number.', formatted: trimmed };
  }

  return { isValid: true, formatted: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`, nationalNumber: digits };
}
