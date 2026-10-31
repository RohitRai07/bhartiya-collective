import { validateEmailAddress } from '../middleware/validation.middleware';
import { emailService } from './email.service';

export interface SubscriberRecord {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  source: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
  unsubscribedAt?: string;
}

export interface SubscribeInput {
  email: string;
  name?: string;
  phone?: string;
  source?: string;
}

export interface SubscribeResult {
  success: boolean;
  status: 'success' | 'already_subscribed' | 'invalid_email' | 'error';
  message: string;
  data?: SubscriberRecord;
  notificationSent?: boolean;
}

class NewsletterService {
  private subscribers: Map<string, SubscriberRecord> = new Map();

  constructor() {
    // Seed initial demo subscribers
    this.seedInitialSubscribers();
  }

  private seedInitialSubscribers(): void {
    const seeds: SubscriberRecord[] = [
      {
        id: 'sub-001',
        email: 'fellow.scholar@du.ac.in',
        source: 'website-footer',
        status: 'active',
        subscribedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      },
      {
        id: 'sub-002',
        email: 'research.fellow@iitm.ac.in',
        source: 'events-page',
        status: 'active',
        subscribedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'sub-003',
        email: 'library@bhu.ac.in',
        source: 'monographs-page',
        status: 'active',
        subscribedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    for (const s of seeds) {
      this.subscribers.set(s.email.toLowerCase(), s);
    }
  }

  /**
   * Subscribe an email to the newsletter.
   * 1. Validates email using robust pattern + disposable domain checks.
   * 2. Saves subscriber to database.
   * 3. Triggers internal admin notification to office@bharatcollective.in.
   * 4. Resilient: If notification email fails, subscription is still saved successfully.
   * 5. Prevents duplicate admin notifications on repeated submissions.
   */
  public async subscribe(input: SubscribeInput): Promise<SubscribeResult> {
    const rawEmail = (input.email || '').trim();

    // 1. Validate email format & reject disposable domains
    const val = validateEmailAddress(rawEmail);
    if (!val.isValid) {
      return {
        success: false,
        status: 'invalid_email',
        message: val.error || 'Please enter a valid email address.',
      };
    }

    const cleanEmail = val.formatted;
    const existing = this.subscribers.get(cleanEmail);

    // 2. Prevent duplicate notifications on already-subscribed email
    if (existing && existing.status === 'active') {
      return {
        success: true,
        status: 'already_subscribed',
        message: 'This email is already subscribed to the Bharat Collective digest.',
        data: existing,
        notificationSent: false,
      };
    }

    // 3. Save subscriber to database
    const newRecord: SubscriberRecord = {
      id: existing ? existing.id : `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      name: input.name?.trim(),
      phone: input.phone?.trim(),
      source: input.source?.trim() || 'website-footer',
      status: 'active',
      subscribedAt: new Date().toISOString(),
    };

    this.subscribers.set(cleanEmail, newRecord);

    // 4. Send internal notification email to office@bharatcollective.in
    let notificationSuccess = false;
    try {
      notificationSuccess = await emailService.sendNewsletterAdminNotification({
        email: newRecord.email,
        name: newRecord.name,
        phone: newRecord.phone,
        source: newRecord.source,
        subscribedAt: newRecord.subscribedAt,
      });

      if (!notificationSuccess) {
        console.warn(
          `[Newsletter Alert Warning] Internal admin notification could not be dispatched for new subscriber: ${cleanEmail}. Subscription was saved successfully.`
        );
      }
    } catch (notifyErr) {
      // Email failure must not prevent or reverse a successful subscription
      console.error('[Newsletter Alert Error] Unexpected failure sending admin notification:', notifyErr);
      notificationSuccess = false;
    }

    return {
      success: true,
      status: 'success',
      message: 'Thank you for subscribing to Bharat Collective Research Digest.',
      data: newRecord,
      notificationSent: notificationSuccess,
    };
  }

  /**
   * Unsubscribe an email
   */
  public unsubscribe(email: string): { success: boolean; message: string } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const existing = this.subscribers.get(cleanEmail);

    if (existing) {
      existing.status = 'unsubscribed';
      existing.unsubscribedAt = new Date().toISOString();
      this.subscribers.set(cleanEmail, existing);
    }

    return {
      success: true,
      message: 'You have been unsubscribed from the Bharat Collective mailing list.',
    };
  }

  /**
   * Retrieve all subscribers (for Admin Portal)
   */
  public getAllSubscribers(): SubscriberRecord[] {
    return Array.from(this.subscribers.values());
  }

  /**
   * Count active subscribers
   */
  public getActiveCount(): number {
    return Array.from(this.subscribers.values()).filter(s => s.status === 'active').length;
  }
}

export const newsletterService = new NewsletterService();
