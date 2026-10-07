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

  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    res.status(400).json({ error: 'Invalid email address format.', code: 'INVALID_INPUT' });
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
