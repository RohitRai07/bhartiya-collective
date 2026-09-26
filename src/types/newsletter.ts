/**
 * Newsletter Data Models
 * 
 * Supports subscription lifecycle states:
 * - Email validation
 * - Loading
 * - Success
 * - Already Subscribed
 * - Error
 * - Unsubscribe readiness
 */

export type NewsletterSubscriptionStatus = 
  | 'idle' 
  | 'loading' 
  | 'success' 
  | 'already_subscribed' 
  | 'error';

export interface NewsletterSubscriptionInput {
  email: string;
  source?: string;
  subscribedCategories?: string[];
}

export interface NewsletterSubscriptionRecord {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
  unsubscribedAt?: string;
  source: string;
}

export interface NewsletterState {
  status: NewsletterSubscriptionStatus;
  message?: string;
  email?: string;
}
