import { emailService } from './email.service';
import { smsService } from './sms.service';
import { whatsappService } from './whatsapp.service';

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

export interface BroadcastParams {
  subscribers: Array<{
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    sourceModule?: string;
    category?: string;
  }>;
  type: string;
  dynamicData: Record<string, string>;
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  batchId?: string;
}

export class NotificationService {

  // Central Template Repository
  public getTemplate(type: string, data: Record<string, string>) {
    const defaultName = data.name || 'Candidate';
    const contact = data.contact_person || 'HR Department';

    const templates: Record<string, { subject: string; email: string; sms: string }> = {
      // Admin Custom Messaging
      'ADMIN_NOTIFICATION': {
        subject: data.title || data.subject || 'Official Update from Bharat Collective Foundation',
        email: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="border-bottom: 2px solid #781717; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #781717; margin: 0; font-family: Georgia, serif;">Bharat Collective Foundation</h2>
              <span style="color: #92400e; font-size: 11px; text-transform: uppercase; font-weight: 700;">Secretariat Official Notice</span>
            </div>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">Namaste,</p>
            <div style="color: #1e293b; font-size: 14px; line-height: 1.6; margin: 16px 0;">
              ${(data.message || data.body || '').replace(/\n/g, '<br/>')}
            </div>
            <p style="color: #475569; font-size: 13px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
              Warm regards,<br/>
              <strong>Administrative Secretariat</strong><br/>
              Bharat Collective Foundation • <a href="mailto:office@bharatcollective.in" style="color: #991b1b;">office@bharatcollective.in</a>
            </p>
          </div>
        `,
        sms: `Bharat Collective: ${data.message || data.body || ''}`
      },

      // Career Automations
      'CAREER_SHORTLISTED': {
        subject: `Congratulations ${defaultName}, You Have Been Shortlisted`,
        email: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #781717; margin-top: 0;">Namaste ${defaultName},</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              We are pleased to inform you that your application for <strong>${data.job_title || 'a position'}</strong> (App ID: ${data.application_id || 'N/A'}) has been shortlisted by the <strong>Bharat Collective Foundation</strong>.
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Please connect with <strong>${contact}</strong> at <a href="mailto:office@bharatcollective.in" style="color: #991b1b;">office@bharatcollective.in</a> for the next steps.
            </p>
            <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
              Warm regards,<br/>
              <strong>Careers & Fellowship Committee</strong><br/>
              Bharat Collective Foundation
            </p>
          </div>
        `,
        sms: `Namaste ${defaultName}, you have been shortlisted for ${data.job_title || 'a position'} by Bharat Collective. Contact ${contact} for next steps.`
      },
      'CAREER_REJECTED': {
        subject: `Update on Your Application - Bharat Collective Foundation`,
        email: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #334155; margin-top: 0;">Namaste ${defaultName},</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Thank you for applying for the <strong>${data.job_title || 'position'}</strong>.
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              We appreciate your interest in the Bharat Collective Foundation and wish you the best in your future endeavors.
            </p>
            <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
              Warm regards,<br/>
              <strong>Careers Team</strong><br/>
              Bharat Collective Foundation
            </p>
          </div>
        `,
        sms: `Namaste ${defaultName}, thank you for your application to Bharat Collective. Unfortunately, we are not moving forward at this time.`
      },
      'CAREER_SELECTED': {
        subject: `Congratulations! Offer of Selection - Bharat Collective Foundation`,
        email: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #166534; margin-top: 0;">Congratulations ${defaultName}!</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              We are thrilled to inform you that you have been <strong>selected</strong> for the <strong>${data.job_title || 'position'}</strong>!
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Our team will reach out to you shortly with the official offer letter and onboarding details.
            </p>
            <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
              Warm regards,<br/>
              <strong>Careers Team</strong><br/>
              Bharat Collective Foundation
            </p>
          </div>
        `,
        sms: `Congratulations ${defaultName}! You have been selected for the ${data.job_title || 'position'} at Bharat Collective. We will email you the details shortly.`
      },
      'CAREER_UNDER_REVIEW': {
        subject: `Your Application is Under Review - Bharat Collective Foundation`,
        email: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0;">Namaste ${defaultName},</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Your application for <strong>${data.job_title || 'the position'}</strong> is now under active review by our academic panel.
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              We will notify you as soon as a decision is reached.
            </p>
            <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
              Warm regards,<br/>
              <strong>Careers Team</strong><br/>
              Bharat Collective Foundation
            </p>
          </div>
        `,
        sms: `Namaste ${defaultName}, your application for ${data.job_title || 'the position'} is currently under review by Bharat Collective.`
      },
      'CAREER_INTERVIEW_SCHEDULED': {
        subject: `Interview Scheduled - Bharat Collective Foundation`,
        email: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0;">Namaste ${defaultName},</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              We are pleased to invite you to an interview for the <strong>${data.job_title || 'position'}</strong>.
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Our coordinator <strong>${contact}</strong> will reach out to finalize the time and mode of the session.
            </p>
            <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
              Warm regards,<br/>
              <strong>Careers Team</strong><br/>
              Bharat Collective Foundation
            </p>
          </div>
        `,
        sms: `Namaste ${defaultName}, you have been invited for an interview at Bharat Collective for ${data.job_title || 'the position'}. Our team will contact you.`
      },

      // Payment Confirmation
      'PAYMENT_CONFIRMATION': {
        subject: `Payment Confirmation: ₹${data.amount || '0'} Received - Bharat Collective`,
        email: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #781717; margin-top: 0;">Namaste ${defaultName},</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              We gratefully acknowledge receipt of your contribution of <strong>₹${data.amount || '0'}</strong> (Payment ID: <strong>${data.payment_id || 'N/A'}</strong>) towards ${data.purpose || 'Bharat Collective Foundation'}.
            </p>
            <p style="color: #64748b; font-size: 13px;">Order Reference: ${data.order_id || 'N/A'}</p>
            <p style="color: #475569; font-size: 13px; margin-top: 24px;">
              Warm regards,<br/>
              <strong>Patron Secretariat</strong><br/>
              The Bharat Collective Foundation
            </p>
          </div>
        `,
        sms: `Namaste ${defaultName}, payment of Rs.${data.amount || '0'} to Bharat Collective (Ref: ${data.payment_id || ''}) received successfully. Thank you!`
      }
    };

    // Dynamic publish event (PUBLISH_EVENT, PUBLISH_PUBLICATION, etc.)
    if (type.startsWith('PUBLISH_')) {
      const contentType = type.replace('PUBLISH_', '').toLowerCase();
      return {
        subject: `New ${contentType.toUpperCase()} Published: ${data.title || 'Official Update'}`,
        email: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="border-bottom: 2px solid #781717; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #781717; margin: 0;">Bharat Collective Foundation</h2>
              <span style="color: #92400e; font-size: 11px; text-transform: uppercase; font-weight: 700;">Research • Policy • Civilisation</span>
            </div>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello Subscriber,</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              A new ${contentType} has just been released on the official Bharat Collective portal:
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #781717; padding: 14px 18px; margin: 20px 0;">
              <h3 style="margin: 0; color: #0f172a; font-size: 16px;">${data.title}</h3>
              ${data.summary ? `<p style="margin: 8px 0 0 0; color: #475569; font-size: 13px;">${data.summary}</p>` : ''}
            </div>
            ${data.url ? `<p><a href="${data.url}" style="display: inline-block; padding: 10px 18px; background: #781717; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">View on Website</a></p>` : ''}
            <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
              You received this email because you are a registered subscriber of the Bharat Collective Foundation.
            </p>
          </div>
        `,
        sms: `New ${contentType} published on Bharat Collective: ${data.title}. ${data.url ? 'Read more: ' + data.url : ''}`
      };
    }

    return templates[type] || templates['ADMIN_NOTIFICATION'] || { subject: '', email: '', sms: '' };
  }
  
  /**
   * Dispatch single notification asynchronously
   */
  public async dispatchNotification(payload: NotificationPayload) {
    this.processNotification(payload).catch(err => {
      console.error('Unhandled error in background notification processor:', err);
    });

    return { status: 'QUEUED', trackingId: `notif_${Date.now()}` };
  }

  /**
   * Process single notification across active channels
   */
  public async processNotification(payload: NotificationPayload) {
    const results = { email: false, sms: false, whatsapp: false };
    const template = this.getTemplate(payload.type, payload.dynamicData);
    const category = payload.dynamicData?.sourceModule || 'admin_notification';

    // 1. Process Email
    if (payload.channels.email && payload.email) {
      results.email = await emailService.sendEmail({
        to: payload.email,
        recipientName: payload.name,
        subject: template.subject,
        html: template.email,
        category,
      });
    }

    // 2. Process SMS
    if (payload.channels.sms && payload.phone) {
      results.sms = await smsService.sendSMS({
        to: payload.phone,
        message: template.sms
      });
    }

    // 3. Process WhatsApp
    if (payload.channels.whatsapp && payload.phone) {
      results.whatsapp = await whatsappService.sendWhatsApp({
        to: payload.phone,
        message: template.sms
      });
    }

    console.log(`Notification Processed [${payload.type}] for ${payload.email || payload.phone}:`, results);
    return results;
  }

  /**
   * Broadcast notification to multiple subscribers with deduplication, individual delivery, and safe batching
   */
  public async broadcastNotification(params: BroadcastParams): Promise<{
    total: number;
    sent: number;
    failed: number;
    batchId: string;
  }> {
    const { subscribers, type, dynamicData, channels, batchId } = params;
    const trackingId = batchId || `batch_${Date.now()}`;

    // 1. Deduplicate subscribers by email and phone
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();
    const emailRecipients: Array<{ email: string; name?: string; id?: string }> = [];
    const phoneRecipients: Array<{ phone: string; name?: string; id?: string }> = [];

    for (const sub of subscribers) {
      const email = (sub.email || '').trim().toLowerCase();
      const phone = (sub.phone || '').trim().replace(/\D/g, '');

      if (channels.email && email && !seenEmails.has(email)) {
        seenEmails.add(email);
        emailRecipients.push({ email, name: sub.name, id: sub.id });
      }

      if ((channels.sms || channels.whatsapp) && phone && phone.length >= 10 && !seenPhones.has(phone)) {
        seenPhones.add(phone);
        phoneRecipients.push({ phone: sub.phone || phone, name: sub.name, id: sub.id });
      }
    }

    const template = this.getTemplate(type, dynamicData);
    let sentCount = 0;
    let failedCount = 0;

    // 2. Process Email Broadcast via emailService.sendBatchEmails
    if (channels.email && emailRecipients.length > 0) {
      const emailBatchResult = await emailService.sendBatchEmails(
        emailRecipients,
        template.subject,
        template.email,
        undefined,
        dynamicData.sourceModule || 'admin_broadcast'
      );
      sentCount += emailBatchResult.sent;
      failedCount += emailBatchResult.failed;
    }

    // 3. Process SMS Broadcast
    if (channels.sms && phoneRecipients.length > 0) {
      for (const p of phoneRecipients) {
        const ok = await smsService.sendSMS({ to: p.phone, message: template.sms });
        if (ok) sentCount++; else failedCount++;
      }
    }

    // 4. Process WhatsApp Broadcast
    if (channels.whatsapp && phoneRecipients.length > 0) {
      for (const p of phoneRecipients) {
        const ok = await whatsappService.sendWhatsApp({ to: p.phone, message: template.sms });
        if (ok) sentCount++; else failedCount++;
      }
    }

    return {
      total: Math.max(emailRecipients.length, phoneRecipients.length),
      sent: sentCount,
      failed: failedCount,
      batchId: trackingId,
    };
  }
}

export const notificationService = new NotificationService();
