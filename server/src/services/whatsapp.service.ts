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

export interface WhatsAppOptions {
  to: string; // Phone number with country code (e.g., 919876543210)
  templateName: string; // The approved WhatsApp template name
  components: Array<any>; // Dynamic parameters mapping for the template
}

export class WhatsAppService {
  
  /**
   * Sends a WhatsApp template message using Meta's Official WhatsApp Business Cloud API.
   */
  public async sendWhatsAppMessage(options: WhatsAppOptions): Promise<boolean> {
    try {
      if (!config.whatsapp.phoneNumberId || !config.whatsapp.apiKey) {
        console.log(`[WhatsApp Provider Placeholder] Dispatched WhatsApp message to ${maskPhone(options.to)}`);
        return true;
      }

      const endpoint = `${config.whatsapp.apiUrl}${config.whatsapp.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "template",
        template: {
          name: options.templateName,
          language: {
            code: "en_US"
          },
          components: options.components
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.whatsapp.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('WhatsApp API Error:', JSON.stringify(errData, null, 2));
        return false;
      }

      return true;
    } catch (error) {
      console.error('WhatsApp sending failed:', error);
      return false; // Non-blocking
    }
  }

  /**
   * Helper fallback to send simple text using pre-approved template or direct text if provider supports session
   */
  public async sendWhatsApp(options: { to: string; message: string }): Promise<boolean> {
    const formattedNumber = options.to.replace(/\D/g, '');
    
    // Check if custom 2FA / general template is provided
    if (config.whatsapp.templates.otp) {
      return this.sendWhatsAppMessage({
        to: formattedNumber,
        templateName: config.whatsapp.templates.otp,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: options.message }
            ]
          }
        ]
      });
    }

    if (!config.whatsapp.phoneNumberId || !config.whatsapp.apiKey) {
      console.log(`[WhatsApp Provider Placeholder] Dispatched message to ${maskPhone(options.to)}`);
      return true;
    }

    // Direct text fallback
    try {
      const endpoint = `${config.whatsapp.apiUrl}${config.whatsapp.phoneNumberId}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        to: formattedNumber,
        type: "text",
        text: { body: options.message }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.whatsapp.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (e) {
      console.error('WhatsApp direct text sending failed:', e);
      return false;
    }
  }

  public async sendTwoFactorWhatsApp(to: string, otp: string): Promise<boolean> {
    return this.sendWhatsApp({
      to,
      message: `Your Bharat Collective Admin 2FA verification code is ${otp}. Valid for 5 minutes. Do not share.`
    });
  }
}

export const whatsappService = new WhatsAppService();
