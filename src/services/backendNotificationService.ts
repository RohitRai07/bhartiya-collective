import { apiClient } from './apiClient';
import { notificationService } from './notificationService';

export interface NotificationPayload {
  userId: string;
  name: string;
  phone: string;
  email: string;
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
  public async sendNotification(payload: NotificationPayload) {
    try {
      const response = await apiClient.post<any>('/notification/send', payload);
      if (response && response.success) {
        return response.data;
      }
    } catch (e) {
      console.warn('Backend unavailable, recording notification locally:', e);
    }

    // Local fallback
    const channel = payload.channels.email && payload.channels.whatsapp 
      ? 'both' 
      : (payload.channels.whatsapp ? 'whatsapp' : 'email');

    return await notificationService.sendNotification({
      recipients: [{
        id: payload.userId || 'rec-1',
        name: payload.name || 'Recipient',
        email: payload.email || '',
        phone: payload.phone || '',
        category: 'candidate'
      }],
      channel,
      subject: payload.dynamicData.subject || payload.dynamicData.title || `Notification from Bharat Collective: ${payload.type}`,
      message: payload.dynamicData.body || payload.dynamicData.message || `Namaste, this is an official update regarding ${payload.type}.`
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
        return response.data;
      }
    } catch (e) {
      console.warn('Backend broadcast unavailable, logging locally:', e);
    }

    // Local fallback
    const channel = channels.email && channels.whatsapp 
      ? 'both' 
      : (channels.whatsapp ? 'whatsapp' : 'email');

    const recipients = subscribers.map((s, idx) => ({
      id: s.id || `rec-${idx}`,
      name: s.name || s.email?.split('@')[0] || 'Subscriber',
      email: s.email || '',
      phone: s.phone || '',
      category: (s.category || 'subscriber') as any
    }));

    if (recipients.length > 0) {
      return await notificationService.sendNotification({
        recipients,
        channel,
        subject: dynamicData.title || dynamicData.subject || `Official Update: ${type.replace(/_/g, ' ')}`,
        message: dynamicData.message || dynamicData.body || `Namaste,\n\nThis is an official communication regarding ${type.replace(/_/g, ' ')}.\n\nWarm regards,\nBharat Collective Foundation`
      });
    }

    return { success: true };
  }
}

export const backendNotificationService = new BackendNotificationService();
