/**
 * Research Service
 * 
 * Manages research domains, thematic clusters, and active projects.
 * Persists updates and reflects changes to public website.
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { ResearchDomain } from '../types/research';
import { mockResearchDomains } from '../data/mockResearch';

const STORAGE_KEY = 'bharat_collective_research_domains';

let memoryDomains: ResearchDomain[] = mockResearchDomains.map(d => ({ ...d, status: 'published' as const }));

function loadStoredDomains(): ResearchDomain[] {
  if (typeof window === 'undefined') return memoryDomains;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryDomains));
      return memoryDomains;
    }
    return JSON.parse(raw);
  } catch {
    return memoryDomains;
  }
}

function saveDomains(list: ResearchDomain[]) {
  memoryDomains = list;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'research' } }));
  } catch (e) {
    console.error('Failed to save research domains:', e);
  }
}

export const researchService = {
  async getDomains(includeDrafts: boolean = false): Promise<ResearchDomain[]> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.get<ResearchDomain[]>(apiConfig.endpoints.research);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 60));
    const items = loadStoredDomains();
    if (includeDrafts) return items;
    return items.filter(d => !d.status || d.status === 'published');
  },

  async getDomainBySlug(slug: string): Promise<ResearchDomain | null> {
    const domains = await this.getDomains(true);
    return domains.find(d => d.slug === slug) || null;
  },

  async createDomain(input: Omit<ResearchDomain, 'id'>): Promise<ResearchDomain> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.post<ResearchDomain>(apiConfig.endpoints.research, input);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    const items = loadStoredDomains();
    const newDomain: ResearchDomain = {
      ...input,
      id: `res-domain-${Date.now()}`,
      status: input.status || 'published',
    };

    saveDomains([...items, newDomain]);
    return newDomain;
  },

  async updateDomain(id: string, updates: Partial<ResearchDomain>): Promise<ResearchDomain> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.put<ResearchDomain>(`${apiConfig.endpoints.research}/${id}`, updates);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    const items = loadStoredDomains();
    const idx = items.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Domain not found.');

    const updated = { ...items[idx], ...updates };
    items[idx] = updated;
    saveDomains(items);
    return updated;
  },

  async deleteDomain(id: string): Promise<boolean> {
    if (!apiConfig.useMockData) {
      await apiClient.delete(`${apiConfig.endpoints.research}/${id}`);
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    const items = loadStoredDomains();
    saveDomains(items.filter(d => d.id !== id));
    return true;
  },

  async togglePublish(id: string): Promise<ResearchDomain> {
    const item = (await this.getDomains(true)).find(d => d.id === id);
    if (!item) throw new Error('Domain not found');
    const isPublished = item.status === 'published';
    const newStatus = isPublished ? 'draft' : 'published';
    return this.updateDomain(id, { status: newStatus });
  }
};
