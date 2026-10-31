import { validateEmailAddress } from './contactValidation';
/**
 * Newsletter Service for Bharat Collective Foundation
 * 
 * Manages newsletter subscription, duplicate checks, confirmation notifications,
 * and admin subscriber listing.
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { NewsletterSubscriptionInput, NewsletterSubscriptionRecord } from '../types/newsletter';
import { notificationService } from './notificationService';

const STORAGE_KEY = 'bharat_collective_newsletter_subscribers';

const initialSubscribers: NewsletterSubscriptionRecord[] = [
  {
    id: 'sub-001',
    email: 'fellow.scholar@du.ac.in',
    status: 'active',
    subscribedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    source: 'website-footer',
  },
  {
    id: 'sub-002',
    email: 'research.fellow@iitm.ac.in',
    status: 'active',
    subscribedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    source: 'events-page',
  },
  {
    id: 'sub-003',
    email: 'library@bhu.ac.in',
    status: 'active',
    subscribedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    source: 'monographs-page',
  }
];

let inMemorySubscribers: NewsletterSubscriptionRecord[] = [...initialSubscribers];

function loadStoredSubscribers(): NewsletterSubscriptionRecord[] {
  if (typeof window === 'undefined') return inMemorySubscribers;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSubscribers));
      return initialSubscribers;
    }
    return JSON.parse(raw);
  } catch {
    return inMemorySubscribers;
  }
}

function saveSubscribers(list: NewsletterSubscriptionRecord[]) {
  inMemorySubscribers = [...list];
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save subscribers:', e);
  }
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export type SubscribeResult = 
  | { status: 'success'; message: string; record?: NewsletterSubscriptionRecord }
  | { status: 'already_subscribed'; message: string }
  | { status: 'error'; message: string };

export const newsletterService = {
  inFlightSubscriptions: new Set<string>(),

  /**
   * Validate email address syntax
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    const val = validateEmailAddress(email);
    if (!val.isValid) {
      return { isValid: false, error: val.error || 'Please enter a valid email address.' };
    }
    return { isValid: true };
  },

  /**
   * Subscribe an email to the collective digest
   */
  async subscribe(input: NewsletterSubscriptionInput): Promise<SubscribeResult> {
    const cleanEmail = (input.email || '').trim().toLowerCase();

    // 1. Client-side input validation
    const validation = this.validateEmail(cleanEmail);
    if (!validation.isValid) {
      return { status: 'error', message: validation.error || 'Invalid email address.' };
    }

    // Prevent duplicate in-flight submissions (accidental multiple clicks)
    if (this.inFlightSubscriptions.has(cleanEmail)) {
      return {
        status: 'success',
        message: 'Your subscription is currently being processed.',
      };
    }
    this.inFlightSubscriptions.add(cleanEmail);

    try {
      // 2. Send via Backend API so GoDaddy Titan internal notification is dispatched to office@bharatcollective.in
      try {
        const response = await apiClient.post<any>(
          apiConfig.endpoints.newsletter.subscribe,
          { email: cleanEmail, source: input.source || 'website-footer' }
        );

        if (response && response.success) {
          if (response.data?.status === 'already_subscribed' || (response as any).status === 'already_subscribed') {
            return {
              status: 'already_subscribed',
              message: 'This email is already subscribed to the Bharat Collective digest.',
            };
          }

          const record: NewsletterSubscriptionRecord = response.data?.data || response.data || {
            id: `sub-${Date.now()}`,
            email: cleanEmail,
            status: 'active',
            subscribedAt: new Date().toISOString(),
            source: input.source || 'website-footer',
          };

          // Synchronize local storage
          const subscribers = loadStoredSubscribers();
          const updated = [record, ...subscribers.filter(s => s.email.toLowerCase() !== cleanEmail)];
          saveSubscribers(updated);

          // Confirmation email to subscriber
          notificationService.sendNewsletterConfirmation(cleanEmail).catch(console.error);

          return {
            status: 'success',
            message: response.message || 'Thank you for subscribing! A confirmation notification has been sent to your email.',
            record,
          };
        }
      } catch (backendErr: any) {
        if (backendErr.statusCode === 409 || backendErr.message?.includes('already')) {
          return {
            status: 'already_subscribed',
            message: 'This email is already subscribed to the Bharat Collective digest.',
          };
        }
        if (backendErr.statusCode === 400 && backendErr.message) {
          return {
            status: 'error',
            message: backendErr.message,
          };
        }
        console.warn('Backend subscription endpoint unavailable, processing locally:', backendErr);
      }

      // 3. Local storage fallback
      await new Promise(resolve => setTimeout(resolve, 200));
      const subscribers = loadStoredSubscribers();

      const existing = subscribers.find(s => s.email.toLowerCase() === cleanEmail);
      if (existing && existing.status === 'active') {
        return {
          status: 'already_subscribed',
          message: 'This email is already subscribed to the Bharat Collective digest.',
        };
      }

      const record: NewsletterSubscriptionRecord = {
        id: `sub-${Date.now()}`,
        email: cleanEmail,
        status: 'active',
        subscribedAt: new Date().toISOString(),
        source: input.source || 'website-footer',
      };

      const updated = [record, ...subscribers.filter(s => s.email.toLowerCase() !== cleanEmail)];
      saveSubscribers(updated);

      // Confirmation email to subscriber
      notificationService.sendNewsletterConfirmation(cleanEmail).catch(console.error);

      return {
        status: 'success',
        message: 'Thank you for subscribing! A confirmation notification has been sent to your email.',
        record,
      };
    } finally {
      this.inFlightSubscriptions.delete(cleanEmail);
    }
  },

  /**
   * Unsubscribe readiness for future preference management
   */
  async unsubscribe(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!apiConfig.useMockData) {
      const response = await apiClient.post<{ message: string }>(
        apiConfig.endpoints.newsletter.unsubscribe,
        { email: cleanEmail }
      );
      return { success: true, message: response.message || 'Successfully unsubscribed.' };
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    const subscribers = loadStoredSubscribers();
    const updated = subscribers.map(s => s.email.toLowerCase() === cleanEmail ? { ...s, status: 'unsubscribed' as const, unsubscribedAt: new Date().toISOString() } : s);
    saveSubscribers(updated);

    return {
      success: true,
      message: 'You have been unsubscribed from the Bharat Collective mailing list.',
    };
  },

  /**
   * Admin: Query list of all subscribers (synchronous accessor)
   */
  getSubscribers(): NewsletterSubscriptionRecord[] {
    return loadStoredSubscribers();
  },

  getAll(): NewsletterSubscriptionRecord[] {
    return loadStoredSubscribers();
  },

  /**
   * Admin: Query list of all subscribers (async accessor)
   */
  async getSubscribersList(): Promise<NewsletterSubscriptionRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 80));
    return loadStoredSubscribers();
  },

  /**
   * Admin: Add subscriber manually
   */
  async addSubscriberManually(email: string, source: string = 'admin-manual'): Promise<NewsletterSubscriptionRecord> {
    const res = await this.subscribe({ email, source });
    if (res.status === 'error') throw new Error(res.message);
    if (res.status === 'already_subscribed') throw new Error('Email is already subscribed.');
    return res.record!;
  },

  /**
   * Admin: Delete or remove subscriber
   */
  async deleteSubscriber(emailOrId: string): Promise<boolean> {
    const subscribers = loadStoredSubscribers();
    const filtered = subscribers.filter(s => s.id !== emailOrId && s.email.toLowerCase() !== emailOrId.toLowerCase());
    saveSubscribers(filtered);
    return true;
  },

  /**
   * Query subscribers count
   */
  getSubscribersCount(): number {
    return loadStoredSubscribers().filter(s => s.status === 'active').length;
  }
};
