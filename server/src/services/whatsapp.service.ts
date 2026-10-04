import { config } from '../config/env';

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
        console.warn('WhatsApp config missing. Mocking success for:', options.to);
        return true;
      }

      // ============================================
      // WHATSAPP PROVIDER CONFIGURATION
      // Using Meta Graph API structure.
      // ============================================
      const endpoint = `${config.whatsapp.apiUrl}${config.whatsapp.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "template",
        template: {
          name: options.templateName,
          language: {
            code: "en_US" // Or appropriate language code
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

  // Pre-configured Templates (Reusable)
  public async sendShortlistedWhatsApp(to: string, name: string, contactPerson: string): Promise<boolean> {
    return this.sendWhatsAppMessage({
      to,
      templateName: config.whatsapp.templates.shortlist,
      // Map the variables {{1}}, {{2}} in the approved template
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: name },
            { type: "text", text: contactPerson }
          ]
        }
      ]
    });
  }

  public async sendNewContentWhatsApp(to: string, title: string, url: string): Promise<boolean> {
    return this.sendWhatsAppMessage({
      to,
      templateName: config.whatsapp.templates.publish,
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: title },
            { type: "text", text: url }
          ]
        }
      ]
    });
  }

  public async sendWhatsApp(options: { to: string; message: string } | string, message?: string): Promise<boolean> {
    const to = typeof options === 'string' ? options : options.to;
    const msg = typeof options === 'string' ? (message || '') : options.message;
    return this.sendWhatsAppMessage({
      to,
      templateName: config.whatsapp.templates.publish || 'default_notice',
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: msg }]
        }
      ]
    });
  }
}

export const whatsappService = new WhatsAppService();
