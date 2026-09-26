/**
 * News & Insights Service
 * 
 * Manages institutional communiques, essays, and perspectives.
 * Persists updates reactively so changes made in the Admin Portal reflect immediately
 * on the public website.
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { NewsArticle } from '../types/news';
import { mockNews } from '../data/mockNews';

const STORAGE_KEY = 'bharat_collective_news';

function loadStoredNews(): NewsArticle[] {
  if (typeof window === 'undefined') return mockNews;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = mockNews.map(n => ({
        ...n,
        status: 'published' as const,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return mockNews;
  }
}

function saveNews(list: NewsArticle[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'news' } }));
  } catch (e) {
    console.error('Failed to save news articles:', e);
  }
}

export const newsService = {
  /**
   * Fetch all news articles, optionally including drafts
   */
  async getNews(includeDrafts: boolean = false): Promise<NewsArticle[]> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.get<NewsArticle[]>(apiConfig.endpoints.news);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 60));
    const items = loadStoredNews();
    if (includeDrafts) return items;
    return items.filter(n => !n.status || n.status === 'published');
  },

  /**
   * Fetch article by slug
   */
  async getArticleBySlug(slug: string): Promise<NewsArticle | null> {
    const articles = await this.getNews(true);
    return articles.find(a => a.slug === slug) || null;
  },

  /**
   * Fetch article by ID
   */
  async getArticleById(id: string): Promise<NewsArticle | null> {
    const articles = await this.getNews(true);
    return articles.find(a => a.id === id) || null;
  },

  /**
   * Admin CRUD: Create new article or insight
   */
  async createArticle(input: Omit<NewsArticle, 'id'>): Promise<NewsArticle> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.post<NewsArticle>(apiConfig.endpoints.news, input);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 120));
    const items = loadStoredNews();
    const newArticle: NewsArticle = {
      ...input,
      id: `news-${Date.now()}`,
      slug: input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      status: input.status || 'published',
      publishedDate: input.publishedDate || new Date().toISOString().split('T')[0],
      readTime: input.readTime || '4 min read',
    };

    saveNews([newArticle, ...items]);
    return newArticle;
  },

  /**
   * Admin CRUD: Update existing article
   */
  async updateArticle(id: string, updates: Partial<NewsArticle>): Promise<NewsArticle> {
    if (!apiConfig.useMockData) {
      const response = await apiClient.put<NewsArticle>(`${apiConfig.endpoints.news}/${id}`, updates);
      return response.data;
    }

    await new Promise(resolve => setTimeout(resolve, 120));
    const items = loadStoredNews();
    const idx = items.findIndex(n => n.id === id);
    if (idx === -1) throw new Error('Article not found.');

    const updated: NewsArticle = { ...items[idx], ...updates };
    items[idx] = updated;
    saveNews(items);
    return updated;
  },

  /**
   * Admin CRUD: Delete article
   */
  async deleteArticle(id: string): Promise<boolean> {
    if (!apiConfig.useMockData) {
      await apiClient.delete(`${apiConfig.endpoints.news}/${id}`);
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    const items = loadStoredNews();
    saveNews(items.filter(n => n.id !== id));
    return true;
  },

  /**
   * Admin CRUD: Toggle publish/draft
   */
  async togglePublish(id: string): Promise<NewsArticle> {
    const item = await this.getArticleById(id);
    if (!item) throw new Error('Article not found');
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    return this.updateArticle(id, { status: newStatus });
  }
};
