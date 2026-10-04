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

export class NotificationService {

  // Central Template Repository
  private getTemplate(type: string, data: Record<string, string>) {
    const defaultName = data.name || 'Candidate';
    const contact = data.contact_person || 'HR Department';

    const templates: Record<string, { subject: string, email: string, sms: string }> = {
      // Admin Custom Messaging
      'ADMIN_NOTIFICATION': {
        subject: data.title || 'Official Update from Bharat Collective Foundation',
        email: `
          <h2>Namaste,</h2>
          <p>${(data.message || '').replace(/\\n/g, '<br/>')}</p>
          <br/><p>Warm regards,<br/>Bharat Collective Secretariat</p>
        `,
        sms: `Bharat Collective: ${data.message}`
      },

      // Career Automations
      'CAREER_SHORTLISTED': {
        subject: `Congratulations ${defaultName}, You Have Been Shortlisted`,
        email: `
          <h2>Namaste ${defaultName},</h2>
          <p>We are pleased to inform you that your application for <strong>${data.job_title || 'a position'}</strong> (App ID: ${data.application_id || 'N/A'}) has been shortlisted by the Bharat Collective Foundation.</p>
          <p>Please connect with <strong>${contact}</strong> at ${data.contact_email || 'careers@bharatcollective.org'} for the next steps.</p>
          <br/><p>Warm regards,<br/>Careers Team<br/>Bharat Collective Foundation</p>
        `,
        sms: `Namaste ${defaultName}, you have been shortlisted for ${data.job_title || 'a position'} by Bharat Collective. Contact ${contact} for next steps.`
      },
      'CAREER_REJECTED': {
        subject: `Update on Your Application - Bharat Collective Foundation`,
        email: `
          <h2>Namaste ${defaultName},</h2>
          <p>Thank you for applying for the <strong>${data.job_title || 'position'}</strong>.</p>
          <p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
          <p>We appreciate your interest in the Bharat Collective Foundation and wish you the best in your future endeavors.</p>
          <br/><p>Warm regards,<br/>Careers Team</p>
        `,
        sms: `Namaste ${defaultName}, thank you for your application to Bharat Collective. Unfortunately, we are not moving forward at this time.`
      },
      'CAREER_SELECTED': {
        subject: `Congratulations! Offer of Selection - Bharat Collective Foundation`,
        email: `
          <h2>Namaste ${defaultName},</h2>
          <p>We are thrilled to inform you that you have been <strong>selected</strong> for the <strong>${data.job_title || 'position'}</strong>!</p>
          <p>Our team will reach out to you shortly with the official offer letter and onboarding details.</p>
          <br/><p>Warm regards,<br/>Careers Team<br/>Bharat Collective Foundation</p>
        `,
        sms: `Congratulations ${defaultName}! You have been selected for the ${data.job_title || 'position'} at Bharat Collective. We will email you the details shortly.`
      },
      'CAREER_UNDER_REVIEW': {
        subject: `Your Application is Under Review - Bharat Collective Foundation`,
        email: `
          <h2>Namaste ${defaultName},</h2>
          <p>Your application for <strong>${data.job_title || 'the position'}</strong> is now under active review by our panel.</p>
          <p>We will notify you as soon as a decision is made.</p>
          <br/><p>Warm regards,<br/>Careers Team</p>
        `,
        sms: `Namaste ${defaultName}, your application for ${data.job_title || 'the position'} is currently under review by Bharat Collective.`
      },
      'CAREER_INTERVIEW_SCHEDULED': {
        subject: `Interview Scheduled - Bharat Collective Foundation`,
        email: `
          <h2>Namaste ${defaultName},</h2>
          <p>We are pleased to invite you to an interview for the <strong>${data.job_title || 'position'}</strong>.</p>
          <p>Our coordinator <strong>${contact}</strong> will reach out to finalize the time and mode of interview.</p>
          <br/><p>Warm regards,<br/>Careers Team</p>
        `,
        sms: `Namaste ${defaultName}, you have been invited for an interview at Bharat Collective for ${data.job_title || 'the position'}. Our team will contact you.`
      }
    };

    // If it's a dynamic publish event (PUBLISH_EVENT, PUBLISH_ARTICLE, etc.)
    if (type.startsWith('PUBLISH_')) {
      const contentType = type.replace('PUBLISH_', '').toLowerCase();
      return {
        subject: `New ${contentType.toUpperCase()} Published: ${data.title}`,
        email: `
          <h2>Hello Subscriber,</h2>
          <p>A new ${contentType} has just been published on Bharat Collective.</p>
          <h3>${data.title}</h3>
          ${data.url ? `<p><a href="${data.url}" style="padding: 10px 15px; background: #d97706; color: white; text-decoration: none; border-radius: 5px;">Read More</a></p>` : ''}
          <br/><p>Thank you for staying connected with us.</p>
        `,
        sms: `New ${contentType} published on Bharat Collective: ${data.title}. ${data.url ? 'Read more: ' + data.url : ''}`
      };
    }

    return templates[type] || templates['ADMIN_NOTIFICATION'] || { subject: '', email: '', sms: '' };
  }
  
  public async dispatchNotification(payload: NotificationPayload) {
    this.processNotification(payload).catch(err => {
      console.error('Unhandled error in background notification processor:', err);
    });

    return { status: 'QUEUED', trackingId: `notif_${Date.now()}` };
  }

  private async processNotification(payload: NotificationPayload) {
    const results = { email: false, sms: false, whatsapp: false };
    const template = this.getTemplate(payload.type, payload.dynamicData);

    // 1. Process Email
    if (payload.channels.email && payload.email) {
      results.email = await emailService.sendEmail({
        to: payload.email,
        subject: template.subject,
        html: template.email
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
        message: template.sms // Usually WhatsApp templates match SMS closely or require pre-approved templates
      });
    }

    console.log(`Notification Processed [${payload.type}] for ${payload.email || payload.phone}:`, results);
  }
}

export const notificationService = new NotificationService();
