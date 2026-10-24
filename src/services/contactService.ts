/**
 * Contact & Inquiry Service
 * 
 * Manages general institutional inquiries, fellowship questions, press queries,
 * and academic collaboration requests submitted via the Contact page or Secretariat.
 */

export interface ContactInquiryInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category?: 'general' | 'fellowship' | 'press' | 'collaboration';
}

export interface ContactInquiryRecord extends ContactInquiryInput {
  id: string;
  inquiryCode: string; // e.g. BC-INQ-2026-104
  status: 'new' | 'in_progress' | 'responded' | 'archived';
  submittedAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'bharat_collective_contact_inquiries';

const SEED_INQUIRIES: ContactInquiryRecord[] = [
  {
    id: 'inq-001',
    inquiryCode: 'BC-INQ-2026-0412',
    name: 'Prof. Meenakshi Sundaram',
    email: 'm.sundaram@madrasuniv.ac.in',
    phone: '+91 94440 98765',
    subject: 'Visiting Fellowship Collaboration Inquiry for 2026-27',
    message: 'We are seeking to establish a joint symposium track on Tamil legal traditions and Epigraphy with Bharat Collective Foundation.',
    category: 'collaboration',
    status: 'responded',
    submittedAt: '2026-09-15T09:30:00Z',
    updatedAt: '2026-09-16T14:20:00Z',
  },
  {
    id: 'inq-002',
    inquiryCode: 'BC-INQ-2026-0589',
    name: 'Saurabh Agrawal',
    email: 'saurabh.agrawal@nludelhi.ac.in',
    phone: '+91 98101 23456',
    subject: 'Inquiry regarding student research associate positions',
    message: 'Could you please clarify whether 3rd year law students are eligible for visiting internships at the Center for Public Policy?',
    category: 'fellowship',
    status: 'new',
    submittedAt: '2026-09-28T16:45:00Z',
    updatedAt: '2026-09-28T16:45:00Z',
  }
];

class ContactService {
  private memoryStore: ContactInquiryRecord[] = [...SEED_INQUIRIES];

  private getStore(): ContactInquiryRecord[] {
    if (typeof window === 'undefined') return this.memoryStore;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INQUIRIES));
        return SEED_INQUIRIES;
      }
      return JSON.parse(raw);
    } catch {
      return this.memoryStore;
    }
  }

  private setStore(records: ContactInquiryRecord[]): void {
    this.memoryStore = records;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        window.dispatchEvent(new CustomEvent('bharat:inquiries-updated'));
      } catch (e) {
        console.error('Failed to store contact inquiries:', e);
      }
    }
  }

  getAll(): ContactInquiryRecord[] {
    return this.getStore();
  }

  getInquiries(): ContactInquiryRecord[] {
    return this.getAll();
  }

  getById(id: string): ContactInquiryRecord | null {
    return this.getStore().find(i => i.id === id) || null;
  }

  create(input: ContactInquiryInput): ContactInquiryRecord {
    const current = this.getStore();
    const count = current.length + 1;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const inquiryCode = `BC-INQ-2026-${count.toString().padStart(2, '0')}${randomSuffix.toString().slice(0, 2)}`;

    const newRecord: ContactInquiryRecord = {
      ...input,
      category: input.category || 'general',
      id: `inq-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      inquiryCode,
      status: 'new',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.setStore([newRecord, ...current]);
    return newRecord;
  }

  submitInquiry(input: ContactInquiryInput): ContactInquiryRecord {
    return this.create(input);
  }

  updateStatus(id: string, status: ContactInquiryRecord['status']): ContactInquiryRecord | null {
    const current = this.getStore();
    const index = current.findIndex(i => i.id === id);
    if (index === -1) return null;

    current[index] = {
      ...current[index],
      status,
      updatedAt: new Date().toISOString()
    };

    this.setStore([...current]);
    return current[index];
  }

  updateInquiryStatus(id: string, status: ContactInquiryRecord['status']): ContactInquiryRecord | null {
    return this.updateStatus(id, status);
  }

  delete(id: string): boolean {
    const current = this.getStore();
    const filtered = current.filter(i => i.id !== id);
    if (filtered.length === current.length) return false;
    this.setStore(filtered);
    return true;
  }
}

export const contactService = new ContactService();
