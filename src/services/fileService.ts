/**
 * File Management Service
 * 
 * Provides an isolated service boundary for file uploads (PDF papers, CVs, photos).
 * Decouples the UI from underlying object storage (AWS S3, Google Cloud Storage, Azure Blob, MinIO).
 */

import { apiConfig } from '../config/apiConfig';
import { apiClient } from './apiClient';
import { UploadedFileMetadata } from '../types/file';

export const fileService = {
  /**
   * Upload a file with progress tracking
   */
  async uploadFile(
    file: File, 
    onProgress?: (percent: number) => void
  ): Promise<UploadedFileMetadata> {
    if (!apiConfig.useMockData) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<UploadedFileMetadata>(
        apiConfig.endpoints.files.upload,
        formData
      );
      return response.data;
    }

    // Mock upload simulation with progress increments
    let progress = 0;
    while (progress < 100) {
      await new Promise(r => setTimeout(r, 60));
      progress = Math.min(100, progress + 25);
      if (onProgress) onProgress(progress);
    }

    return {
      fileId: `file-${Date.now()}`,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      downloadUrl: URL.createObjectURL(file),
    };
  },

  /**
   * Get secure temporary download link
   */
  async getDownloadUrl(fileId: string): Promise<string> {
    if (!apiConfig.useMockData) {
      const res = await apiClient.get<{ downloadUrl: string }>(
        `${apiConfig.endpoints.files.getDownloadUrl}/${fileId}`
      );
      return res.data.downloadUrl;
    }

    return `https://storage.bhartiyacollective.org/public/${fileId}.pdf`;
  },

  /**
   * Convert an uploaded image file into a persistent Data URL (base64) with automatic resizing
   */
  async uploadImageAsDataUrl(
    file: File, 
    maxWidth = 1200, 
    maxHeight = 1200, 
    quality = 0.85
  ): Promise<{
    url: string;
    name: string;
    sizeKb: number;
    mimeType: string;
    dimensions?: { width: number; height: number };
  }> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('Please upload a valid image file (PNG, JPG, WebP, SVG, or GIF).'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;

        // If SVG or small image, return directly
        if (file.type === 'image/svg+xml' || file.size < 200 * 1024) {
          const result = {
            url: rawDataUrl,
            name: file.name,
            sizeKb: Math.round(file.size / 1024),
            mimeType: file.type,
          };
          this.saveToMediaLibrary(result);
          return resolve(result);
        }

        // Resize and optimize through offscreen Canvas if available
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
              if (width > height) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              const res = {
                url: rawDataUrl,
                name: file.name,
                sizeKb: Math.round(file.size / 1024),
                mimeType: file.type,
              };
              this.saveToMediaLibrary(res);
              return resolve(res);
            }

            ctx.drawImage(img, 0, 0, width, height);
            const optimizedUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
            const sizeKb = Math.round((optimizedUrl.length * 3) / 4 / 1024);

            const result = {
              url: optimizedUrl,
              name: file.name,
              sizeKb,
              mimeType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
              dimensions: { width, height },
            };

            this.saveToMediaLibrary(result);
            resolve(result);
          };

          img.onerror = () => {
            const fallback = {
              url: rawDataUrl,
              name: file.name,
              sizeKb: Math.round(file.size / 1024),
              mimeType: file.type,
            };
            this.saveToMediaLibrary(fallback);
            resolve(fallback);
          };

          img.src = rawDataUrl;
        } else {
          const fallback = {
            url: rawDataUrl,
            name: file.name,
            sizeKb: Math.round(file.size / 1024),
            mimeType: file.type,
          };
          this.saveToMediaLibrary(fallback);
          resolve(fallback);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Save uploaded image to persistent Admin Media Library
   */
  saveToMediaLibrary(item: { name: string; url: string; sizeKb: number; mimeType?: string }) {
    if (typeof window === 'undefined') return;
    try {
      const KEY = 'bharat_collective_media_library';
      const raw = localStorage.getItem(KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const newEntry = {
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: item.name,
        url: item.url,
        sizeKb: item.sizeKb,
        uploadedAt: new Date().toISOString(),
      };
      // Keep most recent 25 images to respect storage quota
      const updated = [newEntry, ...existing.filter((m: any) => m.url !== item.url)].slice(0, 25);
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save to media library (storage limit reached):', e);
    }
  },

  /**
   * Get all stored media from the Admin Media Library
   */
  getMediaLibrary(): { id: string; name: string; url: string; sizeKb: number; uploadedAt: string }[] {
    if (typeof window === 'undefined') return [];
    try {
      const KEY = 'bharat_collective_media_library';
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Delete an image from the Media Library
   */
  deleteFromMediaLibrary(id: string) {
    if (typeof window === 'undefined') return;
    try {
      const KEY = 'bharat_collective_media_library';
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const list = JSON.parse(raw);
      const filtered = list.filter((m: any) => m.id !== id);
      localStorage.setItem(KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete media item:', e);
    }
  }
};
