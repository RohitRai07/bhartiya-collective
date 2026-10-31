import { validateEmailAddress, validateIndianMobile } from '../middleware/validation.middleware';
import { emailService } from './email.service';

export const DUPLICATE_SUBSCRIBER_MESSAGE =
  'This email address is already subscribed to our newsletter.';

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

export interface DuplicateAuditReport {
  scannedCount: number;
  uniqueCount: number;
  duplicateGroupCount: number;
  duplicateGroups: {
    normalizedEmail: string;
    count: number;
    retainedRecordId: string;
    subsumedRecordIds: string[];
  }[];
  summary: string;
}

/**
 * Database-level unique constraint error representation.
 * Raised when attempting to insert a subscriber whose normalised email is already indexed.
 */
export class DuplicateSubscriberError extends Error {
  public readonly code = 'UNIQUE_CONSTRAINT_VIOLATION';
  public readonly constraint = 'unique_subscribers_normalized_email';
  public readonly statusCode = 409;

  constructor(public readonly email: string) {
    super(DUPLICATE_SUBSCRIBER_MESSAGE);
    this.name = 'DuplicateSubscriberError';
  }
}

/**
 * Concurrency-safe Repository with Database-Level Unique Constraint on Normalised Email.
 * Guarantees case-insensitive uniqueness and atomic operations across simultaneous requests.
 */
class SubscriberDatabaseRepository {
  // Primary data table keyed by normalized email
  private table: Map<string, SubscriberRecord> = new Map();

  // Explicit unique index enforcing case-insensitive email uniqueness
  private uniqueEmailIndex: Set<string> = new Set();

  // In-flight concurrency locks preventing simultaneous race-conditions
  private inFlightTransactionLocks: Set<string> = new Set();

  /**
   * Acquire an in-flight transaction lock on a normalized email.
   * Returns false if an operation is already in-flight or if the email is already in the unique index.
   */
  public acquireLock(normalizedEmail: string): boolean {
    const norm = normalizedEmail.trim().toLowerCase();
    if (this.uniqueEmailIndex.has(norm) || this.inFlightTransactionLocks.has(norm)) {
      return false;
    }
    this.inFlightTransactionLocks.add(norm);
    return true;
  }

  /**
   * Release an in-flight transaction lock.
   */
  public releaseLock(normalizedEmail: string): void {
    const norm = normalizedEmail.trim().toLowerCase();
    this.inFlightTransactionLocks.delete(norm);
  }

  /**
   * Atomic check-and-insert with database unique constraint.
   * Throws DuplicateSubscriberError if normalized email is already indexed.
   */
  public atomicInsert(record: SubscriberRecord): SubscriberRecord {
    const norm = record.email.trim().toLowerCase();

    // Check unique index constraint
    if (this.uniqueEmailIndex.has(norm)) {
      throw new DuplicateSubscriberError(record.email);
    }

    const normalizedRecord: SubscriberRecord = {
      ...record,
      email: norm,
    };

    // Commit to unique index and table
    this.uniqueEmailIndex.add(norm);
    this.table.set(norm, normalizedRecord);

    return normalizedRecord;
  }

  /**
   * Find record by normalized email
   */
  public findByNormalizedEmail(normalizedEmail: string): SubscriberRecord | undefined {
    return this.table.get(normalizedEmail.trim().toLowerCase());
  }

  /**
   * Update existing record safely
   */
  public update(normalizedEmail: string, updater: (existing: SubscriberRecord) => SubscriberRecord): SubscriberRecord | undefined {
    const norm = normalizedEmail.trim().toLowerCase();
    const existing = this.table.get(norm);
    if (!existing) return undefined;
    const updated = updater(existing);
    this.table.set(norm, updated);
    return updated;
  }

  /**
   * Remove record by normalized email
   */
  public remove(normalizedEmail: string): boolean {
    const norm = normalizedEmail.trim().toLowerCase();
    this.uniqueEmailIndex.delete(norm);
    this.inFlightTransactionLocks.delete(norm);
    return this.table.delete(norm);
  }

  /**
   * Retrieve all unique subscriber records
   */
  public getAll(): SubscriberRecord[] {
    return Array.from(this.table.values());
  }

  /**
   * Count active subscribers
   */
  public countActive(): number {
    return Array.from(this.table.values()).filter(s => s.status === 'active').length;
  }

  /**
   * Audit existing repository records for any potential duplicate normalized emails,
   * safely merging them into a single primary record preserving history and data.
   */
  public auditAndSanitizeDuplicates(): DuplicateAuditReport {
    const allRecords = Array.from(this.table.values());
    const grouped = new Map<string, SubscriberRecord[]>();

    for (const r of allRecords) {
      const norm = r.email.trim().toLowerCase();
      const list = grouped.get(norm) || [];
      list.push(r);
      grouped.set(norm, list);
    }

    const duplicateGroups: DuplicateAuditReport['duplicateGroups'] = [];
    let duplicateGroupCount = 0;

    for (const [normEmail, records] of grouped.entries()) {
      if (records.length > 1) {
        duplicateGroupCount++;
        // Sort by earliest subscribedAt to keep the original primary record
        records.sort((a, b) => new Date(a.subscribedAt).getTime() - new Date(b.subscribedAt).getTime());
        const primary = records[0];
        const subsumed = records.slice(1);

        // Merge any non-empty fields from duplicate records
        for (const sub of subsumed) {
          if (!primary.name && sub.name) primary.name = sub.name;
          if (!primary.phone && sub.phone) primary.phone = sub.phone;
          if (sub.status === 'active') primary.status = 'active'; // active takes precedence
        }

        duplicateGroups.push({
          normalizedEmail: normEmail,
          count: records.length,
          retainedRecordId: primary.id,
          subsumedRecordIds: subsumed.map(s => s.id),
        });

        // Re-write sanitized primary record
        this.table.set(normEmail, primary);
        this.uniqueEmailIndex.add(normEmail);
      }
    }

    return {
      scannedCount: allRecords.length,
      uniqueCount: this.table.size,
      duplicateGroupCount,
      duplicateGroups,
      summary: duplicateGroupCount === 0
        ? `Clean audit: All ${this.table.size} subscriber records have unique normalised email addresses.`
        : `Identified and resolved ${duplicateGroupCount} duplicate subscriber group(s). Kept primary records safely.`,
    };
  }
}

class NewsletterService {
  private repository: SubscriberDatabaseRepository = new SubscriberDatabaseRepository();

  constructor() {
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
      try {
        this.repository.atomicInsert(s);
      } catch {
        // Safe seed insertion
      }
    }
  }

  /**
   * Subscribe an email to the newsletter.
   * 1. Validates email using robust format & approved domain whitelist.
   * 2. Performs case-insensitive, trimmed duplicate check against backend records.
   * 3. Uses atomic check-and-insert with unique constraint & transaction lock against race-conditions.
   * 4. Dispatches internal admin notification to office@bharatcollective.in ONLY for genuinely new subscribers.
   */
  public async subscribe(input: SubscribeInput): Promise<SubscribeResult> {
    const rawEmail = (input.email || '').trim();

    // 1. Validate email format & domain whitelist
    const val = validateEmailAddress(rawEmail);
    if (!val.isValid) {
      return {
        success: false,
        status: 'invalid_email',
        message: val.error || 'Please enter a valid email address.',
      };
    }

    // Normalised email: trimmed and lowercase
    const cleanEmail = val.formatted;

    // Optional phone validation
    let cleanPhone = input.phone?.trim();
    if (cleanPhone) {
      const pVal = validateIndianMobile(cleanPhone);
      if (!pVal.isValid) {
        return {
          success: false,
          status: 'invalid_email',
          message: pVal.error || 'Please enter a valid 10-digit Indian mobile number.',
        };
      }
      cleanPhone = pVal.formatted;
    }

    // 2. Pre-check: Check existing subscriber records
    const existing = this.repository.findByNormalizedEmail(cleanEmail);
    if (existing && existing.status === 'active') {
      return {
        success: false,
        status: 'already_subscribed',
        message: DUPLICATE_SUBSCRIBER_MESSAGE,
        data: existing,
        notificationSent: false,
      };
    }

    // 3. Concurrency Lock: Prevent simultaneous API calls / multiple clicks
    const lockAcquired = this.repository.acquireLock(cleanEmail);
    if (!lockAcquired) {
      // Another request for this exact email is currently in-flight or already completed
      const activeRecord = this.repository.findByNormalizedEmail(cleanEmail);
      return {
        success: false,
        status: 'already_subscribed',
        message: DUPLICATE_SUBSCRIBER_MESSAGE,
        data: activeRecord,
        notificationSent: false,
      };
    }

    try {
      // 4. Atomic database-level insertion with unique constraint
      const newRecord: SubscriberRecord = {
        id: existing ? existing.id : `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        email: cleanEmail,
        name: input.name?.trim(),
        phone: cleanPhone,
        source: input.source?.trim() || 'website-footer',
        status: 'active',
        subscribedAt: new Date().toISOString(),
      };

      let savedRecord: SubscriberRecord;
      try {
        if (existing && existing.status === 'unsubscribed') {
          savedRecord = this.repository.update(cleanEmail, () => newRecord) || newRecord;
        } else {
          savedRecord = this.repository.atomicInsert(newRecord);
        }
      } catch (err: any) {
        if (err instanceof DuplicateSubscriberError || err.code === 'UNIQUE_CONSTRAINT_VIOLATION') {
          return {
            success: false,
            status: 'already_subscribed',
            message: DUPLICATE_SUBSCRIBER_MESSAGE,
            data: existing,
            notificationSent: false,
          };
        }
        throw err;
      }

      // 5. Send internal notification email to office@bharatcollective.in ONLY once
      let notificationSuccess = false;
      try {
        notificationSuccess = await emailService.sendNewsletterAdminNotification({
          email: savedRecord.email,
          name: savedRecord.name,
          phone: savedRecord.phone,
          source: savedRecord.source,
          subscribedAt: savedRecord.subscribedAt,
        });

        if (!notificationSuccess) {
          console.warn(
            `[Newsletter Alert Warning] Internal admin notification could not be dispatched for new subscriber: ${cleanEmail}. Subscription was saved successfully.`
          );
        }
      } catch (notifyErr) {
        console.error('[Newsletter Alert Error] Unexpected failure sending admin notification:', notifyErr);
        notificationSuccess = false;
      }

      return {
        success: true,
        status: 'success',
        message: 'Thank you for subscribing to Bharat Collective Research Digest.',
        data: savedRecord,
        notificationSent: notificationSuccess,
      };
    } finally {
      this.repository.releaseLock(cleanEmail);
    }
  }

  /**
   * Unsubscribe an email
   */
  public unsubscribe(email: string): { success: boolean; message: string } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const existing = this.repository.findByNormalizedEmail(cleanEmail);

    if (existing) {
      this.repository.update(cleanEmail, rec => ({
        ...rec,
        status: 'unsubscribed',
        unsubscribedAt: new Date().toISOString(),
      }));
    }

    return {
      success: true,
      message: 'You have been unsubscribed from the Bharat Collective mailing list.',
    };
  }

  /**
   * Retrieve all subscribers (for Admin Portal) - Unique records only
   */
  public getAllSubscribers(): SubscriberRecord[] {
    return this.repository.getAll();
  }

  /**
   * Count active unique subscribers
   */
  public getActiveCount(): number {
    return this.repository.countActive();
  }

  /**
   * Audit database for duplicate records and sanitize if found
   */
  public auditDuplicates(): DuplicateAuditReport {
    return this.repository.auditAndSanitizeDuplicates();
  }
}

export const newsletterService = new NewsletterService();
