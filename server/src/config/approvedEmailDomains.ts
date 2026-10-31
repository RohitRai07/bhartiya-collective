/**
 * Centralised Approved Email Domains Whitelist (Backend)
 * 
 * Standard single source of truth for email domain validation
 * across the entire Bharat Collective Foundation web ecosystem.
 * 
 * Only email addresses registered with these exact 15 mainstream providers
 * are accepted anywhere on the website.
 */

export const GLOBAL_APPROVED_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'rediffmail.com',
  'rediff.com',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'zoho.in',
  'gmx.com',
] as const;

export type ApprovedEmailDomain = (typeof GLOBAL_APPROVED_EMAIL_DOMAINS)[number];

export const UNAPPROVED_EMAIL_DOMAIN_ERROR =
  'Please enter a valid email address.';

export const INVALID_EMAIL_FORMAT_ERROR =
  'Please enter a valid email address.';

// Backward compatibility alias for Abstract Submission form
export const ABSTRACT_SUBMISSION_APPROVED_DOMAINS = GLOBAL_APPROVED_EMAIL_DOMAINS;
export const ABSTRACT_SUBMISSION_UNAPPROVED_DOMAIN_ERROR = UNAPPROVED_EMAIL_DOMAIN_ERROR;
