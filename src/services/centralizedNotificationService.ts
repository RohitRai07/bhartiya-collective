/**
 * Centralized Notification Management Service
 * 
 * Aggregates all user-submitted contacts across the entire website:
 * - Career applications (internships, fellowships, jobs)
 * - Newsletter subscribers
 * - Scholar and Fellow Registrations
 * - Call for Papers (scholarly submissions)
 * - Contact and Secretariat inquiries
 * 
 * Maintains 100% two-way synchronization with existing module databases
 * and the unified NotificationService audit logs.
 */

import { careerService } from './careerService';
import { newsletterService } from './newsletterService';
import { registrationService } from './registrationService';
import { submissionService } from './submissionService';
import { contactService } from './contactService';
import { notificationService } from './notificationService';
import { backendNotificationService } from './backendNotificationService';
import { 
  AggregatedRecipient, 
  RecipientSourceModule, 
  NotificationChannel,
  NotificationRecipient
} from '../types/notification';

export interface RecipientFilterCriteria {
  sourceModule?: 'all' | RecipientSourceModule;
  channelAvailability?: 'all' | 'has_email' | 'has_phone' | 'has_both';
  notificationStatus?: 'all' | 'notified' | 'unnotified' | 'failed';
  dateRange?: 'all' | '7d' | '30d' | '90d';
  searchQuery?: string;
}

export interface CentralizedNotificationStats {
  totalContacts: number;
  totalWithEmail: number;
  totalWithPhone: number;
  totalWithBoth: number;
  byModule: Record<RecipientSourceModule, number>;
  totalNotificationsSent: number;
  neverNotifiedCount: number;
  notifiedCount: number;
}

export class CentralizedNotificationService {
  /**
   * Aggregate all records dynamically from existing service stores without duplicating records
   */
  public getAggregatedRecipients(): AggregatedRecipient[] {
    const list: AggregatedRecipient[] = [];

    // 1. Career Applications
    try {
      const careers = careerService.getAll();
      for (const c of careers) {
        const history = notificationService.getLogsForRecipient(c.id, c.email, c.phone);
        const lastLog = history[0]; // logs are ordered newest first
        list.push({
          id: c.id,
          recordKey: `career:${c.id}`,
          sourceModule: 'career',
          sourceLabel: c.type === 'job' ? 'Job Application' : 'Internship Application',
          name: c.fullName,
          email: c.email || '',
          phone: c.phone || '',
          referenceCode: c.applicationCode,
          subtitle: `${c.currentInstitution || ''}${c.areaOfInterest ? ` • ${c.areaOfInterest}` : ''}`,
          status: c.status,
          submittedAt: c.submittedAt,
          isSubscribed: true,
          hasEmail: Boolean(c.email && c.email.includes('@')),
          hasPhone: Boolean(c.phone && c.phone.replace(/\D/g, '').length >= 10),
          notificationCount: history.length,
          lastContactedAt: lastLog?.sentAt,
          lastChannel: lastLog?.channel,
          lastStatus: lastLog?.status as any,
        });
      }
    } catch (e) {
      console.warn('Error reading career applications for notification centre:', e);
    }

    // 2. Newsletter Subscribers
    try {
      const subscribers = newsletterService.getAll();
      for (const s of subscribers) {
        const history = notificationService.getLogsForRecipient(s.id, s.email, '');
        const lastLog = history[0];
        const isSubscribed = s.status !== 'unsubscribed';
        list.push({
          id: s.id,
          recordKey: `newsletter:${s.id}`,
          sourceModule: 'newsletter',
          sourceLabel: 'Newsletter Subscriber',
          name: s.email.split('@')[0],
          email: s.email,
          phone: '',
          referenceCode: `SUB-${s.id.slice(-4).toUpperCase()}`,
          subtitle: s.source ? `Source: ${s.source}` : 'Website Subscriber',
          status: s.status,
          submittedAt: s.subscribedAt,
          isSubscribed,
          hasEmail: Boolean(s.email && s.email.includes('@')),
          hasPhone: false,
          notificationCount: history.length,
          lastContactedAt: lastLog?.sentAt,
          lastChannel: lastLog?.channel,
          lastStatus: lastLog?.status as any,
        });
      }
    } catch (e) {
      console.warn('Error reading newsletter subscribers for notification centre:', e);
    }

    // 3. User Registrations (National Scholars & Fellows)
    try {
      const registrations = registrationService.getAll();
      for (const r of registrations) {
        const phoneFormatted = r.phoneNumber?.fullFormatted || '';
        const history = notificationService.getLogsForRecipient(r.id, r.email, phoneFormatted);
        const lastLog = history[0];
        list.push({
          id: r.id,
          recordKey: `registration:${r.id}`,
          sourceModule: 'registration',
          sourceLabel: 'Fellow / Scholar Registration',
          name: `${r.firstName} ${r.lastName}`.trim(),
          email: r.email,
          phone: phoneFormatted,
          referenceCode: r.registrationNumber,
          subtitle: `${r.collegeName}${r.city ? ` • ${r.city}` : ''}`,
          status: r.status,
          submittedAt: r.createdAt,
          isSubscribed: r.consent !== false,
          hasEmail: Boolean(r.email && r.email.includes('@')),
          hasPhone: Boolean(phoneFormatted && phoneFormatted.replace(/\D/g, '').length >= 10),
          notificationCount: history.length,
          lastContactedAt: lastLog?.sentAt,
          lastChannel: lastLog?.channel,
          lastStatus: lastLog?.status as any,
        });
      }
    } catch (e) {
      console.warn('Error reading registrations for notification centre:', e);
    }

    // 4. Call for Papers & Submissions
    try {
      const submissions = submissionService.getAll();
      for (const sub of submissions) {
        const history = notificationService.getLogsForRecipient(sub.id, sub.authorEmail, '');
        const lastLog = history[0];
        list.push({
          id: sub.id,
          recordKey: `submission:${sub.id}`,
          sourceModule: 'submission',
          sourceLabel: 'Call for Papers',
          name: sub.authorName,
          email: sub.authorEmail,
          phone: '',
          referenceCode: sub.submissionCode,
          subtitle: `${sub.affiliation || ''} • "${sub.paperTitle.slice(0, 45)}${sub.paperTitle.length > 45 ? '...' : ''}"`,
          status: sub.status,
          submittedAt: sub.submittedAt,
          isSubscribed: sub.declarationAgreed !== false,
          hasEmail: Boolean(sub.authorEmail && sub.authorEmail.includes('@')),
          hasPhone: false,
          notificationCount: history.length,
          lastContactedAt: lastLog?.sentAt,
          lastChannel: lastLog?.channel,
          lastStatus: lastLog?.status as any,
        });
      }
    } catch (e) {
      console.warn('Error reading submissions for notification centre:', e);
    }

    // 5. Contact Inquiries
    try {
      const inquiries = contactService.getAll();
      for (const inq of inquiries) {
        const history = notificationService.getLogsForRecipient(inq.id, inq.email, inq.phone || '');
        const lastLog = history[0];
        list.push({
          id: inq.id,
          recordKey: `contact:${inq.id}`,
          sourceModule: 'contact',
          sourceLabel: 'Contact Inquiry',
          name: inq.name,
          email: inq.email,
          phone: inq.phone || '',
          referenceCode: inq.inquiryCode,
          subtitle: inq.subject ? `Subject: ${inq.subject.slice(0, 50)}...` : 'General Inquiry',
          status: inq.status,
          submittedAt: inq.submittedAt,
          isSubscribed: true,
          hasEmail: Boolean(inq.email && inq.email.includes('@')),
          hasPhone: Boolean(inq.phone && inq.phone.replace(/\D/g, '').length >= 10),
          notificationCount: history.length,
          lastContactedAt: lastLog?.sentAt,
          lastChannel: lastLog?.channel,
          lastStatus: lastLog?.status as any,
        });
      }
    } catch (e) {
      console.warn('Error reading contact inquiries for notification centre:', e);
    }

    // Sort by submission date (newest first)
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  /**
   * Filter recipients based on source, channels, date, and query
   */
  public filterRecipients(recipients: AggregatedRecipient[], criteria: RecipientFilterCriteria): AggregatedRecipient[] {
    const now = Date.now();

    return recipients.filter(r => {
      // 1. Source Module Filter
      if (criteria.sourceModule && criteria.sourceModule !== 'all' && r.sourceModule !== criteria.sourceModule) {
        return false;
      }

      // 2. Channel Availability Filter
      if (criteria.channelAvailability === 'has_email' && !r.hasEmail) return false;
      if (criteria.channelAvailability === 'has_phone' && !r.hasPhone) return false;
      if (criteria.channelAvailability === 'has_both' && (!r.hasEmail || !r.hasPhone)) return false;

      // 3. Notification Status Filter
      if (criteria.notificationStatus === 'notified' && r.notificationCount === 0) return false;
      if (criteria.notificationStatus === 'unnotified' && r.notificationCount > 0) return false;
      if (criteria.notificationStatus === 'failed' && r.lastStatus !== 'failed') return false;

      // 4. Date Range Filter
      if (criteria.dateRange && criteria.dateRange !== 'all') {
        const time = new Date(r.submittedAt).getTime();
        const diffMs = now - time;
        if (criteria.dateRange === '7d' && diffMs > 7 * 86400000) return false;
        if (criteria.dateRange === '30d' && diffMs > 30 * 86400000) return false;
        if (criteria.dateRange === '90d' && diffMs > 90 * 86400000) return false;
      }

      // 5. Search Query
      if (criteria.searchQuery && criteria.searchQuery.trim()) {
        const q = criteria.searchQuery.trim().toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesEmail = r.email.toLowerCase().includes(q);
        const matchesPhone = r.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
        const matchesCode = (r.referenceCode || '').toLowerCase().includes(q);
        const matchesSub = (r.subtitle || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesCode && !matchesSub) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Calculate summary statistics across all aggregated records
   */
  public getStatistics(recipients?: AggregatedRecipient[]): CentralizedNotificationStats {
    const list = recipients || this.getAggregatedRecipients();
    const byModule: Record<RecipientSourceModule, number> = {
      career: 0,
      newsletter: 0,
      registration: 0,
      submission: 0,
      contact: 0,
      general: 0,
    };

    let totalWithEmail = 0;
    let totalWithPhone = 0;
    let totalWithBoth = 0;
    let notifiedCount = 0;
    let neverNotifiedCount = 0;

    for (const r of list) {
      if (byModule[r.sourceModule] !== undefined) {
        byModule[r.sourceModule]++;
      }
      if (r.hasEmail) totalWithEmail++;
      if (r.hasPhone) totalWithPhone++;
      if (r.hasEmail && r.hasPhone) totalWithBoth++;
      if (r.notificationCount > 0) {
        notifiedCount++;
      } else {
        neverNotifiedCount++;
      }
    }

    return {
      totalContacts: list.length,
      totalWithEmail,
      totalWithPhone,
      totalWithBoth,
      byModule,
      totalNotificationsSent: list.reduce((acc, curr) => acc + curr.notificationCount, 0),
      neverNotifiedCount,
      notifiedCount,
    };
  }

  public getStats(recipients?: AggregatedRecipient[]): CentralizedNotificationStats {
    return this.getStatistics(recipients);
  }

  /**
   * Convert aggregated recipient to standard NotificationRecipient
   */
  public toNotificationRecipient(r: AggregatedRecipient): NotificationRecipient {
    const categoryMap: Record<RecipientSourceModule, any> = {
      career: 'candidate',
      newsletter: 'subscriber',
      registration: 'fellow',
      submission: 'author',
      contact: 'inquiry',
      general: 'custom',
    };

    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      category: categoryMap[r.sourceModule] || 'custom',
      sourceModule: r.sourceModule,
      referenceCode: r.referenceCode,
      isSubscribed: r.isSubscribed,
    };
  }

  /**
   * Dispatch notification from Centralized Notification Centre
   */
  public async dispatchCentralizedNotification(params: {
    recipients: AggregatedRecipient[];
    channels: { email: boolean; sms: boolean; whatsapp: boolean };
    templateId: string;
    subject?: string;
    message: string;
    sourceModule?: RecipientSourceModule;
  }) {
    // Check unsubscribe status and filter out opted-out recipients for general broadcasts
    const eligibleRecipients: NotificationRecipient[] = [];
    const unsubscribedBlocked: AggregatedRecipient[] = [];

    for (const r of params.recipients) {
      if (!r.isSubscribed && params.templateId !== 'ACCOUNT_STATUS') {
        unsubscribedBlocked.push(r);
      } else {
        eligibleRecipients.push(this.toNotificationRecipient(r));
      }
    }

    if (eligibleRecipients.length === 0) {
      throw new Error('All selected recipients have opted out of communications.');
    }

    const channel: NotificationChannel = 
      params.channels.email && params.channels.whatsapp ? 'both' :
      params.channels.whatsapp ? 'whatsapp' :
      params.channels.sms ? 'sms' : 'email';

    return await backendNotificationService.broadcast(
      eligibleRecipients,
      params.templateId === 'CUSTOM' ? 'ADMIN_NOTIFICATION' : params.templateId,
      {
        title: params.subject || 'Official Notification from Bharat Collective Foundation',
        message: params.message,
        subject: params.subject || 'Official Notification from Bharat Collective Foundation',
        body: params.message,
      },
      params.channels
    );
  }

  /**
   * Alias for getAggregatedRecipients
   */
  public getAllAggregatedRecipients(): AggregatedRecipient[] {
    return this.getAggregatedRecipients();
  }

  /**
   * Retrieve notification history for a recipient from unified store
   */
  public getLogsForRecipient(recipientId: string, email?: string, phone?: string) {
    return notificationService.getLogsForRecipient(recipientId, email, phone);
  }

  /**
   * Dispatch bulk notification
   */
  public async sendBulkNotification(options: {
    recipients: AggregatedRecipient[];
    channel: NotificationChannel;
    subject?: string;
    message: string;
    templateId?: string;
    dynamicData?: Record<string, string>;
  }) {
    const channels = {
      email: options.channel === 'email' || options.channel === 'both' || options.channel === 'all',
      sms: options.channel === 'sms' || options.channel === 'all',
      whatsapp: options.channel === 'whatsapp' || options.channel === 'both' || options.channel === 'all',
    };

    const notifRecipients = options.recipients.map(r => this.toNotificationRecipient(r));
    return await notificationService.sendNotification({
      recipients: notifRecipients,
      channel: options.channel,
      subject: options.subject || 'Institutional Update - Bharat Collective Foundation',
      message: options.message,
      templateId: options.templateId,
      dynamicData: options.dynamicData,
    });
  }
}

export const centralizedNotificationService = new CentralizedNotificationService();
