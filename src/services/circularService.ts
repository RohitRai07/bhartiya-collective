/**
 * Circular and Legal Materials Service
 * 
 * Domain service managing statutory guidelines, Indian constitutional documents,
 * gazette notifications, circulars, and model legal frameworks.
 * Persists changes reactively via localStorage and custom event dispatching.
 */

import { Circular, CircularCategory, CircularStatus } from '../types/circular';
import { mockCirculars } from '../data/mockCirculars';

const STORAGE_KEY = 'bharat_collective_circulars';
let inMemoryCirculars: Circular[] = [...mockCirculars];

function loadStoredCirculars(): Circular[] {
  if (typeof window === 'undefined') return [...inMemoryCirculars];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockCirculars));
      return mockCirculars;
    }
    return JSON.parse(raw);
  } catch {
    return mockCirculars;
  }
}

function saveCirculars(list: Circular[]) {
  inMemoryCirculars = [...list];
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'circular' } }));
  } catch (e) {
    console.error('Failed to save circulars to storage:', e);
  }
}

export const circularService = {
  /**
   * Fetch circulars with optional category, authority, search, and draft filters
   */
  async getCirculars(params?: {
    category?: CircularCategory | 'all';
    authority?: string;
    search?: string;
    includeDrafts?: boolean;
  }): Promise<Circular[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    let results = loadStoredCirculars();

    if (!params?.includeDrafts) {
      results = results.filter(c => !c.status || c.status === 'published');
    }

    if (params?.category && params.category !== 'all') {
      results = results.filter(c => c.category === params.category);
    }

    if (params?.authority && params.authority !== 'all') {
      results = results.filter(c => c.issuingAuthority.toLowerCase().includes(params.authority!.toLowerCase()));
    }

    if (params?.search && params.search.trim()) {
      const query = params.search.toLowerCase().trim();
      results = results.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.shortTitle.toLowerCase().includes(query) ||
        c.circularNumber.toLowerCase().includes(query) ||
        c.issuingAuthority.toLowerCase().includes(query) ||
        c.summary.toLowerCase().includes(query) ||
        c.tags.some(t => t.toLowerCase().includes(query)) ||
        (c.keyProvisions && c.keyProvisions.some(p => p.toLowerCase().includes(query)))
      );
    }

    // Sort: Important first, then newest release date
    return results.sort((a, b) => {
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;
      return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    });
  },

  /**
   * Get a single circular by ID
   */
  async getCircularById(id: string): Promise<Circular | null> {
    const list = loadStoredCirculars();
    return list.find(c => c.id === id) || null;
  },

  /**
   * Create a new circular or legal document
   */
  async createCircular(input: Partial<Circular>): Promise<Circular> {
    const list = loadStoredCirculars();
    const newDoc: Circular = {
      id: `circ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: input.title || 'Untitled Legal Guideline',
      shortTitle: input.shortTitle || input.title || 'Legal Guideline',
      circularNumber: input.circularNumber || `BCF-CIRC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      category: input.category || 'guidelines',
      issuingAuthority: input.issuingAuthority || 'Bharat Collective Legal Secretariat',
      releaseDate: input.releaseDate || new Date().toISOString().split('T')[0],
      effectiveDate: input.effectiveDate || input.releaseDate || new Date().toISOString().split('T')[0],
      summary: input.summary || '',
      keyProvisions: input.keyProvisions || [],
      pdfUrl: input.pdfUrl || '#',
      pdfDataUrl: input.pdfDataUrl,
      fileName: input.fileName || `${input.shortTitle || 'Circular'}.pdf`,
      fileSize: input.fileSize || '1.5 MB',
      pageCount: input.pageCount || 12,
      language: input.language || 'English',
      tags: input.tags || ['Legal', 'Guideline'],
      important: Boolean(input.important),
      status: input.status || 'published',
      downloadsCount: input.downloadsCount || 0,
      contentPreview: input.contentPreview || input.summary || '',
      sourceUrl: input.sourceUrl || '',
      sourceName: input.sourceName || '',
      isAutoSynced: Boolean(input.isAutoSynced),
      lastSyncedAt: input.lastSyncedAt || (input.isAutoSynced ? new Date().toISOString() : undefined),
      syncFeedId: input.syncFeedId,
    };

    saveCirculars([newDoc, ...list]);
    return newDoc;
  },

  /**
   * Update an existing circular
   */
  async updateCircular(id: string, updates: Partial<Circular>): Promise<Circular> {
    const list = loadStoredCirculars();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Circular with ID ${id} not found.`);
    }

    const updated: Circular = {
      ...list[index],
      ...updates,
      id, // Preserve ID
    };

    list[index] = updated;
    saveCirculars(list);
    return updated;
  },

  /**
   * Delete a circular
   */
  async deleteCircular(id: string): Promise<void> {
    const list = loadStoredCirculars();
    const filtered = list.filter(c => c.id !== id);
    saveCirculars(filtered);
  },

  /**
   * Toggle published / draft status
   */
  async togglePublish(id: string): Promise<Circular> {
    const list = loadStoredCirculars();
    const doc = list.find(c => c.id === id);
    if (!doc) throw new Error(`Circular not found: ${id}`);
    
    const nextStatus: CircularStatus = doc.status === 'published' ? 'draft' : 'published';
    return this.updateCircular(id, { status: nextStatus });
  },

  /**
   * Increment download counter
   */
  async incrementDownloads(id: string): Promise<number> {
    const list = loadStoredCirculars();
    const doc = list.find(c => c.id === id);
    if (!doc) return 0;
    
    const nextCount = (doc.downloadsCount || 0) + 1;
    doc.downloadsCount = nextCount;
    saveCirculars(list);
    return nextCount;
  },

  /**
   * Get categories with active document counts
   */
  async getCategoryCounts(includeDrafts = false): Promise<Record<string, number>> {
    const all = await this.getCirculars({ includeDrafts });
    const counts: Record<string, number> = {
      all: all.length,
      constitution: 0,
      acts_statutes: 0,
      circulars_rules: 0,
      guidelines: 0,
      model_bills: 0,
    };

    all.forEach(c => {
      if (counts[c.category] !== undefined) {
        counts[c.category]++;
      }
    });

    return counts;
  },

  /**
   * Reset circulars to pristine initial mock catalog
   */
  resetToDefaults() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    saveCirculars(mockCirculars);
  }
};
