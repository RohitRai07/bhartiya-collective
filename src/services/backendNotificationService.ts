import { apiClient } from './apiClient';
import { notificationService } from './notificationService';
import { NotificationChannel, RecipientSourceModule } from '../types/notification';

export interface NotificationPayload {
  userId?: string;
  name?: string;
  phone?: string;
  email?: string;
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  type: string;
  dynamicData: Record<string, string>;
}

export class BackendNotificationService {
  /**
   * Send a single notification via the backend (with graceful local fallback)
   */
  public async sendNotification(
    payloadOrRecipient: NotificationPayload | any,
    typeArg?: string,
    dynamicDataArg?: Record<string, string>,
    channelArg?: NotificationChannel
  ) {
    let payload: NotificationPayload;

    if (typeArg !== undefined || dynamicDataArg !== undefined || channelArg !== undefined) {
      // Positional call: (recipient, type, dynamicData, channel)
      const recipient = payloadOrRecipient || {};
      const ch = channelArg || 'all';
      payload = {
        userId: recipient.id || recipient.userId,
        name: recipient.name,
        email: recipient.email,
        phone: recipient.phone,
        channels: {
          email: ch === 'all' || ch === 'both' || ch === 'email',
          sms: ch === 'all' || ch === 'sms',
          whatsapp: ch === 'all' || ch === 'both' || ch === 'whatsapp',
        },
        type: typeArg || 'ADMIN_NOTIFICATION',
        dynamicData: {
          ...dynamicDataArg,
          sourceModule: recipient.sourceModule || dynamicDataArg?.sourceModule || 'general',
          referenceCode: recipient.referenceCode || dynamicDataArg?.referenceCode || recipient.id,
          category: recipient.category || dynamicDataArg?.category,
        },
      };
    } else {
      payload = {
        ...payloadOrRecipient,
        channels: payloadOrRecipient.channels || {
          email: true,
          sms: false,
          whatsapp: true,
        },
        dynamicData: payloadOrRecipient.dynamicData || {},
      };
    }

    try {
      const response = await apiClient.post<any>('/notification/send', payload);
      if (response && response.success) {
        return response.data;
      }
    } catch (e) {
      console.warn('Backend unavailable, recording notification locally:', e);
    }

    // Local fallback
    const channel: NotificationChannel = 
      payload.channels?.email && payload.channels?.whatsapp && payload.channels?.sms ? 'all' :
      payload.channels?.email && payload.channels?.whatsapp ? 'both' :
      payload.channels?.whatsapp ? 'whatsapp' :
      payload.channels?.sms ? 'sms' : 'email';

    const sourceModule = (payload.dynamicData?.sourceModule as RecipientSourceModule) || 'general';

    return await notificationService.sendNotification({
      recipients: [{
        id: payload.userId || `rec-${Date.now()}`,
        name: payload.name || 'Recipient',
        email: payload.email || '',
        phone: payload.phone || '',
        category: (payload.dynamicData?.category as any) || 'candidate',
        sourceModule,
        referenceCode: payload.dynamicData?.application_id || payload.dynamicData?.referenceCode,
      }],
      channel,
      channels: payload.channels,
      templateId: payload.type,
      sourceModule,
      subject: payload.dynamicData?.subject || payload.dynamicData?.title || `Notification from Bharat Collective: ${payload.type}`,
      message: payload.dynamicData?.body || payload.dynamicData?.message || `Namaste, this is an official update regarding ${payload.type}.`
    });
  }

  /**
   * Broadcast notification to multiple subscribers (with graceful local fallback)
   */
  public async broadcast(subscribers: any[], type: string, dynamicData: Record<string, string>, channels: { email: boolean, sms: boolean, whatsapp: boolean }) {
    try {
      const response = await apiClient.post<any>('/notification/broadcast', {
        subscribers,
        type,
        dynamicData,
        channels
      });
      if (response && response.success) {
        // Synchronize local audit log
        const channel: NotificationChannel = 
          channels.email && channels.whatsapp && channels.sms ? 'all' :
          channels.email && channels.whatsapp ? 'both' :
          channels.whatsapp ? 'whatsapp' :
          channels.sms ? 'sms' : 'email';
        const sourceModule = (dynamicData.sourceModule as RecipientSourceModule) || subscribers[0]?.sourceModule || 'general';
        const recipients = subscribers.map((s, idx) => ({
          id: s.id || `rec-${idx}`,
          name: s.name || s.email?.split('@')[0] || 'Subscriber',
          email: s.email || '',
          phone: s.phone || '',
          category: (s.category || 'subscriber') as any,
          sourceModule: s.sourceModule || sourceModule,
          isSubscribed: s.isSubscribed,
          referenceCode: s.referenceCode,
        }));
        if (recipients.length > 0) {
          notificationService.sendNotification({
            recipients,
            channel,
            channels,
            sourceModule,
            templateId: type,
            subject: dynamicData.title || dynamicData.subject || `Official Update: ${type.replace(/_/g, ' ')}`,
            message: dynamicData.message || dynamicData.body || `Namaste,\n\nThis is an official communication regarding ${type.replace(/_/g, ' ')}.\n\nWarm regards,\nBharat Collective Foundation`
          }).catch(() => {});
        }
        return response.data;
      }
    } catch (e) {
      console.warn('Backend broadcast unavailable, logging locally:', e);
    }

    // Local fallback
    const channel: NotificationChannel = 
      channels.email && channels.whatsapp && channels.sms ? 'all' :
      channels.email && channels.whatsapp ? 'both' :
      channels.whatsapp ? 'whatsapp' :
      channels.sms ? 'sms' : 'email';

    const sourceModule = (dynamicData.sourceModule as RecipientSourceModule) || subscribers[0]?.sourceModule || 'general';

    const recipients = subscribers.map((s, idx) => ({
      id: s.id || `rec-${idx}`,
      name: s.name || s.email?.split('@')[0] || 'Subscriber',
      email: s.email || '',
      phone: s.phone || '',
      category: (s.category || 'subscriber') as any,
      sourceModule: s.sourceModule || sourceModule,
      isSubscribed: s.isSubscribed,
      referenceCode: s.referenceCode,
    }));

    if (recipients.length > 0) {
      return await notificationService.sendNotification({
        recipients,
        channel,
        channels,
        sourceModule,
        templateId: type,
        subject: dynamicData.title || dynamicData.subject || `Official Update: ${type.replace(/_/g, ' ')}`,
        message: dynamicData.message || dynamicData.body || `Namaste,\n\nThis is an official communication regarding ${type.replace(/_/g, ' ')}.\n\nWarm regards,\nBharat Collective Foundation`
      });
    }

    return { success: true };
  }
}

export const backendNotificationService = new BackendNotificationService();
