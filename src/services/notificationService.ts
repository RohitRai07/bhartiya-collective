/**
 * Notification Service
 * 
 * Manages Email & WhatsApp communications:
 * - Single user send (Email / WhatsApp)
 * - Bulk communications to selected or filtered recipients
 * - Content update broadcasts
 * - Newsletter subscription confirmation notifications
 * - Audit log tracking
 * 
 * Decoupled provider boundary: Real provider APIs (Meta WhatsApp Cloud API /
 * SendGrid / AWS SES) can be wired here without altering the Admin UI.
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { 
  NotificationChannel, 
  NotificationRecipient, 
  SendNotificationPayload, 
  NotificationLog 
} from '../types/notification';

// Persistent in-memory + local storage log for sent communications
const STORAGE_KEY = 'bharat_collective_notification_logs';

function loadStoredLogs(): NotificationLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial realistic communications log
      const initial: NotificationLog[] = [
        {
          id: 'notif-001',
          channel: 'email',
          recipientCount: 142,
          recipientSummary: 'All Active Members & Fellows',
          subject: 'New Monograph Published: Dharma, Artha and the Modern State',
          messageSnippet: 'We are pleased to announce the release of our peer-reviewed policy monograph...',
          sentAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          status: 'delivered',
          channelResponses: { emailDelivered: 142 },
        },
        {
          id: 'notif-002',
          channel: 'both',
          recipientCount: 1,
          recipientSummary: 'Arjun Sharma (+91 9811234567)',
          subject: 'Registration Status Verified - Bharat Collective',
          messageSnippet: 'Your fellowship registration application has been verified by the Council...',
          sentAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'delivered',
          channelResponses: { emailDelivered: 1, whatsappDelivered: 1 },
        }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLogs(logs: NotificationLog[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save notification logs:', e);
  }
}

// Email Gateway Configuration
export interface EmailGatewayConfig {
  provider: 'simulation' | 'webhook' | 'mailto';
  webhookUrl: string;
  senderName: string;
  senderEmail: string;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed';
}

const GATEWAY_STORAGE_KEY = 'bharat_collective_email_gateway';

export const DEFAULT_GATEWAY_CONFIG: EmailGatewayConfig = {
  provider: 'simulation',
  webhookUrl: '',
  senderName: 'Bharat Collective Secretariat',
  senderEmail: 'newsletter@bharatcollective.org',
};

function loadStoredGatewayConfig(): EmailGatewayConfig {
  if (typeof window === 'undefined') return DEFAULT_GATEWAY_CONFIG;
  try {
    const raw = localStorage.getItem(GATEWAY_STORAGE_KEY);
    if (!raw) return DEFAULT_GATEWAY_CONFIG;
    return { ...DEFAULT_GATEWAY_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GATEWAY_CONFIG;
  }
}

function saveGatewayConfig(cfg: EmailGatewayConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.error('Failed to save email gateway config:', e);
  }
}

export const notificationService = {
  /**
   * Fetch Email Gateway Configuration
   */
  getEmailGatewayConfig(): EmailGatewayConfig {
    return loadStoredGatewayConfig();
  },

  /**
   * Update Email Gateway Configuration
   */
  updateEmailGatewayConfig(updates: Partial<EmailGatewayConfig>): EmailGatewayConfig {
    const current = loadStoredGatewayConfig();
    const updated = { ...current, ...updates };
    saveGatewayConfig(updated);
    return updated;
  },

  /**
   * Fetch all past notification audit logs
   */
  async getNotificationLogs(): Promise<NotificationLog[]> {
    await new Promise(resolve => setTimeout(resolve, 80));
    return loadStoredLogs();
  },

  /**
   * Send notification to single or multiple recipients via Email, WhatsApp, or Both
   */
  async sendNotification(payload: SendNotificationPayload): Promise<{
    success: boolean;
    logId: string;
    deliveredCount: number;
    channel: NotificationChannel;
    message: string;
  }> {
    if (!payload.recipients || payload.recipients.length === 0) {
      throw new Error('Please select at least one recipient.');
    }
    if (!payload.message || !payload.message.trim()) {
      throw new Error('Notification message content cannot be empty.');
    }

    const gateway = loadStoredGatewayConfig();

    // 1. Backend API Client integration point (for future Phase 2-4 production)
    if (!apiConfig.useMockData) {
      const response = await apiClient.post<{ logId: string; deliveredCount: number }>(
        '/notifications/send',
        payload
      );
      return {
        success: true,
        logId: response.data.logId,
        deliveredCount: response.data.deliveredCount,
        channel: payload.channel,
        message: 'Notification dispatched through enterprise gateway.',
      };
    }

    // 2. Webhook Dispatch (if configured by admin)
    if (gateway.provider === 'webhook' && gateway.webhookUrl) {
      try {
        await fetch(gateway.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'NOTIFICATION_DISPATCH',
            channel: payload.channel,
            sender: `${gateway.senderName} <${gateway.senderEmail}>`,
            recipients: payload.recipients,
            subject: payload.subject,
            message: payload.message,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.warn('Live webhook dispatch warning (local fallback active):', err);
      }
    }

    // 3. Local Simulation & Logging
    await new Promise(resolve => setTimeout(resolve, 250)); // simulate gateway latency

    const logId = `notif-${Date.now()}`;
    const count = payload.recipients.length;
    const sampleRecipient = count === 1 
      ? `${payload.recipients[0].name} (${payload.recipients[0].phone || payload.recipients[0].email})`
      : `${payload.recipients[0].name} + ${count - 1} other(s)`;

    const newLog: NotificationLog = {
      id: logId,
      channel: payload.channel,
      recipientCount: count,
      recipientSummary: sampleRecipient,
      subject: payload.subject,
      messageSnippet: payload.message.slice(0, 120) + (payload.message.length > 120 ? '...' : ''),
      sentAt: new Date().toISOString(),
      status: 'delivered',
      channelResponses: {
        emailDelivered: (payload.channel === 'email' || payload.channel === 'both') ? count : 0,
        whatsappDelivered: (payload.channel === 'whatsapp' || payload.channel === 'both') ? count : 0,
      }
    };

    const currentLogs = loadStoredLogs();
    const updated = [newLog, ...currentLogs];
    saveLogs(updated);

    return {
      success: true,
      logId,
      deliveredCount: count,
      channel: payload.channel,
      message: `Successfully dispatched notification to ${count} recipient(s) via ${payload.channel.toUpperCase()}.`,
    };
  },

  /**
   * Helper to send automated confirmation email on newsletter subscription (Section 9)
   */
  async sendNewsletterConfirmation(email: string): Promise<boolean> {
    try {
      await this.sendNotification({
        recipients: [{
          id: `sub-${email}`,
          name: email.split('@')[0],
          email,
          phone: '',
          category: 'subscriber',
        }],
        channel: 'email',
        subject: 'Welcome to the Bharat Collective Research Digest',
        message: `Namaste,\n\nThank you for subscribing to the Bharat Collective Foundation Research Digest. You will receive our monthly civilizational monographs, policy papers, and invitations to national symposia.\n\nWarm regards,\nTeam Bharat Collective`,
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Generate official letterhead preview for subscriber's confirmation email
   */
  getWelcomeEmailPreview(email: string) {
    const gateway = loadStoredGatewayConfig();
    return {
      sender: `${gateway.senderName} <${gateway.senderEmail}>`,
      recipient: email,
      subject: 'Welcome to the Bharat Collective Research Digest',
      date: new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      salutation: 'Namaste,',
      bodyParagraphs: [
        'Thank you for subscribing to the Bharat Collective Foundation Research Digest.',
        'You have joined a distinguished national fellowship of scholars, researchers, policy analysts, and citizens dedicated to India’s civilizational rejuvenation, intellectual sovereignty, and institutional excellence.',
        'As an active subscriber, you will receive our monthly peer-reviewed policy monographs, notifications for Call for Papers, and exclusive invites to our national roundtables.',
        'All research published by Bharat Collective Foundation undergoes rigorous scholarly scrutiny and adheres to the highest standards of evidence and civilizational grounding.',
      ],
      closing: 'Warm regards,',
      signatory: 'Editorial Secretariat\nBharat Collective Foundation\nNew Delhi, Bharat',
      unsubscribeToken: `BCF-SUB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };
  },

  /**
   * Generate client-side mailto link
   */
  generateMailtoLink(to: string, subject: string, body: string): string {
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  },
};
