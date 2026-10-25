/**
 * Flagship National Dialogue Banner Service
 * 
 * Centralized service managing the #BharatDialogue Flagship National Dialogue section.
 * Powers the dynamic presentation banner on both the Homepage and Events Page,
 * synchronized bidirectionally with the flagship event record in eventService.
 */

import { eventService } from './eventService';

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
  badge2: 'UPCOMING EVENT',
  presenterText: 'Bharat Collective Foundation Presents',
  title: '#BharatDialogue',
  titleHighlight: 'on ARTICLE 44 & UNIFORM CIVIL CODE',
  subtitle: 'Towards a Unified, Just and Inclusive Bharat',
  description: 'Bharat Collective Foundation presents a National Dialogue on Article 44 and the Uniform Civil Code, bringing together distinguished members of the judiciary, legal experts, advocates, policymakers, and social activists to deliberate on constitutional values, equality, personal laws, and the future of a unified and inclusive India.\n\nThe dialogue will explore constitutional perspectives, judicial insights, the progress of UCC implementation, and the legal and social challenges ahead. Through informed discussions and diverse viewpoints, the event aims to encourage constructive engagement on the role of Article 44 in shaping India\'s legal and constitutional framework.',
  venueName: 'Indian Society of International Law (ISIL)',
  venueAddress: 'V.K. Krishna Menon Bhawan, 9 Bhagwan Das Road, New Delhi, Delhi 110001',
  scheduleInfo: 'Wednesday, 28 October 2026 || 4:00 PM - 8:00 PM IST',
  ctaText: 'Pre-Register / RSVP',
  ctaLink: '/register',
  posterUrl: 'uploads/event-poster-ucc.jpg',
  posterCaption: 'Connecting Bharat, Bringing Minds Together',
  status: 'published',
  isVisible: true,
};

const STORAGE_KEY = 'bharat_flagship_banner_config';

let inMemoryConfig: FlagshipBannerContent = { ...DEFAULT_FLAGSHIP_BANNER };

function loadStoredConfig(): FlagshipBannerContent {
  if (typeof window === 'undefined') return { ...inMemoryConfig };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...inMemoryConfig };
    const parsed = JSON.parse(raw);
    if (parsed.venueAddress?.includes('Sansad Marg') || parsed.titleHighlight === 'on UNIFORM CIVIL CODE' || !parsed.venueName?.includes('ISIL')) {
      const upgraded = { ...DEFAULT_FLAGSHIP_BANNER, ...parsed, venueName: DEFAULT_FLAGSHIP_BANNER.venueName, venueAddress: DEFAULT_FLAGSHIP_BANNER.venueAddress, titleHighlight: DEFAULT_FLAGSHIP_BANNER.titleHighlight, scheduleInfo: DEFAULT_FLAGSHIP_BANNER.scheduleInfo, posterUrl: parsed.posterUrl || DEFAULT_FLAGSHIP_BANNER.posterUrl };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
      inMemoryConfig = upgraded;
      return upgraded;
    }
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
