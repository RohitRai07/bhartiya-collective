/**
 * Centralized Content Synchronization Service
 * 
 * Manages two-tier synchronization between:
 * 1. Local Browser Storage & React UI State
 * 2. Persistent Backend Server & Disk Storage (server/data/contentStore.json)
 * 3. Git Repository Sync Mirror (src/data/liveContent.json & public/uploads/)
 */

import { apiClient } from './apiClient';
import initialLiveContent from '../data/liveContent.json';

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
  error?: string;
}

export const contentSyncService = {
  /**
   * Get bundled fallback for any module from liveContent.json (or hardcoded fallback)
   */
  getBundledModule<T>(moduleName: string, fallback: T): T {
    if (initialLiveContent && (initialLiveContent as any)[moduleName]) {
      return (initialLiveContent as any)[moduleName] as T;
    }
    return fallback;
  },

  /**
   * Fetch all content from the backend server
   */
  async fetchLiveContent(): Promise<any | null> {
    try {
      const response = await apiClient.get<any>('/content');
      if (response?.data?.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Persist a module update to the backend server (which writes to server/data and src/data/liveContent.json)
   */
  async persistModule(moduleName: string, itemsOrItem: any, action: 'save' | 'delete' = 'save'): Promise<boolean> {
    try {
      if (action === 'delete') {
        const id = typeof itemsOrItem === 'string' ? itemsOrItem : itemsOrItem?.id;
        await apiClient.delete(`/content/${moduleName}/${id}`);
      } else {
        await apiClient.post(`/content/${moduleName}`, itemsOrItem);
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Upload an image to the backend server
   * The backend writes it to public/uploads/ and server/uploads/ and returns the relative path `uploads/filename.jpg`
   */
  async uploadPhysicalMedia(fileName: string, mimeType: string, dataUrl: string): Promise<string | null> {
    try {
      const res = await apiClient.post<any>('/admin/upload', {
        fileName,
        mimeType,
        dataUrl,
      });

      if (res?.data?.success && res.data.file?.url) {
        return res.data.file.url;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Gather all current local content and push a full snapshot to the backend server
   * Writes to server/data/contentStore.json AND src/data/liveContent.json!
   */
  async syncAllToProject(clientSnapshot?: any): Promise<SyncResult> {
    try {
      const snapshot = clientSnapshot || this.collectCurrentClientSnapshot();
      const res = await apiClient.post<any>('/content/sync-all', snapshot);
      if (res?.data?.success) {
        return {
          success: true,
          message: 'All content successfully saved to repository files (src/data/liveContent.json) and ready for GitHub push!',
          timestamp: res.data.lastUpdated || new Date().toISOString(),
        };
      }
      return { success: false, message: 'Server did not acknowledge sync.' };
    } catch (e: any) {
      return {
        success: false,
        message: 'Could not connect to backend server. Ensure backend is running.',
        error: e?.message,
      };
    }
  },

  /**
   * Collect all local content from localStorage
   */
  collectCurrentClientSnapshot(): any {
    if (typeof window === 'undefined') return initialLiveContent;

    const read = (key: string, fallback: any) => {
      try {
        const r = localStorage.getItem(key);
        return r ? JSON.parse(r) : fallback;
      } catch {
        return fallback;
      }
    };

    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      events: read('bharat_events', initialLiveContent.events),
      flagship: read('bharat_flagship_banner_config', initialLiveContent.flagship),
      publications: read('bharat_publications', initialLiveContent.publications),
      news: read('bharat_news_articles', initialLiveContent.news),
      research: read('bharat_research_domains', initialLiveContent.research),
      experts: read('bharat_scholars_list', initialLiveContent.experts),
      circulars: read('bharat_circulars', initialLiveContent.circulars),
      centres: read('bharat_centres', initialLiveContent.centres),
      nationalTeam: read('bharat_national_team', initialLiveContent.nationalTeam),
      stateChapters: read('bharat_state_chapters', initialLiveContent.stateChapters),
      podcasts: read('bharat_podcasts', initialLiveContent.podcasts),
      magazines: read('bharat_magazines', initialLiveContent.magazines),
      careers: read('bharat_careers', initialLiveContent.careers),
      inquiries: read('bharat_inquiries', initialLiveContent.inquiries),
      subscribers: read('bharat_newsletter_subscribers', initialLiveContent.subscribers),
      taxonomy: read('bharat_taxonomy_options', initialLiveContent.taxonomy),
      media: read('bharat_collective_media_library', initialLiveContent.media),
    };
  }
};
