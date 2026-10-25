/**
 * Notification & Communication Types
 * 
 * Centralized schema for Email, SMS, and WhatsApp communications across all modules:
 * - Single recipient dispatches
 * - Multi-recipient / Select-all bulk communications
 * - Source-linked recipient aggregation
 * - Two-way synchronized audit logs
 * - Channel provider health tracking
 */

export type NotificationChannel = 'email' | 'whatsapp' | 'sms' | 'both' | 'all';

export type RecipientCategory = 
  | 'registration' 
  | 'subscriber' 
  | 'fellow' 
  | 'custom' 
  | 'candidate'
  | 'author'
  | 'inquiry';

export type RecipientSourceModule = 
  | 'career' 
  | 'newsletter' 
  | 'registration' 
  | 'submission' 
  | 'contact' 
  | 'general';

export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  phone: string; // e.g. "+91 9876543210"
  category: RecipientCategory;
  sourceModule?: RecipientSourceModule;
  referenceCode?: string;
  isSubscribed?: boolean;
}

export interface SendNotificationPayload {
  recipients: NotificationRecipient[];
  channel: NotificationChannel;
  channels?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  subject?: string; // For Email
  message: string;
  contentReference?: {
    contentType: 'publication' | 'event' | 'research' | 'news' | 'general' | 'career' | 'registration';
    contentId?: string;
    contentTitle?: string;
  };
  templateId?: string;
  sourceModule?: RecipientSourceModule;
}

export interface NotificationLogRecipientItem {
  id: string;
  recipientId?: string;
  name: string;
  email: string;
  phone?: string;
  category?: string;
  sourceModule?: RecipientSourceModule;
  status: 'delivered' | 'simulated' | 'provider_pending' | 'failed' | 'blocked_unsubscribed';
  error?: string;
}

export interface NotificationLog {
  id: string;
  channel: NotificationChannel;
  channels?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  recipientCount: number;
  recipientSummary: string; // e.g., "Arjun Sharma + 4 others"
  subject?: string;
  messageSnippet: string;
  fullMessage?: string;
  sentAt: string;
  status: 'delivered' | 'queued' | 'simulated' | 'provider_pending' | 'failed';
  sourceModule?: RecipientSourceModule | string;
  templateId?: string;
  retryCount?: number;
  channelResponses?: {
    emailDelivered?: number;
    emailSimulated?: number;
    smsDelivered?: number;
    smsSimulated?: number;
    whatsappDelivered?: number;
    whatsappSimulated?: number;
    failed?: number;
  };
  recipientItems?: NotificationLogRecipientItem[];
}

export interface AggregatedRecipient {
  id: string;
  recordKey: string; // `${sourceModule}:${id}`
  sourceModule: RecipientSourceModule;
  sourceLabel: string;
  name: string;
  email: string;
  phone: string;
  referenceCode?: string;
  subtitle?: string;
  status: string;
  submittedAt: string;
  isSubscribed: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  notificationCount: number;
  lastContactedAt?: string;
  lastChannel?: NotificationChannel;
  lastStatus?: 'delivered' | 'simulated' | 'provider_pending' | 'failed';
}

export type PublishedContentType = 
  | 'publication' 
  | 'circular' 
  | 'event' 
  | 'live-event' 
  | 'research' 
  | 'news' 
  | 'podcast' 
  | 'magazine' 
  | 'centre' 
  | 'team';

export interface PublishedContentItem {
  id: string;
  title: string;
  contentType: PublishedContentType;
  contentTypeLabel: string;
  publicationDate: string;
  status: 'published';
  publicUrl: string;
  authorOrSpeaker?: string;
  summary?: string;
  notificationCount: number;
  lastNotifiedAt?: string;
}
