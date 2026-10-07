import { CareerApplicationInput, CareerApplicationRecord, MAX_CV_SIZE_BYTES } from '../types/career';

const STORAGE_KEY = 'bharat_career_applications';

const SEED_APPLICATIONS: CareerApplicationRecord[] = [
  {
    id: 'app-seed-1',
    applicationCode: 'BC-CAR-2026-0812',
    type: 'internship',
    fullName: 'Shreya Narang',
    email: 'shreya.narang@nludelhi.ac.in',
    phone: '+91 98112 34567',
    currentInstitution: 'National Law University Delhi (NLU Delhi)',
    qualification: '4th Year, B.A. LL.B (Hons.)',
    areaOfInterest: 'Center for Human Rights & Legal Aid',
    coverLetter: 'Passionate about civilizational jurisprudence and constitutional reforms. Interested in researching uniform civil laws and statecraft.',
    cvFileName: 'Shreya_Narang_NLU_Resume.pdf',
    cvFileSize: 420000,
    cvDataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBS...',
    status: 'shortlisted',
    submittedAt: '2026-09-20T10:30:00Z',
    updatedAt: '2026-09-22T14:10:00Z',
  },
  {
    id: 'app-seed-2',
    applicationCode: 'BC-CAR-2026-0905',
    type: 'job',
    fullName: 'Dr. Alok Ranjan',
    email: 'alok.ranjan@jnu.ac.in',
    phone: '+91 97118 76543',
    currentInstitution: 'Centre for Historical Studies, JNU',
    qualification: 'Ph.D. in Ancient Indian History & Epistemology',
    areaOfInterest: 'Center for Public Policy / Studies',
    coverLetter: 'Author of two monographs on pre-colonial administrative treaties. Seeking full-time research fellow role with Bharat Collective.',
    cvFileName: 'Alok_Ranjan_CV_2026.pdf',
    cvFileSize: 780000,
    cvDataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBS...',
    status: 'reviewing',
    submittedAt: '2026-09-24T12:15:00Z',
    updatedAt: '2026-09-25T09:00:00Z',
  }
];

class CareerService {
  private memoryStore: CareerApplicationRecord[] = [...SEED_APPLICATIONS];

  private getStore(): CareerApplicationRecord[] {
    if (typeof window === 'undefined') return this.memoryStore;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_APPLICATIONS));
        return SEED_APPLICATIONS;
      }
      return JSON.parse(raw);
    } catch {
      return this.memoryStore;
    }
  }

  private setStore(records: CareerApplicationRecord[]): void {
    this.memoryStore = records;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        window.dispatchEvent(new CustomEvent('bharat:career-updated'));
      } catch (e) {
        console.error('Failed to store career applications:', e);
      }
    }
  }

  async getApplications(): Promise<CareerApplicationRecord[]> {
    return this.getStore();
  }

  getAll(): CareerApplicationRecord[] {
    return this.getStore();
  }

  getById(id: string): CareerApplicationRecord | null {
    return this.getStore().find(a => a.id === id) || null;
  }

  create(input: CareerApplicationInput): CareerApplicationRecord {
    if (input.cvFileSize && input.cvFileSize > MAX_CV_SIZE_BYTES) {
      throw new Error('CV file exceeds the strict maximum limit of 1 MB.');
    }
    if (input.cvFileName && !input.cvFileName.toLowerCase().endsWith('.pdf')) {
      throw new Error('Only PDF format (.pdf) is permitted for CV upload.');
    }

    const current = this.getStore();
    const count = current.length + 1;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const applicationCode = `BC-CAR-2026-${count.toString().padStart(2, '0')}${randomSuffix.toString().slice(0, 2)}`;

    const newRecord: CareerApplicationRecord = {
      ...input,
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      applicationCode,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.setStore([newRecord, ...current]);
    return newRecord;
  }

  delete(id: string): boolean {
    const current = this.getStore();
    const filtered = current.filter(a => a.id !== id);
    if (filtered.length === current.length) return false;
    this.setStore(filtered);
    return true;
  }

  async submitApplication(input: CareerApplicationInput): Promise<CareerApplicationRecord> {
    return this.create(input);
  }

  updateStatus(id: string, status: CareerApplicationRecord['status']): CareerApplicationRecord | null {
    const current = this.getStore();
    const index = current.findIndex(a => a.id === id);
    if (index === -1) return null;

    current[index] = {
      ...current[index],
      status,
      updatedAt: new Date().toISOString()
    };

    this.setStore([...current]);
    return current[index];
  }

  async deleteApplication(id: string): Promise<boolean> {
    return this.delete(id);
  }
}

export const careerService = new CareerService();
