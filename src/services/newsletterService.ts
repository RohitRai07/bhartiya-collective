import { validateEmailAddress } from './contactValidation';
/**
 * Newsletter Service for Bharat Collective Foundation
 * 
 * Manages newsletter subscription, duplicate checks, confirmation notifications,
 * and admin subscriber listing with case-insensitive unique email enforcement.
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { NewsletterSubscriptionInput, NewsletterSubscriptionRecord } from '../types/newsletter';
import { notificationService } from './notificationService';

export const DUPLICATE_SUBSCRIBER_MESSAGE =
  'This email address is already subscribed to our newsletter.';

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

/**
 * Deduplicate subscriber records by normalized email (trimmed, lowercased).
 * Retains one primary record per normalized email, merging available metadata.
 */
function deduplicateRecords(records: NewsletterSubscriptionRecord[]): {
  uniqueList: NewsletterSubscriptionRecord[];
  mergedCount: number;
} {
  const grouped = new Map<string, NewsletterSubscriptionRecord[]>();

  for (const r of records) {
    const norm = (r.email || '').trim().toLowerCase();
    if (!norm) continue;
    const list = grouped.get(norm) || [];
    list.push(r);
    grouped.set(norm, list);
  }

  const uniqueList: NewsletterSubscriptionRecord[] = [];
  let mergedCount = 0;

  for (const [normEmail, group] of grouped.entries()) {
    if (group.length > 1) {
      mergedCount += (group.length - 1);
      // Sort to keep earliest subscription as primary
      group.sort((a, b) => new Date(a.subscribedAt).getTime() - new Date(b.subscribedAt).getTime());
      const primary: NewsletterSubscriptionRecord = {
        ...group[0],
        email: normEmail,
      };

      // Merge active status and non-empty properties
      for (const item of group.slice(1)) {
        if (item.status === 'active') primary.status = 'active';
        if (!primary.source && item.source) primary.source = item.source;
      }
      uniqueList.push(primary);
    } else {
      uniqueList.push({
        ...group[0],
        email: normEmail,
      });
    }
  }

  return { uniqueList, mergedCount };
}

function loadStoredSubscribers(): NewsletterSubscriptionRecord[] {
  if (typeof window === 'undefined') {
    const { uniqueList } = deduplicateRecords(inMemorySubscribers);
    inMemorySubscribers = uniqueList;
    return inMemorySubscribers;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const { uniqueList } = deduplicateRecords(initialSubscribers);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueList));
      return uniqueList;
    }
    const parsed = JSON.parse(raw);
    const { uniqueList, mergedCount } = deduplicateRecords(Array.isArray(parsed) ? parsed : initialSubscribers);
    if (mergedCount > 0) {
      // Clean up stored duplicates automatically
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueList));
    }
    return uniqueList;
  } catch {
    return inMemorySubscribers;
  }
}

function saveSubscribers(list: NewsletterSubscriptionRecord[]) {
  const { uniqueList } = deduplicateRecords(list);
  inMemorySubscribers = uniqueList;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueList));
  } catch (e) {
    console.error('Failed to save subscribers:', e);
  }
}

export type SubscribeResult = 
  | { status: 'success'; message: string; record?: NewsletterSubscriptionRecord }
  | { status: 'already_subscribed'; message: string }
  | { status: 'error'; message: string };

export interface DuplicateAuditReport {
  scannedCount: number;
  uniqueCount: number;
  duplicatesFound: number;
  summary: string;
}

export const newsletterService = {
  inFlightSubscriptions: new Set<string>(),

  /**
   * Validate email address syntax using central validation
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
    const rawEmail = (input.email || '').trim();

    // 1. Client-side input validation
    const validation = this.validateEmail(rawEmail);
    if (!validation.isValid) {
      return { status: 'error', message: validation.error || 'Please enter a valid email address.' };
    }

    // Normalized email: trimmed and lowercase
    const cleanEmail = rawEmail.toLowerCase();

    // 2. Prevent duplicate in-flight submissions (accidental multiple clicks or concurrent requests)
    if (this.inFlightSubscriptions.has(cleanEmail)) {
      return {
        status: 'already_subscribed',
        message: DUPLICATE_SUBSCRIBER_MESSAGE,
      };
    }
    this.inFlightSubscriptions.add(cleanEmail);

    try {
      // 3. Send via Backend API so duplicate check happens on backend & notification goes to office@bharatcollective.in
      try {
        const response = await apiClient.post<any>(
          apiConfig.endpoints.newsletter.subscribe,
          { email: cleanEmail, source: input.source || 'website-footer' }
        );

        if (response) {
          if (response.status === 'already_subscribed' || response.data?.status === 'already_subscribed') {
            return {
              status: 'already_subscribed',
              message: DUPLICATE_SUBSCRIBER_MESSAGE,
            };
          }

          if (response.success) {
            const record: NewsletterSubscriptionRecord = response.data?.data || response.data || {
              id: `sub-${Date.now()}`,
              email: cleanEmail,
              status: 'active',
              subscribedAt: new Date().toISOString(),
              source: input.source || 'website-footer',
            };

            // Synchronize local storage (strictly deduplicated)
            const subscribers = loadStoredSubscribers();
            const updated = [record, ...subscribers.filter(s => s.email.toLowerCase() !== cleanEmail)];
            saveSubscribers(updated);

            // Confirmation email to subscriber
            notificationService.sendNewsletterConfirmation(cleanEmail).catch(console.error);

            return {
              status: 'success',
              message: response.message || 'Thank you for subscribing to Bharat Collective Research Digest.',
              record,
            };
          }
        }
      } catch (backendErr: any) {
        if (
          backendErr.statusCode === 409 ||
          backendErr.status === 'already_subscribed' ||
          backendErr.message?.includes('already subscribed') ||
          backendErr.error?.includes('already subscribed')
        ) {
          return {
            status: 'already_subscribed',
            message: DUPLICATE_SUBSCRIBER_MESSAGE,
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

      // 4. Local storage fallback / offline mode
      await new Promise(resolve => setTimeout(resolve, 80));
      const subscribers = loadStoredSubscribers();

      const existing = subscribers.find(s => s.email.toLowerCase() === cleanEmail);
      if (existing && existing.status === 'active') {
        return {
          status: 'already_subscribed',
          message: DUPLICATE_SUBSCRIBER_MESSAGE,
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
        message: 'Thank you for subscribing to Bharat Collective Research Digest.',
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
      try {
        const response = await apiClient.post<{ message: string }>(
          apiConfig.endpoints.newsletter.unsubscribe,
          { email: cleanEmail }
        );
        return { success: true, message: response.message || 'Successfully unsubscribed.' };
      } catch (e) {
        // Fallback to local update
      }
    }

    await new Promise(resolve => setTimeout(resolve, 80));
    const subscribers = loadStoredSubscribers();
    const updated = subscribers.map(s =>
      s.email.toLowerCase() === cleanEmail
        ? { ...s, status: 'unsubscribed' as const, unsubscribedAt: new Date().toISOString() }
        : s
    );
    saveSubscribers(updated);

    return {
      success: true,
      message: 'You have been unsubscribed from the Bharat Collective mailing list.',
    };
  },

  /**
   * Admin: Query list of all subscribers (unique records only)
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
    await new Promise(resolve => setTimeout(resolve, 50));
    return loadStoredSubscribers();
  },

  /**
   * Admin: Add subscriber manually with duplicate rejection
   */
  async addSubscriberManually(email: string, source: string = 'admin-manual'): Promise<NewsletterSubscriptionRecord> {
    const res = await this.subscribe({ email, source });
    if (res.status === 'error') throw new Error(res.message);
    if (res.status === 'already_subscribed') {
      throw new Error(DUPLICATE_SUBSCRIBER_MESSAGE);
    }
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
   * Query subscribers count (unique active subscribers only)
   */
  getSubscribersCount(): number {
    return loadStoredSubscribers().filter(s => s.status === 'active').length;
  },

  /**
   * Inspect existing subscriber database for duplicates and report safely
   */
  auditExistingDuplicates(): DuplicateAuditReport {
    const rawList = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      : inMemorySubscribers;

    const { uniqueList, mergedCount } = deduplicateRecords(rawList);

    return {
      scannedCount: rawList.length,
      uniqueCount: uniqueList.length,
      duplicatesFound: mergedCount,
      summary: mergedCount === 0
        ? `Clean audit: All ${uniqueList.length} records are unique.`
        : `Identified ${mergedCount} duplicate subscriber records. Safely merged into primary records.`,
    };
  }
};
