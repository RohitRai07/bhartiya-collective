/**
 * Expert Scholar Service
 * 
 * Manages fellow scholar profiles, advisory board members, and research leads.
 * Persists modifications reactively so changes in the Admin Portal reflect immediately
 * on the public website.
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { ScholarExpert, ExpertRole } from '../types/expert';
import { mockExperts } from '../data/mockExperts';

const STORAGE_KEY = 'bharat_collective_experts';

function loadStoredExperts(): ScholarExpert[] {
  if (typeof window === 'undefined') return mockExperts;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = mockExperts.map((exp, idx) => ({
        ...exp,
        councilRole: (idx % 2 === 0 ? 'advisory_council' : 'senior_fellow') as ExpertRole,
        status: 'active' as const,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return mockExperts;
  }
}

function saveExperts(list: ScholarExpert[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'expert' } }));
  } catch (e) {
    console.error('Failed to save experts:', e);
  }
}

export const expertService = {
  /**
   * Fetch all experts, optionally filtering by councilRole or active status
   */
  async getExperts(options?: { role?: ExpertRole; includeArchived?: boolean }): Promise<ScholarExpert[]> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.get<ScholarExpert[]>(apiConfig.endpoints.experts);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 60));
    let items = loadStoredExperts();

    if (!options?.includeArchived) {
      items = items.filter(e => !e.status || e.status === 'active');
    }

    if (options?.role) {
      items = items.filter(e => e.councilRole === options.role);
    }

    return items;
  },

  /**
   * Fetch an individual expert by ID
   */
  async getExpertById(id: string): Promise<ScholarExpert | null> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.get<ScholarExpert>(`${apiConfig.endpoints.experts}/${id}`);
      return response.data;
    }

    const experts = loadStoredExperts();
    return experts.find(e => e.id === id) || null;
  },

  /**
   * Admin CRUD: Create new expert / council member
   */
  async createExpert(input: Omit<ScholarExpert, 'id'>): Promise<ScholarExpert> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.post<ScholarExpert>(apiConfig.endpoints.experts, input);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 120));
    const items = loadStoredExperts();
    const newExpert: ScholarExpert = {
      ...input,
      id: `exp-${Date.now()}`,
      status: input.status || 'active',
      councilRole: input.councilRole || 'advisory_council',
    };

    saveExperts([newExpert, ...items]);
    return newExpert;
  },

  /**
   * Admin CRUD: Update existing expert
   */
  async updateExpert(id: string, updates: Partial<ScholarExpert>): Promise<ScholarExpert> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.put<ScholarExpert>(`${apiConfig.endpoints.experts}/${id}`, updates);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 120));
    const items = loadStoredExperts();
    const idx = items.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Expert scholar profile not found.');

    const updated: ScholarExpert = { ...items[idx], ...updates };
    items[idx] = updated;
    saveExperts(items);
    return updated;
  },

  /**
   * Admin CRUD: Delete expert
   */
  async deleteExpert(id: string): Promise<boolean> {
    if (!apiConfig.useMockData) {
      await apiClient.delete(`${apiConfig.endpoints.experts}/${id}`);
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    const items = loadStoredExperts();
    saveExperts(items.filter(e => e.id !== id));
    return true;
  },

  /**
   * Admin CRUD: Toggle active/archived status
   */
  async toggleArchive(id: string): Promise<ScholarExpert> {
    const expert = await this.getExpertById(id);
    if (!expert) throw new Error('Expert not found');
    const newStatus = expert.status === 'archived' ? 'active' : 'archived';
    return this.updateExpert(id, { status: newStatus });
  }
};
