/**
 * Registration Service
 * 
 * Manages user registration requests for students, researchers, and fellows.
 * Decouples the Registration UI from backend database, storage, and admin CRUD.
 * Persists locally so registration state and status updates survive page reloads.
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { 
  UserRegistrationInput, 
  UserRegistrationRecord, 
  FormattedPhoneNumber 
} from '../types/registration';

const STORAGE_KEY = 'bharat_collective_registrations';

const initialRegistrations: UserRegistrationRecord[] = [
  {
    id: 'reg-001',
    registrationNumber: 'BC-2026-REG-0101',
    firstName: 'Arjun',
    middleName: 'Pratap',
    lastName: 'Sharma',
    email: 'arjun.sharma@du.ac.in',
    phoneNumber: { countryCode: '+91', nationalNumber: '9811234567', fullFormatted: '+91 9811234567' },
    collegeName: 'St. Stephen’s College, University of Delhi',
    address: 'Room 42, Rudra North Hostel, University Enclave',
    pincode: '110007',
    city: 'Delhi',
    district: 'North Delhi',
    state: 'Delhi',
    consent: true,
    status: 'verified',
    createdAt: '2026-08-10T10:30:00Z',
    updatedAt: '2026-08-12T14:20:00Z',
  },
  {
    id: 'reg-002',
    registrationNumber: 'BC-2026-REG-0102',
    firstName: 'Gayatri',
    lastName: 'Iyer',
    email: 'gayatri.iyer@iitm.ac.in',
    phoneNumber: { countryCode: '+91', nationalNumber: '9444123456', fullFormatted: '+91 9444123456' },
    collegeName: 'Department of Humanities, IIT Madras',
    address: 'Sharavathi Hostel, IIT Madras Campus',
    pincode: '600036',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    consent: true,
    status: 'pending',
    createdAt: '2026-09-02T16:15:00Z',
    updatedAt: '2026-09-02T16:15:00Z',
  },
  {
    id: 'reg-003',
    registrationNumber: 'BC-2026-REG-0103',
    firstName: 'Devendra',
    middleName: 'Kumar',
    lastName: 'Pathak',
    email: 'd.pathak@bhu.ac.in',
    phoneNumber: { countryCode: '+91', nationalNumber: '9450987654', fullFormatted: '+91 9450987654' },
    collegeName: 'Faculty of Arts, Banaras Hindu University',
    address: 'Hostel No. 8, BHU Campus, Lanka',
    pincode: '221005',
    city: 'Varanasi',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    consent: true,
    status: 'pending',
    createdAt: '2026-09-14T11:45:00Z',
    updatedAt: '2026-09-14T11:45:00Z',
  },
  {
    id: 'reg-004',
    registrationNumber: 'BC-2026-REG-0104',
    firstName: 'Nandini',
    lastName: 'Kulkarni',
    email: 'nandini.k@unipune.ac.in',
    phoneNumber: { countryCode: '+91', nationalNumber: '9822334455', fullFormatted: '+91 9822334455' },
    collegeName: 'Savitribai Phule Pune University',
    address: 'Ganeshkhind Road, University Staff Quarters',
    pincode: '411007',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    consent: true,
    status: 'verified',
    createdAt: '2026-09-18T09:20:00Z',
    updatedAt: '2026-09-19T13:00:00Z',
  }
];

function loadStoredRegistrations(): UserRegistrationRecord[] {
  if (typeof window === 'undefined') return initialRegistrations;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRegistrations));
      return initialRegistrations;
    }
    return JSON.parse(raw);
  } catch {
    return initialRegistrations;
  }
}

function saveRegistrations(list: UserRegistrationRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'registration' } }));
  } catch (e) {
    console.error('Failed to save registrations:', e);
  }
}

export interface RegistrationSubmissionResult {
  success: boolean;
  registrationNumber: string;
  record: UserRegistrationRecord;
  message: string;
}

export const registrationService = {
  /**
   * Helper to validate phone number consistent representation:
   * Country code: +91, Mobile: exactly 10 digits
   */
  validatePhoneNumber(phone: FormattedPhoneNumber): { isValid: boolean; error?: string } {
    if (phone.countryCode !== '+91') {
      return { isValid: false, error: 'Only country code +91 is currently supported.' };
    }
    const cleanNumber = (phone.nationalNumber || '').replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      return { isValid: false, error: 'Mobile number must be exactly 10 digits.' };
    }
    // Indian mobile numbers start with 6, 7, 8, or 9
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return { isValid: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
    }
    return { isValid: true };
  },

  /**
   * Submit a new registration from the public website
   */
  async submitRegistration(input: UserRegistrationInput): Promise<RegistrationSubmissionResult> {
    // 1. Phone validation check
    const phoneVal = this.validatePhoneNumber(input.phoneNumber);
    if (!phoneVal.isValid) {
      throw new Error(phoneVal.error || 'Invalid phone number.');
    }

    // 2. Consent check
    if (!input.consent) {
      throw new Error('Consent to the collective code of conduct is required.');
    }

    // 3. Future Backend / API Client integration branch
    if (!apiConfig.useMockData) {
      const response = await apiClient.post<UserRegistrationRecord>(
        apiConfig.endpoints.registration.submit,
        input
      );
      return {
        success: true,
        registrationNumber: response.data.registrationNumber,
        record: response.data,
        message: response.message || 'Your registration has been submitted successfully.',
      };
    }

    // 4. Local Handling with Persistence
    await new Promise(resolve => setTimeout(resolve, 300));

    const existing = loadStoredRegistrations();
    const randomSerial = String(existing.length + 101).padStart(4, '0');
    const registrationNumber = `BC-2026-REG-${randomSerial}`;
    const now = new Date().toISOString();

    const record: UserRegistrationRecord = {
      ...input,
      id: `reg-${Date.now()}`,
      registrationNumber,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    saveRegistrations([record, ...existing]);

    return {
      success: true,
      registrationNumber,
      record,
      message: 'Registration received successfully. Our academic committee will review your application.',
    };
  },

  /**
   * Admin Panel Read API (Section 16: View Registrations)
   */
  async getRegistrations(): Promise<UserRegistrationRecord[]> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.get<UserRegistrationRecord[]>(
        apiConfig.endpoints.registration.adminList
      );
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 60));
    return loadStoredRegistrations();
  },

  /**
   * Admin Panel Status update API (Section 16: Update/Archive)
   */
  async updateStatus(id: string, status: 'pending' | 'verified' | 'archived'): Promise<boolean> {
    if (!apiConfig.useMockData) {
      await apiClient.patch(`${apiConfig.endpoints.registration.adminList}/${id}`, { status });
      return true;
    }

    const items = loadStoredRegistrations();
    const idx = items.findIndex(r => r.id === id);
    if (idx !== -1) {
      items[idx].status = status;
      items[idx].updatedAt = new Date().toISOString();
      saveRegistrations(items);
      return true;
    }
    return false;
  },

  /**
   * Admin Panel Bulk Status update API
   */
  async bulkUpdateStatus(ids: string[], status: 'pending' | 'verified' | 'archived'): Promise<number> {
    const items = loadStoredRegistrations();
    let count = 0;
    const now = new Date().toISOString();
    items.forEach(item => {
      if (ids.includes(item.id)) {
        item.status = status;
        item.updatedAt = now;
        count++;
      }
    });
    if (count > 0) {
      saveRegistrations(items);
    }
    return count;
  }
};
