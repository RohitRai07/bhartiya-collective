/**
 * Call for Papers Submission Service
 * 
 * Manages paper submissions, abstracts, and peer review intake.
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { PaperSubmissionInput, PaperSubmissionRecord, PaperSubmissionStatus } from '../types/submission';

const initialSubmissions: PaperSubmissionRecord[] = [
  {
    id: 'cfp-001',
    submissionCode: 'BC-CFP-8421',
    paperTitle: 'Decolonizing Indian Legal Education: A Pramana-Based Curriculum Framework',
    abstract: 'This paper examines the over-reliance on Anglo-Saxon case law in Indian law schools and proposes a structured 4-credit course module based on classical Nyaya and Mimamsa hermeneutical principles for statutory interpretation.',
    track: 'constitutional_jurisprudence',
    researchDomainId: 'rd-01',
    keywords: ['Legal Education', 'Pramana', 'Nyaya Hermeneutics'],
    declarationAgreed: true,
    authorName: 'Dr. Radhakrishnan Narayanan',
    authorEmail: 'r.narayanan@nalsar.ac.in',
    affiliation: 'NALSAR University of Law, Hyderabad',
    status: 'under_peer_review',
    submittedAt: '2026-09-08T14:30:00Z',
  },
  {
    id: 'cfp-002',
    submissionCode: 'BC-CFP-3914',
    paperTitle: 'Agrarian Water Harvesting Traditions and Decentralized Governance in Maharashtra',
    abstract: 'An empirical investigation into 14 traditional tank and stepwell networks across Pune and Satara districts, assessing community-led maintenance versus centralized irrigation bureaucracy.',
    track: 'ecological_heritage',
    researchDomainId: 'rd-03',
    keywords: ['Agrarian Heritage', 'Water Conservation', 'Decentralized Governance'],
    declarationAgreed: true,
    authorName: 'Suniti Deshmukh',
    authorEmail: 's.deshmukh@gipe.ac.in',
    affiliation: 'Gokhale Institute of Politics and Economics, Pune',
    status: 'accepted',
    submittedAt: '2026-09-12T11:15:00Z',
  }
];

const STORAGE_KEY = 'bharat_collective_cfp_submissions';

function loadStoredSubmissions(): PaperSubmissionRecord[] {
  if (typeof window === 'undefined') return initialSubmissions;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSubmissions));
      return initialSubmissions;
    }
    return JSON.parse(raw);
  } catch {
    return initialSubmissions;
  }
}

function saveSubmissions(list: PaperSubmissionRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'submission' } }));
  } catch (e) {
    console.error('Failed to save submissions:', e);
  }
}

export const submissionService = {
  async submitPaper(input: PaperSubmissionInput): Promise<PaperSubmissionRecord> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.post<PaperSubmissionRecord>(
        apiConfig.endpoints.submissions.callForPapers,
        input
      );
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    const items = loadStoredSubmissions();
    const record: PaperSubmissionRecord = {
      ...input,
      id: `cfp-${Date.now()}`,
      submissionCode: `BC-CFP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    saveSubmissions([record, ...items]);
    return record;
  },

  async getSubmissions(): Promise<PaperSubmissionRecord[]> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.get<PaperSubmissionRecord[]>(
        apiConfig.endpoints.submissions.callForPapers
      );
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 60));
    return loadStoredSubmissions();
  },

  async updateStatus(id: string, status: PaperSubmissionStatus): Promise<boolean> {
    const items = loadStoredSubmissions();
    const idx = items.findIndex(s => s.id === id);
    if (idx !== -1) {
      items[idx].status = status;
      saveSubmissions(items);
      return true;
    }
    return false;
  }
};
