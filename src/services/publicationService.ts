/**
 * Publication Service
 * 
 * Domain service managing publications, monographs, policy briefs, and research papers.
 * Persists changes reactively so updates made in the Admin Portal immediately reflect on public website.
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { Publication, PublicationCategory } from '../types/publication';
import { mockPublications } from '../data/mockPublications';

const STORAGE_KEY = 'bharat_collective_publications';

function loadStoredPublications(): Publication[] {
  if (typeof window === 'undefined') return mockPublications;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with existing website content
      const initial = mockPublications.map(p => ({
        ...p,
        status: 'published' as const,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return mockPublications;
  }
}

function savePublications(list: Publication[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'publication' } }));
  } catch (e) {
    console.error('Failed to save publications:', e);
  }
}

export const publicationService = {
  /**
   * Fetch all publications with optional category or search filters
   * Public view defaults to published items
   */
  async getPublications(params?: { category?: PublicationCategory; search?: string; includeDrafts?: boolean }): Promise<Publication[]> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.get<Publication[]>(apiConfig.endpoints.publications, { params });
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 60));
    let results = loadStoredPublications();

    if (!params?.includeDrafts) {
      results = results.filter(p => !p.status || p.status === 'published');
    }

    if (params?.category) {
      const targetCat = params.category.toLowerCase().replace(/_/g, ' ');
      results = results.filter(p => {
        const cat = (p.category || '').toLowerCase().replace(/_/g, ' ');
        return cat === targetCat;
      });
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.abstract.toLowerCase().includes(q) ||
        p.authors.some(a => a.toLowerCase().includes(q)) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return results;
  },

  /**
   * Fetch featured publications for homepage highlights
   */
  async getFeaturedPublications(): Promise<Publication[]> {
    const all = await this.getPublications();
    return all.filter(p => p.featured);
  },

  /**
   * Fetch a single publication by its ID
   */
  async getPublicationById(id: string): Promise<Publication | null> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.get<Publication>(`${apiConfig.endpoints.publications}/${id}`);
      return response.data;
    }

    const items = loadStoredPublications();
    return items.find(p => p.id === id) || null;
  },

  /**
   * Admin CRUD: Create a new publication
   */
  async createPublication(input: Omit<Publication, 'id'>): Promise<Publication> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.post<Publication>(apiConfig.endpoints.publications, input);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    const items = loadStoredPublications();
    const newPub: Publication = {
      ...input,
      id: `pub-${Date.now()}`,
      status: input.status || 'published',
    };

    savePublications([newPub, ...items]);
    return newPub;
  },

  /**
   * Admin CRUD: Update existing publication
   */
  async updatePublication(id: string, updates: Partial<Publication>): Promise<Publication> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.put<Publication>(`${apiConfig.endpoints.publications}/${id}`, updates);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    const items = loadStoredPublications();
    const idx = items.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Publication not found.');

    const updated: Publication = { ...items[idx], ...updates };
    items[idx] = updated;
    savePublications(items);
    return updated;
  },

  /**
   * Admin CRUD: Delete publication
   */
  async deletePublication(id: string): Promise<boolean> {
    if (!apiConfig.useMockData) {
      await apiClient.delete(`${apiConfig.endpoints.publications}/${id}`);
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    const items = loadStoredPublications();
    const filtered = items.filter(p => p.id !== id);
    savePublications(filtered);
    return true;
  },

  /**
   * Admin CRUD: Quick Publish/Unpublish toggle
   */
  async togglePublish(id: string): Promise<Publication> {
    const pub = await this.getPublicationById(id);
    if (!pub) throw new Error('Publication not found');
    const newStatus = pub.status === 'published' ? 'draft' : 'published';
    return this.updatePublication(id, { status: newStatus });
  }
};
