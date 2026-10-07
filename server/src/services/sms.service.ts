import { config } from '../config/env';
import { maskPhone } from '../utils/crypto';

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

export interface SMSOptions {
  to: string; // The phone number
  message: string;
  templateId?: string; // Optional: Some providers require specific DLT approved template IDs
}

export class SMSService {
  
  /**
   * Sends an SMS via the configured HTTP provider.
   * Modular so you can replace the fetch body based on your provider's exact spec (Twilio, MSG91, Textlocal).
   */
  public async sendSMS(options: SMSOptions): Promise<boolean> {
    try {
      if (!config.sms.apiUrl || !config.sms.apiKey) {
        // Safe placeholder: Never log the raw OTP or full credentials in production
        console.log(`[SMS Provider Placeholder] Dispatched SMS to ${maskPhone(options.to)}`);
        return true;
      }

      const payload = {
        sender: config.sms.senderId,
        route: "4", 
        country: "91",
        sms: [
          {
            message: options.message,
            to: [options.to]
          }
        ],
        template_id: options.templateId
      };

      const response = await fetch(config.sms.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': config.sms.apiKey,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('SMS API Error Response:', errText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false; // Non-blocking
    }
  }

  // Pre-configured Templates (Reusable)
  public async sendShortlistedSMS(to: string, name: string, contactPerson: string): Promise<boolean> {
    return this.sendSMS({
      to,
      message: `Hi ${name}, your application has been shortlisted by Bharat Collective. Please connect with ${contactPerson} for the next steps.`,
      templateId: config.sms.templates.shortlist
    });
  }

  public async sendNewContentSMS(to: string, title: string, url: string): Promise<boolean> {
    return this.sendSMS({
      to,
      message: `New content published on Bharat Collective: ${title}. Read more here: ${url}`,
      templateId: config.sms.templates.general
    });
  }

  public async sendTwoFactorSMS(to: string, otp: string): Promise<boolean> {
    return this.sendSMS({
      to,
      message: `Your Bharat Collective Admin 2FA verification code is ${otp}. Valid for 5 minutes. Do not share.`,
      templateId: config.sms.templates.otp
    });
  }
}

export const smsService = new SMSService();
