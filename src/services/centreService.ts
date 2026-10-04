import { BHARAT_CENTRES, BharatCentre } from '../data/centresData';

const STORAGE_KEY = 'bharat_collective_centres_data';

class CentreService {
  private memoryStore: BharatCentre[] = BHARAT_CENTRES.map(c => ({ ...c, status: c.status || 'published' }));

  private getStore(): BharatCentre[] {
    if (typeof window === 'undefined') {
      return this.memoryStore;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with default seeded centres
      const seeded = BHARAT_CENTRES.map(c => ({ ...c, status: c.status || 'published' }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    } catch {
      return this.memoryStore;
    }
  }

  private setStore(centres: BharatCentre[]): void {
    this.memoryStore = centres;
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(centres));
      window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'centres' } }));
    } catch (e) {
      console.error('Failed to save centres to localStorage:', e);
    }
  }

  public getAll(): BharatCentre[] {
    return this.getStore();
  }

  public getById(id: string): BharatCentre | undefined {
    return this.getStore().find(c => c.id === id || c.slug === id);
  }

  public create(input: Omit<BharatCentre, 'id'>): BharatCentre {
    const current = this.getStore();
    const slug = input.slug || input.shortName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCentre: BharatCentre = {
      ...input,
      id: `centre-${Date.now()}`,
      slug,
      status: input.status || 'published',
      keyThemes: Array.isArray(input.keyThemes) ? input.keyThemes : [],
      focusAreas: Array.isArray(input.focusAreas) ? input.focusAreas : [],
    };

    this.setStore([newCentre, ...current]);
    return newCentre;
  }

  public update(id: string, updates: Partial<BharatCentre>): BharatCentre | null {
    const current = this.getStore();
    const index = current.findIndex(c => c.id === id);
    if (index === -1) return null;

    current[index] = {
      ...current[index],
      ...updates,
    };

    this.setStore([...current]);
    return current[index];
  }

  public delete(id: string): boolean {
    const current = this.getStore();
    const filtered = current.filter(c => c.id !== id);
    if (filtered.length !== current.length) {
      this.setStore(filtered);
      return true;
    }
    return false;
  }

  public togglePublish(id: string): BharatCentre | null {
    const current = this.getStore();
    const index = current.findIndex(c => c.id === id);
    if (index === -1) return null;

    const currentStatus = current[index].status || 'published';
    const nextStatus = currentStatus === 'draft' ? 'published' : 'draft';

    current[index] = {
      ...current[index],
      status: nextStatus,
    };

    this.setStore([...current]);
    return current[index];
  }
}

export const centreService = new CentreService();
