import dotenv from 'dotenv';
import { hashPassword } from '../utils/crypto';
dotenv.config();

// Default initial admin credentials (can be overridden by environment variables)
const INITIAL_ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'BharatAdmin@2026';
const defaultHash = hashPassword(INITIAL_ADMIN_PASSWORD, 'bharat_salt_2026_fixed');

export const config = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Security Configuration
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'bcf_prod_session_secret_2026_a98bf421cd879e612f04e1bc',
    otpSecret: process.env.OTP_SECRET || 'bcf_prod_otp_secret_2026_d78ac9210e543fb87421ab79',
    sessionExpirySeconds: parseInt(process.env.SESSION_EXPIRY_SECONDS || '7200'), // 2 hours
    idleTimeoutSeconds: parseInt(process.env.IDLE_TIMEOUT_SECONDS || '1800'),     // 30 minutes
  },

  // Admin Account Configuration
  admin: {
    id: 'admin-001',
    email: (process.env.ADMIN_EMAIL || 'admin@bharatcollective.org').trim().toLowerCase(),
    name: process.env.ADMIN_NAME || 'Chief Administrator (Bharat Collective)',
    phone: process.env.ADMIN_PHONE || '+91 80768 02450',
    passwordHash: process.env.ADMIN_PASSWORD_HASH || defaultHash.hash,
    passwordSalt: process.env.ADMIN_PASSWORD_SALT || defaultHash.salt,
    role: 'admin' as const,
  },

  // 2FA / OTP Configuration
  otp: {
    length: parseInt(process.env.OTP_LENGTH || '6'),
    expirySeconds: parseInt(process.env.OTP_EXPIRY_SECONDS || '300'),           // 5 minutes
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5'),                 // 5 tries max
    resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60'), // 60s
  },

  // Rate Limiting Configuration
  rateLimit: {
    login: {
      windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || '900000'), // 15 mins
      max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5'),                 // 5 attempts
    },
    otpRequest: {
      windowMs: parseInt(process.env.RATE_LIMIT_OTP_REQUEST_WINDOW_MS || '300000'), // 5 mins
      max: parseInt(process.env.RATE_LIMIT_OTP_REQUEST_MAX || '3'),                 // 3 attempts
    },
    otpVerify: {
      windowMs: parseInt(process.env.RATE_LIMIT_OTP_VERIFY_WINDOW_MS || '300000'), // 5 mins
      max: parseInt(process.env.RATE_LIMIT_OTP_VERIFY_MAX || '5'),                 // 5 attempts
    },
    adminApi: {
      windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_API_WINDOW_MS || '60000'), // 1 min
      max: parseInt(process.env.RATE_LIMIT_ADMIN_API_MAX || '100'),              // 100 requests
    }
  },

  sms: {
    apiUrl: process.env.SMS_API_URL || '',
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || '',
    templates: {
      shortlist: process.env.SMS_TEMPLATE_ID_SHORTLIST || '',
      select: process.env.SMS_TEMPLATE_ID_SELECT || '',
      general: process.env.SMS_TEMPLATE_ID_GENERAL || '',
      otp: process.env.SMS_TEMPLATE_ID_OTP || '',
    }
  },

  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '"Bharat Collective" <noreply@bharatcollective.org>',
  },

  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0/',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiKey: process.env.WHATSAPP_API_KEY || '',
    templates: {
      shortlist: process.env.WHATSAPP_TEMPLATE_SHORTLIST || '',
      publish: process.env.WHATSAPP_TEMPLATE_PUBLISH || '',
      otp: process.env.WHATSAPP_TEMPLATE_OTP || '',
    }
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  }
};
