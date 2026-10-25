/**
 * Flagship National Dialogue Banner Service
 * 
 * Centralized service managing the #BharatDialogue Flagship National Dialogue section.
 * Powers the dynamic presentation banner on both the Homepage and Events Page,
 * synchronized bidirectionally with the flagship event record in eventService.
 */

import { eventService } from './eventService';
import { contentSyncService } from './contentSyncService';

export interface FlagshipBannerContent {
  id: string;
  badge1: string;
  badge2: string;
  presenterText: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  description: string;
  venueName: string;
  venueAddress: string;
  scheduleInfo: string;
  ctaText: string;
  ctaLink: string;
  posterUrl: string;
  posterCaption?: string;
  status: 'published' | 'draft';
  isVisible: boolean;
  updatedAt?: string;
}

export const DEFAULT_FLAGSHIP_BANNER: FlagshipBannerContent = {
  id: 'evt-ucc-flagship',
  badge1: 'Flagship National Dialogue',
  badge2: 'COMING SOON',
  presenterText: 'Bharat Collective Foundation Presents',
  title: '#BharatDialogue',
  titleHighlight: 'on UNIFORM CIVIL CODE',
  subtitle: 'A Dialogue on Law, Equality & Constitutional Values',
  description: 'Convening constitutional jurists, scholars, and civil society leaders to deliberate upon common citizenship, gender justice, personal laws, and constitutional morality.',
  venueName: 'Venue: Constitution Club of India',
  venueAddress: 'Rafi Marg, Sansad Marg Area, New Delhi, Delhi 110001',
  scheduleInfo: 'Schedule & Registration Window: Coming Soon',
  ctaText: 'Pre-Register / RSVP',
  ctaLink: '/register',
  posterUrl: 'images/bharat-dialogue-ucc-banner.jpg',
  posterCaption: 'Connecting Bharat, Bringing Minds Together',
  status: 'published',
  isVisible: true,
};

const STORAGE_KEY = 'bharat_flagship_banner_config';

let inMemoryConfig: FlagshipBannerContent = { ...contentSyncService.getBundledModule<FlagshipBannerContent>('flagship', DEFAULT_FLAGSHIP_BANNER) };

function loadStoredConfig(): FlagshipBannerContent {
  if (typeof window === 'undefined') return { ...inMemoryConfig };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...inMemoryConfig };
    const parsed = JSON.parse(raw);
    inMemoryConfig = { ...DEFAULT_FLAGSHIP_BANNER, ...parsed };
    return inMemoryConfig;
  } catch {
    return { ...inMemoryConfig };
  }
}

function saveStoredConfig(data: FlagshipBannerContent) {
  inMemoryConfig = { ...data };
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'flagship', data } }));
  } catch (e) {
    console.error('Failed to save flagship banner config:', e);
  }
  contentSyncService.persistModule('flagship', data).catch(() => {});
}

export const flagshipService = {
  /**
   * Fetch current flagship banner configuration
   */
  async getFlagshipBanner(): Promise<FlagshipBannerContent> {
    return loadStoredConfig();
  },

  /**
   * Update flagship banner configuration and synchronize with eventService
   */
  async updateFlagshipBanner(updates: Partial<FlagshipBannerContent>): Promise<FlagshipBannerContent> {
    const current = loadStoredConfig();
    const updated: FlagshipBannerContent = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveStoredConfig(updated);

    // Keep eventService record 'evt-ucc-flagship' synchronized
    try {
      const fullTitle = `${updated.title} ${updated.titleHighlight}`.trim();
      const fullLocation = `${updated.venueName.replace(/^Venue:\s*/i, '')}, ${updated.venueAddress}`.trim();
      await eventService.updateEvent(updated.id || 'evt-ucc-flagship', {
        title: fullTitle,
        description: updated.description,
        location: fullLocation,
        date: updated.badge2,
        time: updated.scheduleInfo,
        bannerImage: updated.posterUrl,
        posterUrl: updated.posterUrl,
        status: updated.status,
      });
    } catch (e) {
      console.warn('Flagship event synchronization notice:', e);
    }

    return updated;
  },

  /**
   * Toggle visibility (Active vs Hidden)
   */
  async toggleVisibility(): Promise<FlagshipBannerContent> {
    const current = loadStoredConfig();
    return this.updateFlagshipBanner({
      isVisible: !current.isVisible,
      status: !current.isVisible ? 'published' : 'draft',
    });
  },

  /**
   * Reset to original flagship presentation defaults
   */
  async resetToDefault(): Promise<FlagshipBannerContent> {
    saveStoredConfig({ ...DEFAULT_FLAGSHIP_BANNER });
    return { ...DEFAULT_FLAGSHIP_BANNER };
  },
};
