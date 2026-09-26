/**
 * Notification & Communication Types
 * 
 * Supports Email and WhatsApp messaging:
 * - Single user send
 * - Bulk send to selected / filtered recipients
 * - Content update notifications
 * - Delivery audit logs
 */

export type NotificationChannel = 'email' | 'whatsapp' | 'both';

export type RecipientCategory = 'registration' | 'subscriber' | 'fellow' | 'custom' | 'candidate';

export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  phone: string; // e.g. "+91 9876543210"
  category: RecipientCategory;
}

export interface SendNotificationPayload {
  recipients: NotificationRecipient[];
  channel: NotificationChannel;
  subject?: string; // For Email
  message: string;
  contentReference?: {
    contentType: 'publication' | 'event' | 'research' | 'news' | 'general';
    contentId?: string;
    contentTitle?: string;
  };
}

export interface NotificationLog {
  id: string;
  channel: NotificationChannel;
  recipientCount: number;
  recipientSummary: string; // e.g., "Arjun Sharma + 4 others"
  subject?: string;
  messageSnippet: string;
  sentAt: string;
  status: 'delivered' | 'queued' | 'simulated';
  channelResponses?: {
    emailDelivered?: number;
    whatsappDelivered?: number;
  };
}
