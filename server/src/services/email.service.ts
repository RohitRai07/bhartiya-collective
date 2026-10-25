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
                      For queries regarding this receipt, certificates, or our research fellowships, please contact our secretariat at <a href="mailto:support@bharatcollective.in" style="color: #991b1b; text-decoration: underline; font-weight: 600;">support@bharatcollective.in</a> or visit <a href="https://bharatcollective.in" style="color: #991b1b; text-decoration: underline; font-weight: 600;">bharatcollective.in</a>.
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

${isDonation ? 'TAX EXEMPTION (80G):\nDonations to The Bharat Collective Foundation are eligible for tax deduction under Section 80G of the Income Tax Act, 1961. Please retain this email for your tax records.\n\n' : ''}For inquiries, contact: support@bharatcollective.in | https://bharatcollective.in

Warm regards,
Patron & Research Secretariat
The Bharat Collective Foundation
    `.trim();

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
