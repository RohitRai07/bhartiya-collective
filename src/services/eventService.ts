/**
 * Event Service
 * 
 * Manages symposia, roundtables, public lectures, and colloquiums.
 * Decoupled from UI components and persistent across Admin updates.
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { EventItem } from '../types/event';
import { mockEvents } from '../data/mockEvents';

const STORAGE_KEY = 'bharat_collective_events';

function loadStoredEvents(): EventItem[] {
  if (typeof window === 'undefined') return mockEvents;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = mockEvents.map(e => ({
        ...e,
        status: 'published' as const,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return mockEvents;
  }
}

function saveEvents(list: EventItem[]) {
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
   * Admin CRUD: Create new event
   */
  async createEvent(input: Omit<EventItem, 'id'>): Promise<EventItem> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.post<EventItem>(apiConfig.endpoints.events, input);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    const items = loadStoredEvents();
    const newEvent: EventItem = {
      ...input,
      id: `evt-${Date.now()}`,
      status: input.status || 'published',
    };

    saveEvents([newEvent, ...items]);
    return newEvent;
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

    const updated: EventItem = { ...items[idx], ...updates };
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
