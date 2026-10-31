import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { maskEmail } from '../utils/crypto';
import { validateEmailAddress } from '../middleware/validation.middleware';

/**
 * Email Activity Log Record
 */
export interface EmailActivityLogRecord {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  senderEmail: string;
  category: string;
  timestamp: string;
  status: 'Pending' | 'Sent' | 'Failed';
  error?: string;
  messageId?: string;
}

export interface EmailOptions {
  to: string;
  recipientName?: string;
  subject: string;
  html: string;
  text?: string;
  category?: string;
  replyTo?: string;
}

export interface PaymentConfirmationEmailDetails {
  donorName?: string;
  amount: number;
  currency?: string;
  paymentId: string;
  orderId: string;
  receiptId?: string;
  purpose?: string;
  date?: string;
  cause?: string;
  frequency?: string;
  panNumber?: string;
  phone?: string;
}

export interface NewsletterSubscriberNotificationData {
  email: string;
  name?: string;
  phone?: string;
  source?: string;
  subscribedAt?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private activityLogs: EmailActivityLogRecord[] = [];
  private readonly MAX_LOGS = 1000;

  constructor() {
    this.initTransporter();
  }

  /**
   * Initializes or refreshes the Nodemailer SMTP transporter for GoDaddy Titan
   */
  private initTransporter(): void {
    if (config.email.host && config.email.user && config.email.pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure,
          auth: {
            user: config.email.user,
            pass: config.email.pass,
          },
          tls: {
            rejectUnauthorized: config.nodeEnv === 'production',
          },
        });
      } catch (err) {
        console.error('Failed to initialize GoDaddy Titan SMTP transporter:', err);
        this.transporter = null;
      }
    } else {
      this.transporter = null;
    }
  }

  /**
   * Get active transporter or re-evaluate credentials
   */
  private getTransporter(): nodemailer.Transporter | null {
    if (!this.transporter && config.email.host && config.email.user && config.email.pass) {
      this.initTransporter();
    }
    return this.transporter;
  }

  /**
   * Check if live GoDaddy Titan SMTP provider is actively configured with credentials
   */
  public isConfigured(): boolean {
    return Boolean(config.email.host && config.email.user && config.email.pass);
  }

  /**
   * Verify SMTP connection with GoDaddy Titan
   */
  public async verifyConnection(): Promise<{ success: boolean; message: string }> {
    const transporter = this.getTransporter();
    if (!transporter) {
      return {
        success: false,
        message: 'SMTP credentials not configured. Please set SMTP_PASS in environment variables.',
      };
    }

    try {
      await transporter.verify();
      return {
        success: true,
        message: `Successfully connected to ${config.email.host}:${config.email.port} as ${config.email.user}`,
      };
    } catch (error: any) {
      const sanitized = this.sanitizeError(error?.message || 'SMTP Connection Verification Failed');
      return {
        success: false,
        message: sanitized,
      };
    }
  }

  /**
   * Internal helper to record an email activity log entry
   */
  private recordLog(record: Omit<EmailActivityLogRecord, 'id' | 'timestamp'>): EmailActivityLogRecord {
    const fullRecord: EmailActivityLogRecord = {
      ...record,
      id: `elog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.activityLogs.unshift(fullRecord);
    if (this.activityLogs.length > this.MAX_LOGS) {
      this.activityLogs = this.activityLogs.slice(0, this.MAX_LOGS);
    }
    return fullRecord;
  }

  /**
   * Retrieve email activity logs
   */
  public getActivityLogs(limit = 100): EmailActivityLogRecord[] {
    return this.activityLogs.slice(0, limit);
  }

  /**
   * Clear logs (for testing)
   */
  public clearActivityLogs(): void {
    this.activityLogs = [];
  }

  /**
   * Sanitize error message to prevent leaking credentials
   */
  private sanitizeError(errMessage: string): string {
    if (!errMessage) return 'Unknown delivery error';
    let sanitized = errMessage;
    if (config.email.pass) {
      sanitized = sanitized.replace(new RegExp(config.email.pass, 'g'), '******');
    }
    return sanitized;
  }

  /**
   * Sends an email securely handling connection failures without crashing the main thread.
   * Standardized to use office@bharatcollective.in and Bharat Collective Foundation branding.
   */
  public async sendEmail(options: EmailOptions): Promise<boolean> {
    const cleanTo = (options.to || '').trim();
    const category = options.category || 'general';

    // 1. Validate recipient email address on backend
    const val = validateEmailAddress(cleanTo);
    if (!val.isValid) {
      console.warn(`[Email Validation Error] Rejected invalid recipient email: "${cleanTo}"`);
      this.recordLog({
        recipientEmail: cleanTo || 'empty',
        recipientName: options.recipientName,
        subject: options.subject,
        senderEmail: config.email.fromEmail,
        category,
        status: 'Failed',
        error: val.error || 'Invalid recipient email address format.',
      });
      return false;
    }

    const logEntry = this.recordLog({
      recipientEmail: val.formatted,
      recipientName: options.recipientName,
      subject: options.subject,
      senderEmail: config.email.fromEmail,
      category,
      status: 'Pending',
    });

    try {
      const transporter = this.getTransporter();

      // If credentials are not configured (e.g. dev/test fallback mode)
      if (!transporter) {
        console.log(
          `[Email Provider Placeholder] Dispatched email to ${maskEmail(val.formatted)} | Subject: ${options.subject} | From: ${config.email.from}`
        );
        logEntry.status = 'Sent';
        logEntry.error = undefined;
        return true;
      }

      // Live delivery via GoDaddy Titan SMTP
      const mailOptions = {
        from: config.email.from, // "Bharat Collective Foundation" <office@bharatcollective.in>
        to: val.formatted,
        replyTo: options.replyTo || config.email.replyTo, // office@bharatcollective.in
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, '').trim(),
      };

      const info = await transporter.sendMail(mailOptions);
      logEntry.status = 'Sent';
      logEntry.messageId = info?.messageId;
      logEntry.error = undefined;
      return true;
    } catch (error: any) {
      const cleanError = this.sanitizeError(error?.message || 'SMTP Transmission Failed');
      console.error(`[GoDaddy Titan SMTP Error] Delivery failed to ${maskEmail(val.formatted)}:`, cleanError);
      logEntry.status = 'Failed';
      logEntry.error = cleanError;
      return false;
    }
  }

  /**
   * Safe individual delivery for bulk communications (respects privacy, deduplicates, and batches)
   */
  public async sendBatchEmails(
    recipients: Array<{ email: string; name?: string; id?: string }>,
    subject: string,
    html: string,
    text?: string,
    category = 'general'
  ): Promise<{ total: number; sent: number; failed: number; errors: string[] }> {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return { total: 0, sent: 0, failed: 0, errors: ['No recipients provided'] };
    }

    // Deduplicate by email address to prevent duplicate sends within the campaign
    const seenEmails = new Set<string>();
    const uniqueRecipients: Array<{ email: string; name?: string }> = [];

    for (const r of recipients) {
      const clean = (r.email || '').trim().toLowerCase();
      if (!clean || seenEmails.has(clean)) continue;
      seenEmails.add(clean);
      uniqueRecipients.push({ email: clean, name: r.name });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Safe batching in chunks of 10 to respect Titan sending rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < uniqueRecipients.length; i += BATCH_SIZE) {
      const chunk = uniqueRecipients.slice(i, i + BATCH_SIZE);
      const promises = chunk.map(async r => {
        const success = await this.sendEmail({
          to: r.email,
          recipientName: r.name,
          subject,
          html,
          text,
          category,
        });
        if (success) {
          sent++;
        } else {
          failed++;
          errors.push(`Failed delivery to ${r.email}`);
        }
      });

      await Promise.all(promises);

      // Brief throttling between batches
      if (i + BATCH_SIZE < uniqueRecipients.length) {
        await new Promise(resolve => setTimeout(resolve, 60));
      }
    }

    return {
      total: uniqueRecipients.length,
      sent,
      failed,
      errors,
    };
  }

  /**
   * Internal Admin Notification for New Newsletter Subscriptions
   * Dispatches an automatic notification to office@bharatcollective.in
   */
  public async sendNewsletterAdminNotification(
    subscriber: NewsletterSubscriberNotificationData
  ): Promise<boolean> {
    try {
      const recipient = config.email.officeEmail || 'office@bharatcollective.in';
      const subject = 'New Newsletter Subscription – Bharat Collective Foundation';

      const subDate = subscriber.subscribedAt
        ? new Date(subscriber.subscribedAt).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'full',
            timeStyle: 'medium',
          }) + ' IST'
        : new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'full',
            timeStyle: 'medium',
          }) + ' IST';

      const subscriberName = subscriber.name?.trim() || 'Not specified';
      const subscriberPhone = subscriber.phone?.trim() || 'Not specified';
      const sourcePage = subscriber.source || 'website-footer';

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 24px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
            <tr>
              <td align="center" style="padding: 12px;">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #781717 0%, #991b1b 100%); padding: 24px 28px; border-bottom: 4px solid #d97706; text-align: left;">
                      <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); color: #fef3c7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 12px; margin-bottom: 8px;">
                        Website Intake Alert
                      </span>
                      <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; font-family: Georgia, serif;">
                        New Newsletter Subscriber
                      </h1>
                      <p style="color: #fde68a; font-size: 12px; margin: 4px 0 0 0;">
                        Bharat Collective Foundation • Research & Policy Digest
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 28px;">
                      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                        Namaste Secretariat,<br/><br/>
                        A new reader has successfully subscribed to the Bharat Collective Foundation newsletter on the website. Here are the subscriber details:
                      </p>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0; border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate; overflow: hidden; font-size: 13px;">
                        <tr style="background-color: #f8fafc;">
                          <td style="padding: 10px 16px; font-weight: 700; color: #0f172a; width: 35%; border-bottom: 1px solid #e2e8f0;">Subscriber Email</td>
                          <td style="padding: 10px 16px; color: #991b1b; font-weight: 700; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${subscriber.email}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 16px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Full Name</td>
                          <td style="padding: 10px 16px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${subscriberName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 16px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Mobile Number</td>
                          <td style="padding: 10px 16px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${subscriberPhone}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 16px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Subscription Timestamp</td>
                          <td style="padding: 10px 16px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${subDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 16px; font-weight: 600; color: #475569;">Acquisition Source</td>
                          <td style="padding: 10px 16px; color: #0f172a; text-transform: capitalize;">${sourcePage.replace(/-/g, ' ')}</td>
                        </tr>
                      </table>

                      <div style="margin-top: 24px; padding: 14px 18px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                        <span style="color: #166534; font-size: 12px; font-weight: 700; display: block; margin-bottom: 4px;">✓ Verified Database Record</span>
                        <span style="color: #15803d; font-size: 12px; line-height: 1.5; display: block;">
                          The subscriber has been committed to the central subscriber repository and is eligible to receive future monographs, digests, and scholarly updates.
                        </span>
                      </div>

                      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                        This is an automated internal operational alert generated by the Bharat Collective web application.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center;">
                      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                        © ${new Date().getFullYear()} Bharat Collective Foundation • office@bharatcollective.in
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const text = `
NEW NEWSLETTER SUBSCRIPTION - BHARAT COLLECTIVE FOUNDATION
-----------------------------------------------------------
A new subscriber has joined the Bharat Collective digest:

Subscriber Email: ${subscriber.email}
Full Name:        ${subscriberName}
Mobile Number:    ${subscriberPhone}
Subscription Date: ${subDate}
Source:           ${sourcePage}

Status: Saved to database repository.
-----------------------------------------------------------
Bharat Collective Foundation • office@bharatcollective.in
      `.trim();

      return await this.sendEmail({
        to: recipient,
        recipientName: 'Bharat Collective Secretariat',
        subject,
        html,
        text,
        category: 'newsletter_admin_alert',
        replyTo: subscriber.email, // Conveniently allows admin to hit reply directly to the subscriber
      });
    } catch (err) {
      console.error('Failed to dispatch newsletter admin notification:', err);
      return false;
    }
  }

  // Pre-configured Templates (Reusable)
  public async sendShortlistedEmail(to: string, name: string, contactPerson: string): Promise<boolean> {
    return this.sendEmail({
      to,
      recipientName: name,
      category: 'career',
      subject: `Congratulations ${name}, You Have Been Shortlisted`,
      html: `
        <h2>Namaste ${name},</h2>
        <p>We are delighted to inform you that your application with the <strong>Bharat Collective Foundation</strong> has been shortlisted.</p>
        <p>Please coordinate with <strong>${contactPerson}</strong> for the upcoming interview and presentation rounds.</p>
        <br/><p>Warm regards,<br/>Bharat Collective Secretariat</p>
      `,
    });
  }

  public async sendTwoFactorEmail(to: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to,
      category: 'auth_2fa',
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
      `,
    });
  }

  /**
   * Reusable payment confirmation email with Core Bhartiya Collective branding,
   * amount, date, Razorpay IDs, purpose, 80G tax notice, and support details.
   */
  public async sendPaymentConfirmationEmail(
    to: string,
    details: PaymentConfirmationEmailDetails
  ): Promise<boolean> {
    const name = details.donorName?.trim() || 'Esteemed Patron';
    const amountFormatted = details.amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    const currency = details.currency || 'INR';
    const dateFormatted = details.date
      ? new Date(details.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' }) + ' IST'
      : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' }) + ' IST';
    const purposeText = details.purpose === 'magazine' || details.purpose === 'magazine_download'
      ? 'Bharat Review Magazine (Digital Edition)'
      : 'Support Us / Independent Research & Fellowships';
    const isDonation = !details.purpose || details.purpose === 'donation';

    const subject = `Payment Confirmation: ₹${amountFormatted} Received - The Bharat Collective`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 20px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
          <tr>
            <td align="center" style="padding: 12px;">
              <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #781717 0%, #991b1b 100%); padding: 32px 28px; text-align: center; border-bottom: 4px solid #d97706;">
                    <div style="display: inline-block; padding: 6px 14px; background-color: rgba(255, 255, 255, 0.15); border-radius: 20px; margin-bottom: 12px;">
                      <span style="color: #fef3c7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Official Receipt & Acknowledgment</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 1px; font-family: Georgia, serif;">THE BHARAT COLLECTIVE</h1>
                    <p style="color: #fde68a; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Research • Policy • Civilisational Perspective</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 32px 28px 24px 28px;">
                    <h2 style="color: #0f172a; font-size: 20px; margin-top: 0; margin-bottom: 14px; font-family: Georgia, serif;">Namaste ${name},</h2>
                    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                      Thank you for your generous contribution to <strong>The Bharat Collective Foundation</strong>. We gratefully acknowledge receipt of your payment, which has been verified and confirmed through our secure payment gateway.
                    </p>

                    <!-- Amount Highlight Banner -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 22px 0; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 10px;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <span style="font-size: 12px; font-weight: 700; color: #854d0e; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Total Contribution Confirmed</span>
                          <span style="font-size: 34px; font-weight: 800; color: #78350f; font-family: -apple-system, BlinkMacSystemFont, sans-serif; letter-spacing: -0.5px;">₹${amountFormatted}</span>
                          <span style="display: block; font-size: 12px; color: #a16207; margin-top: 4px; font-weight: 600;">${currency} • Verified via Razorpay</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Transaction Summary Table -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate; overflow: hidden; font-size: 13px;">
                      <tr style="background-color: #f8fafc;">
                        <td colspan="2" style="padding: 12px 16px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
                          Transaction Summary
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 16px; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 40%;">Payment Reference (ID)</td>
                        <td style="padding: 10px 16px; color: #0f172a; font-weight: 600; font-family: monospace; border-bottom: 1px solid #f1f5f9;">${details.paymentId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 16px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Order Reference</td>
                        <td style="padding: 10px 16px; color: #0f172a; font-weight: 600; font-family: monospace; border-bottom: 1px solid #f1f5f9;">${details.orderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 16px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Date & Time</td>
                        <td style="padding: 10px 16px; color: #0f172a; font-weight: 500; border-bottom: 1px solid #f1f5f9;">${dateFormatted}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 16px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Contribution Purpose</td>
                        <td style="padding: 10px 16px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${purposeText}</td>
                      </tr>
                      ${details.cause ? `
                      <tr>
                        <td style="padding: 10px 16px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Specific Cause</td>
                        <td style="padding: 10px 16px; color: #0f172a; font-weight: 500; border-bottom: 1px solid #f1f5f9; text-transform: capitalize;">${details.cause.replace(/_/g, ' ')}</td>
                      </tr>` : ''}
                      ${details.frequency ? `
                      <tr>
                        <td style="padding: 10px 16px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Frequency</td>
                        <td style="padding: 10px 16px; color: #0f172a; font-weight: 500; border-bottom: 1px solid #f1f5f9; text-transform: capitalize;">${details.frequency.replace(/_/g, ' ')}</td>
                      </tr>` : ''}
                      ${details.panNumber ? `
                      <tr>
                        <td style="padding: 10px 16px; color: #64748b; border-bottom: 1px solid #f1f5f9;">PAN Number (for 80G)</td>
                        <td style="padding: 10px 16px; color: #0f172a; font-weight: 600; font-family: monospace; border-bottom: 1px solid #f1f5f9;">${details.panNumber}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 10px 16px; color: #64748b;">Payment Status</td>
                        <td style="padding: 10px 16px; color: #15803d; font-weight: 700;">Captured & Cryptographically Verified</td>
                      </tr>
                    </table>

                    ${isDonation ? `
                    <!-- 80G Tax Exemption Notice -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                      <tr>
                        <td style="padding: 14px 18px;">
                          <p style="color: #166534; font-size: 13px; margin: 0 0 4px 0; font-weight: 700;">
                            ✓ Section 80G Tax Exemption Eligible
                          </p>
                          <p style="color: #15803d; font-size: 12px; margin: 0; line-height: 1.5;">
                            Donations to The Bharat Collective Foundation are eligible for tax deduction under Section 80G of the Income Tax Act, 1961. Please retain this email and transaction ID for your income tax filings. Formal consolidated tax certificates are dispatched annually.
                          </p>
                        </td>
                      </tr>
                    </table>` : ''}

                    <!-- Support Contact & Inquiries -->
                    <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                      For queries regarding this receipt, certificates, or our research fellowships, please contact our secretariat at <a href="mailto:office@bharatcollective.in" style="color: #991b1b; text-decoration: underline; font-weight: 600;">office@bharatcollective.in</a> or visit <a href="https://bharatcollective.in" style="color: #991b1b; text-decoration: underline; font-weight: 600;">bharatcollective.in</a>.
                    </p>

                    <p style="color: #334155; font-size: 14px; margin: 20px 0 0 0;">
                      With sincere gratitude,<br/>
                      <strong>Patron & Research Secretariat</strong><br/>
                      The Bharat Collective Foundation
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center;">
                    <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.5;">
                      © ${new Date().getFullYear()} The Bharat Collective Foundation • New Delhi, India<br/>
                      An independent scholarly research collective and public policy institution.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
NAMASTE ${name.toUpperCase()},

Thank you for your generous contribution to The Bharat Collective Foundation. Your payment has been successfully processed and cryptographically verified.

TRANSACTION SUMMARY:
----------------------------------------
Amount Confirmed: ₹${amountFormatted} ${currency}
Payment ID: ${details.paymentId}
Order Reference: ${details.orderId}
Date & Time: ${dateFormatted}
Purpose: ${purposeText}
${details.cause ? `Cause: ${details.cause}\n` : ''}${details.frequency ? `Frequency: ${details.frequency}\n` : ''}${details.panNumber ? `PAN Number: ${details.panNumber}\n` : ''}Payment Status: Captured & Verified
----------------------------------------

${isDonation ? 'TAX EXEMPTION (80G):\nDonations to The Bharat Collective Foundation are eligible for tax deduction under Section 80G of the Income Tax Act, 1961. Please retain this email for your tax records.\n\n' : ''}For inquiries, contact: office@bharatcollective.in | https://bharatcollective.in

Warm regards,
Patron & Research Secretariat
The Bharat Collective Foundation
    `.trim();

    return this.sendEmail({
      to,
      recipientName: name,
      category: isDonation ? 'donation' : 'magazine',
      subject,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
