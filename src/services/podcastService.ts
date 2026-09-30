import { PodcastEpisode, PodcastInput } from '../types/podcast';

const STORAGE_KEY = 'bharat_podcasts';

export function extractYouTubeId(url: string): string {
  if (!url) return '';
  const cleanUrl = url.trim();

  // Match youtu.be/<id>
  const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // Match youtube.com/watch?v=<id>
  const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // Match youtube.com/embed/<id>
  const embedMatch = cleanUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // Match raw 11 char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;

  return '';
}

const SEED_PODCASTS: PodcastEpisode[] = [
  {
    id: 'pod-1',
    title: 'Uniform Civil Code: Constitutional Equality & Civilizational Ethics',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeId: 'dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
    speaker: 'Justice (Retd.) Hemant Gupta & Prof. Ananya Someshwar',
    speakerRole: 'Former Supreme Court Judge & Constitutional Chair',
    topic: 'Uniform Civil Code',
    duration: '52 min',
    date: '2026-09-15',
    description: 'An exhaustive exploration of Article 44, gender justice under personal laws, and synthesizing civilizational equity with modern constitutional democracy.',
    featured: true,
  },
  {
    id: 'pod-2',
    title: 'Decolonizing Legal Hermeneutics: From Macaulay to Nyaya',
    youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    youtubeId: 'kJQP7kiw5Fk',
    thumbnailUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
    speaker: 'Sr. Adv. J. Sai Deepak & Dr. Meenakshi Sundaram',
    speakerRole: 'Supreme Court of India Advocate & Epistemology Scholar',
    topic: 'Legal Philosophy',
    duration: '1 hr 14 min',
    date: '2026-09-02',
    description: 'Examining the epistemological foundations of Indian jurisprudence, Pramana Shastra in statutory interpretation, and the evolution of the Bharatiya Nyaya Sanhita.',
    featured: true,
  },
  {
    id: 'pod-3',
    title: 'Arthashastra for Multipolar Geopolitics and Strategic Autonomy',
    youtubeUrl: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    youtubeId: '3JZ_D3ELwOQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
    speaker: 'Amb. (Retd.) Vikramaditya Sen & Dr. Shridhar Pathak',
    speakerRole: 'Distinguished Fellow in Maritime & Strategic Studies',
    topic: 'Geopolitics & Statecraft',
    duration: '44 min',
    date: '2026-08-20',
    description: 'Applying Kautilyan statecraft, Mandala theory, and the maritime heritage of the Chola empire to contemporary Indo-Pacific strategic dilemmas.',
    featured: false,
  }
];

class PodcastService {
  private memoryStore: PodcastEpisode[] = [...SEED_PODCASTS];

  private getStore(): PodcastEpisode[] {
    if (typeof window === 'undefined') return this.memoryStore;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PODCASTS));
        return SEED_PODCASTS;
      }
      return JSON.parse(raw);
    } catch {
      return this.memoryStore;
    }
  }

  private setStore(records: PodcastEpisode[]): void {
    this.memoryStore = records;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        window.dispatchEvent(new CustomEvent('bharat:podcast-updated'));
      } catch (e) {
        console.error('Failed to store podcasts:', e);
      }
    }
  }

  async getPodcasts(): Promise<PodcastEpisode[]> {
    return this.getStore();
  }

  getAll(): PodcastEpisode[] {
    return this.getStore();
  }

  create(input: PodcastInput): PodcastEpisode {
    const current = this.getStore();
    const ytId = extractYouTubeId(input.youtubeUrl);
    const thumbnailUrl = input.customThumbnailUrl || 
      (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80');

    const newEpisode: PodcastEpisode = {
      id: `pod-${Date.now()}`,
      title: input.title.trim(),
      youtubeUrl: input.youtubeUrl.trim(),
      youtubeId: ytId,
      thumbnailUrl,
      speaker: input.speaker.trim(),
      speakerRole: input.speakerRole?.trim(),
      topic: input.topic.trim(),
      duration: input.duration?.trim() || '45 min',
      date: input.date || new Date().toISOString().split('T')[0],
      description: input.description.trim(),
      featured: input.featured ?? false,
    };

    this.setStore([newEpisode, ...current]);
    return newEpisode;
  }

  async addPodcast(input: PodcastInput): Promise<PodcastEpisode> {
    return this.create(input);
  }

  update(id: string, input: Partial<PodcastInput>): PodcastEpisode | null {
    const current = this.getStore();
    const index = current.findIndex(p => p.id === id);
    if (index === -1) return null;

    const existing = current[index];
    const newYtUrl = input.youtubeUrl !== undefined ? input.youtubeUrl.trim() : existing.youtubeUrl;
    const ytId = extractYouTubeId(newYtUrl);
    const thumbnailUrl = input.customThumbnailUrl !== undefined 
      ? input.customThumbnailUrl 
      : (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : existing.thumbnailUrl);

    current[index] = {
      ...existing,
      ...input,
      youtubeUrl: newYtUrl,
      youtubeId: ytId || existing.youtubeId,
      thumbnailUrl,
    };

    this.setStore([...current]);
    return current[index];
  }

  async updatePodcast(id: string, input: Partial<PodcastInput>): Promise<PodcastEpisode | null> {
    return this.update(id, input);
  }

  delete(id: string): boolean {
    const current = this.getStore();
    const filtered = current.filter(p => p.id !== id);
    if (filtered.length === current.length) return false;
    this.setStore(filtered);
    return true;
  }

  async deletePodcast(id: string): Promise<boolean> {
    return this.delete(id);
  }
}

export const podcastService = new PodcastService();
