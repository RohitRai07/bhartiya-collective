import { config } from '../config/env';

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
        console.warn('SMS config missing. Mocking success for number:', options.to);
        return true;
      }

      // ============================================
      // SMS PROVIDER CONFIGURATION
      // Update the payload structure below according to your specific SMS provider's API docs.
      // Example below is a generic REST payload structure used by MSG91/Textlocal style APIs.
      // ============================================
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
          'authkey': config.sms.apiKey, // Or 'Authorization': `Bearer ${config.sms.apiKey}` depending on provider
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
}

export const smsService = new SMSService();
