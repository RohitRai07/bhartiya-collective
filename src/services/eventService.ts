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
    if (!raw) {
      const initial = mockEvents.map(e => {
        const item: EventItem = {
          ...e,
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
    const parsed: EventItem[] = JSON.parse(raw);
    let needsUpdate = false;
    const migrated = parsed.map(evt => {
      let updatedEvt = { ...evt };
      const defaultEvt = mockEvents.find(m => m.id === evt.id);
      if (defaultEvt && (!evt.bannerImage || evt.bannerImage === '/images/bharat-dialogue-ucc-banner.jpg')) {
        needsUpdate = true;
        updatedEvt.bannerImage = defaultEvt.bannerImage;
      }
      if (updatedEvt.youtubeUrl && !updatedEvt.youtubeId) {
        updatedEvt.youtubeId = extractYouTubeId(updatedEvt.youtubeUrl);
        needsUpdate = true;
      }
      return updatedEvt;
    });
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
    const items = loadStoredEvents();
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

    const items = loadStoredEvents();
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
    const items = loadStoredEvents();

    let ytId = input.youtubeId;
    if (input.youtubeUrl && !ytId) {
      ytId = extractYouTubeId(input.youtubeUrl);
    }

    const isLive = Boolean(input.isLive || input.youtubeUrl);
    const computedStatus = isLive ? (input.liveStatus || computeLiveEventStatus(input)) : undefined;
    const bannerImage = input.bannerImage || (ytId ? getYouTubeThumbnail(ytId) : undefined);

    const newEvent: EventItem = {
      ...input,
      id: `evt-${Date.now()}`,
      isLive,
      youtubeId: ytId,
      liveStatus: computedStatus,
      bannerImage,
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
    const thumbnail = input.thumbnailUrl || (ytId ? getYouTubeThumbnail(ytId) : undefined);
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
      status: input.status || 'published',
      isLive: true,
      youtubeUrl: input.youtubeUrl,
      youtubeId: ytId,
      liveStatus: computedStatus,
      customThumbnailUrl: input.thumbnailUrl,
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
    const items = loadStoredEvents();
    const idx = items.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Event not found.');

    const current = items[idx];
    let ytId = updates.youtubeId ?? current.youtubeId;
    if (updates.youtubeUrl && updates.youtubeUrl !== current.youtubeUrl) {
      ytId = extractYouTubeId(updates.youtubeUrl);
    }

    const isLive = updates.isLive !== undefined ? updates.isLive : (current.isLive || Boolean(updates.youtubeUrl || current.youtubeUrl));
    let bannerImage = updates.bannerImage || current.bannerImage;
    if (isLive && !bannerImage && ytId) {
      bannerImage = getYouTubeThumbnail(ytId);
    }

    const updated: EventItem = {
      ...current,
      ...updates,
      youtubeId: ytId,
      isLive,
      bannerImage,
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
    const items = loadStoredEvents();
    saveEvents(items.filter(e => e.id !== id));
    return true;
  },

  /**
   * Admin CRUD: Toggle publish/draft
   */
  async togglePublish(id: string): Promise<EventItem> {
    const item = await this.getEventById(id);
    if (!item) throw new Error('Event not found');
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    return this.updateEvent(id, { status: newStatus });
  }
};
