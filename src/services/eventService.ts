/**
 * Event Service
 * 
 * Manages symposia, roundtables, public lectures, and YouTube live events.
 * Decoupled from UI components and persistent across Admin updates.
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { EventItem, LiveEventInput } from '../types/event';
import { mockEvents } from '../data/mockEvents';
import { extractYouTubeId, getYouTubeThumbnail, computeLiveEventStatus } from '../utils/youtube';

const STORAGE_KEY = 'bharat_collective_events';
const DELETED_KEY = 'bharat_collective_events_deleted';

function getDeletedEventIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function recordDeletedEventId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const ids = getDeletedEventIds();
    ids.add(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error('Failed to record deleted event ID:', e);
  }
}

let memoryStore: EventItem[] = mockEvents.map(e => {
  const item: EventItem = { ...e, status: e.status || 'published' };
  if (item.youtubeUrl && !item.youtubeId) {
    item.youtubeId = extractYouTubeId(item.youtubeUrl);
  }
  return item;
});

function loadStoredEvents(): EventItem[] {
  if (typeof window === 'undefined') return memoryStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const deletedIds = getDeletedEventIds();
    const todayStr = new Date().toISOString().split('T')[0];

    if (!raw) {
      const initial = mockEvents
        .filter(m => !deletedIds.has(m.id))
        .map(e => {
          const item: EventItem = {
            ...e,
            date: e.id === 'evt-live-ucc-broadcast' ? (e.date || todayStr) : e.date,
            status: e.status || 'published',
          };
          if (item.youtubeUrl && !item.youtubeId) {
            item.youtubeId = extractYouTubeId(item.youtubeUrl);
          }
          return item;
        });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      memoryStore = initial;
      return initial;
    }
    const parsedRaw: EventItem[] = JSON.parse(raw);
    const OBSOLETE_IDS = new Set(['evt-101', 'evt-102', 'evt-103']);
    let needsUpdate = parsedRaw.some(e => OBSOLETE_IDS.has(e.id));
    const parsed = parsedRaw.filter(e => !OBSOLETE_IDS.has(e.id));

    const migrated = parsed.map(evt => {
      let updatedEvt = { ...evt };
      const defaultEvt = mockEvents.find(m => m.id === evt.id);
      if (defaultEvt && (!evt.bannerImage || evt.bannerImage === '/images/bharat-dialogue-ucc-banner.jpg')) {
        needsUpdate = true;
        updatedEvt.bannerImage = defaultEvt.bannerImage;
      }
      if (evt.id === 'evt-ucc-flagship' && defaultEvt) {
        if (updatedEvt.location?.includes('Constitution Club') || updatedEvt.title?.includes('(UCC)') || updatedEvt.date === 'COMING SOON') {
          updatedEvt = { ...defaultEvt, seatsLeft: updatedEvt.seatsLeft ?? defaultEvt.seatsLeft };
          needsUpdate = true;
        }
      }
      if (evt.id === 'evt-live-ucc-broadcast' && defaultEvt) {
        if (updatedEvt.title?.includes('🔴 LIVE BROADCAST:') || updatedEvt.youtubeId === '5qap5aO4i9A') {
          updatedEvt = { ...defaultEvt };
          needsUpdate = true;
        }
      }
      if (updatedEvt.youtubeId === 'dQw4w9WgXcQ') {
        updatedEvt.youtubeUrl = 'https://www.youtube.com/live/aNCHEmPi78U';
        updatedEvt.youtubeId = 'aNCHEmPi78U';
        updatedEvt.bannerImage = 'https://img.youtube.com/vi/aNCHEmPi78U/hqdefault.jpg';
        needsUpdate = true;
      }
      // Guarantee a status is set if not already defined (default to 'published' without overriding draft)
      if (!updatedEvt.status) {
        updatedEvt.status = defaultEvt?.status || 'published';
        needsUpdate = true;
      }
      if (updatedEvt.youtubeUrl && !updatedEvt.youtubeId) {
        updatedEvt.youtubeId = extractYouTubeId(updatedEvt.youtubeUrl);
        needsUpdate = true;
      }
      return updatedEvt;
    });

    // Ensure all seeded mock events (like the YouTube Live broadcast) exist for returning visitors,
    // as long as they haven't been deleted by an administrator
    for (const defaultEvt of mockEvents) {
      if (deletedIds.has(defaultEvt.id)) continue;
      if (!migrated.some(e => e.id === defaultEvt.id)) {
        migrated.unshift({
          ...defaultEvt,
          date: defaultEvt.id === 'evt-live-ucc-broadcast' ? todayStr : defaultEvt.date,
          liveStatus: defaultEvt.id === 'evt-live-ucc-broadcast' ? 'live' : defaultEvt.liveStatus,
          status: defaultEvt.status || 'published',
          youtubeId: defaultEvt.youtubeId || (defaultEvt.youtubeUrl ? extractYouTubeId(defaultEvt.youtubeUrl) : undefined),
        });
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }
    memoryStore = migrated;
    return migrated;
  } catch {
    return memoryStore;
  }
}

function saveEvents(list: EventItem[]) {
  memoryStore = list;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'event' } }));
  } catch (e) {
    console.error('Failed to save events:', e);
  }
}

export const eventService = {
  /**
   * Fetch all events with optional draft inclusion
   */
  async getEvents(includeDrafts: boolean = false): Promise<EventItem[]> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.get<EventItem[]>(apiConfig.endpoints.events);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 60));
    const rawItems = loadStoredEvents();
    const items = rawItems.map(e => {
      if (e.isLive || Boolean(e.youtubeUrl) || e.type === 'Live Stream') {
        const autoStatus = computeLiveEventStatus(e);
        if (autoStatus && e.liveStatus !== autoStatus) {
          return { ...e, liveStatus: autoStatus };
        }
      }
      return e;
    });
    if (includeDrafts) return items;
    return items.filter(e => !e.status || e.status === 'published');
  },

  /**
   * Fetch only live streaming events (published by default)
   */
  async getLiveEvents(includeDrafts: boolean = false): Promise<EventItem[]> {
    const all = await this.getEvents(includeDrafts);
    return all.filter(e => e.isLive || Boolean(e.youtubeUrl));
  },

  /**
   * Fetch an individual event by ID
   */
  async getEventById(id: string): Promise<EventItem | null> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.get<EventItem>(`${apiConfig.endpoints.events}/${id}`);
      return response.data;
    }

    const rawItems = loadStoredEvents();
    const items = rawItems.map(e => {
      if (e.isLive || Boolean(e.youtubeUrl) || e.type === 'Live Stream') {
        const autoStatus = computeLiveEventStatus(e);
        if (autoStatus && e.liveStatus !== autoStatus) {
          return { ...e, liveStatus: autoStatus };
        }
      }
      return e;
    });
    return items.find(e => e.id === id) || null;
  },

  /**
   * Admin CRUD: Create new event or live event
   */
  async createEvent(input: Omit<EventItem, 'id'>): Promise<EventItem> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.post<EventItem>(apiConfig.endpoints.events, input);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    const rawItems = loadStoredEvents();
    const items = rawItems.map(e => {
      if (e.isLive || Boolean(e.youtubeUrl) || e.type === 'Live Stream') {
        const autoStatus = computeLiveEventStatus(e);
        if (autoStatus && e.liveStatus !== autoStatus) {
          return { ...e, liveStatus: autoStatus };
        }
      }
      return e;
    });

    let ytId = input.youtubeId;
    if (input.youtubeUrl && !ytId) {
      ytId = extractYouTubeId(input.youtubeUrl);
    }

    const isLive = Boolean(input.isLive || input.youtubeUrl);
    const computedStatus = isLive ? (input.liveStatus || computeLiveEventStatus(input)) : undefined;
    const posterUrl = input.posterUrl || input.bannerImage || (ytId ? getYouTubeThumbnail(ytId) : undefined);
    const bannerImage = input.bannerImage || posterUrl;

    const newEvent: EventItem = {
      ...input,
      id: `evt-${Date.now()}`,
      isLive,
      youtubeId: ytId,
      liveStatus: computedStatus,
      bannerImage,
      posterUrl,
      status: input.status || 'published',
    };

    saveEvents([newEvent, ...items]);
    return newEvent;
  },

  /**
   * Admin CRUD: Convenient helper to create a YouTube Live Event
   */
  async createLiveEvent(input: LiveEventInput): Promise<EventItem> {
    const ytId = extractYouTubeId(input.youtubeUrl);
    const thumbnail = input.posterUrl || input.thumbnailUrl || (ytId ? getYouTubeThumbnail(ytId) : undefined);
    const computedStatus = input.liveStatus || computeLiveEventStatus({ date: input.date, time: input.time, liveStatus: input.liveStatus });

    const eventPayload: Omit<EventItem, 'id'> = {
      title: input.title,
      type: 'Live Stream',
      date: input.date,
      time: input.time,
      location: input.location || 'YouTube Live Stream & Bharat Portal',
      mode: 'Online Webinar',
      description: input.description,
      speakers: input.speakers && input.speakers.length > 0 ? input.speakers : [
        { name: 'Bharat Collective Keynote', affiliation: 'Policy & Legal Council', role: 'Livestream Host' }
      ],
      registrationOpen: input.registrationOpen ?? true,
      bannerImage: thumbnail,
      posterUrl: thumbnail,
      status: input.status || 'published',
      isLive: true,
      youtubeUrl: input.youtubeUrl,
      youtubeId: ytId,
      liveStatus: computedStatus,
      customThumbnailUrl: input.thumbnailUrl || input.posterUrl,
    };

    return this.createEvent(eventPayload);
  },

  /**
   * Admin CRUD: Update existing event
   */
  async updateEvent(id: string, updates: Partial<EventItem>): Promise<EventItem> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.put<EventItem>(`${apiConfig.endpoints.events}/${id}`, updates);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    const rawItems = loadStoredEvents();
    const items = rawItems.map(e => {
      if (e.isLive || Boolean(e.youtubeUrl) || e.type === 'Live Stream') {
        const autoStatus = computeLiveEventStatus(e);
        if (autoStatus && e.liveStatus !== autoStatus) {
          return { ...e, liveStatus: autoStatus };
        }
      }
      return e;
    });
    const idx = items.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Event not found.');

    const current = items[idx];
    let ytId = updates.youtubeId ?? current.youtubeId;
    if (updates.youtubeUrl && updates.youtubeUrl !== current.youtubeUrl) {
      ytId = extractYouTubeId(updates.youtubeUrl);
    }

    const isLive = updates.isLive !== undefined ? updates.isLive : (current.isLive || Boolean(updates.youtubeUrl || current.youtubeUrl));
    
    let posterUrl = updates.posterUrl !== undefined
      ? updates.posterUrl
      : (updates.bannerImage !== undefined ? updates.bannerImage : current.posterUrl);

    let bannerImage = updates.bannerImage !== undefined
      ? updates.bannerImage
      : (updates.posterUrl !== undefined ? updates.posterUrl : current.bannerImage);

    if (updates.posterUrl && !updates.bannerImage) {
      bannerImage = updates.posterUrl;
    } else if (updates.bannerImage && !updates.posterUrl) {
      posterUrl = updates.bannerImage;
    }

    if (isLive && !bannerImage && ytId) {
      bannerImage = getYouTubeThumbnail(ytId);
      if (!posterUrl) posterUrl = bannerImage;
    }

    const updated: EventItem = {
      ...current,
      ...updates,
      youtubeId: ytId,
      isLive,
      bannerImage,
      posterUrl,
      customThumbnailUrl: updates.customThumbnailUrl || updates.posterUrl || current.customThumbnailUrl,
      liveStatus: isLive ? (updates.liveStatus || current.liveStatus || computeLiveEventStatus({ ...current, ...updates })) : current.liveStatus,
    };

    items[idx] = updated;
    saveEvents(items);
    return updated;
  },

  /**
   * Admin CRUD: Delete event
   */
  async deleteEvent(id: string): Promise<boolean> {
    if (!apiConfig.useMockData) {
      await apiClient.delete(`${apiConfig.endpoints.events}/${id}`);
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    recordDeletedEventId(id);
    const rawItems = loadStoredEvents();
    const items = rawItems.map(e => {
      if (e.isLive || Boolean(e.youtubeUrl) || e.type === 'Live Stream') {
        const autoStatus = computeLiveEventStatus(e);
        if (autoStatus && e.liveStatus !== autoStatus) {
          return { ...e, liveStatus: autoStatus };
        }
      }
      return e;
    });
    saveEvents(items.filter(e => e.id !== id));
    return true;
  },

  /**
   * Admin CRUD: Toggle publish/draft
   */
  async togglePublish(id: string): Promise<EventItem> {
    const item = await this.getEventById(id);
    if (!item) throw new Error('Event not found');
    const isCurrentlyPublished = !item.status || item.status === 'published';
    const newStatus = isCurrentlyPublished ? 'draft' : 'published';
    return this.updateEvent(id, { status: newStatus });
  }
};
