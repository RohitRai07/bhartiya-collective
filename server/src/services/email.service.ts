import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { maskEmail } from '../utils/crypto';

// ============================================
// FINAL PROVIDER CONFIGURATION REQUIRED
// ============================================
// Add actual provider credentials/API details
// here after the service is purchased/configured.
//
// SMS:
// API URL
// API KEY
// SENDER ID
// TEMPLATE ID
//
// EMAIL:
// API URL / SMTP details
// API KEY / credentials
// SENDER EMAIL
//
// WHATSAPP:
// API URL
// API KEY
// PHONE NUMBER ID
// TEMPLATE ID
// ============================================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: any;

  constructor() {
    if (config.email.host && config.email.user) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
    }
  }

  /**
   * Sends an email securely handling connection failures without crashing the main thread.
   */
  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!config.email.host || !config.email.user || !this.transporter) {
        console.log(`[Email Provider Placeholder] Dispatched email to ${maskEmail(options.to)} | Subject: ${options.subject}`);
        return true; 
      }

      await this.transporter.sendMail({
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
      });

      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false; // Does not throw, ensuring business logic isn't interrupted
    }
  }

  // Pre-configured Templates (Reusable)
  public async sendShortlistedEmail(to: string, name: string, contactPerson: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Congratulations ${name}, You Have Been Shortlisted`,
      html: `
        <h2>Namaste ${name},</h2>
        <p>We are delighted to inform you that your application with the <strong>Bharat Collective Foundation</strong> has been shortlisted.</p>
        <p>Please coordinate with <strong>${contactPerson}</strong> for the upcoming interview and presentation rounds.</p>
        <br/><p>Warm regards,<br/>Bharat Collective Secretariat</p>
      `
    });
  }

  public async sendTwoFactorEmail(to: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Bharat Collective Admin Portal - Security Verification Code: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0;">Two-Factor Authentication</h2>
          <p style="color: #475569; font-size: 14px;">A sign-in attempt was initiated for the <strong>Bharat Collective Administrative Portal</strong>.</p>
          <div style="margin: 24px 0; padding: 16px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; text-align: center;">
            <span style="font-size: 12px; font-weight: bold; color: #92400e; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Your 6-Digit Verification Code</span>
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #78350f; letter-spacing: 6px;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This verification code is strictly valid for <strong>5 minutes</strong> and can only be used once. If you did not initiate this login request, please contact the security administrator immediately.</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">© Bharat Collective Foundation • Secure Administrative Secretariat</p>
        </div>
      `
    });
  }
}

export const emailService = new EmailService();
