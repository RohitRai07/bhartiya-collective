import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface MediaRecord {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedAt: string;
}

export interface ContentStoreSchema {
  version: string;
  lastUpdated: string;
  events: any[];
  flagship: any;
  publications: any[];
  news: any[];
  research: any[];
  experts: any[];
  circulars: any[];
  centres: any[];
  nationalTeam: any[];
  stateChapters: any[];
  podcasts: any[];
  magazines: any[];
  careers: any[];
  inquiries: any[];
  subscribers: any[];
  taxonomy: Record<string, any>;
  media: MediaRecord[];
}

function resolvePaths() {
  const cwd = process.cwd();
  // Find project root regardless of whether process started in ./ or ./server
  const isServerSubdir = cwd.endsWith('server') || cwd.endsWith('server\\') || cwd.endsWith('server/');
  const rootDir = isServerSubdir ? path.resolve(cwd, '..') : cwd;

  return {
    rootDir,
    serverDataFile: path.resolve(rootDir, 'server/data/contentStore.json'),
    liveContentFile: path.resolve(rootDir, 'src/data/liveContent.json'),
    publicUploadsDir: path.resolve(rootDir, 'public/uploads'),
    serverUploadsDir: path.resolve(rootDir, 'server/uploads'),
  };
}

class ContentStorageEngine {
  private cache: ContentStoreSchema | null = null;

  private getPaths() {
    return resolvePaths();
  }

  /**
   * Load store from disk or initialize empty
   */
  public getSnapshot(): ContentStoreSchema {
    if (this.cache) return this.cache;

    const paths = this.getPaths();
    let data: ContentStoreSchema | null = null;

    // Check server data file first
    if (fs.existsSync(paths.serverDataFile)) {
      try {
        const raw = fs.readFileSync(paths.serverDataFile, 'utf8');
        data = JSON.parse(raw);
      } catch (err) {
        console.warn('Notice: Failed reading serverDataFile, trying liveContentFile:', err);
      }
    }

    // Fallback to frontend liveContentFile
    if (!data && fs.existsSync(paths.liveContentFile)) {
      try {
        const raw = fs.readFileSync(paths.liveContentFile, 'utf8');
        data = JSON.parse(raw);
      } catch (err) {
        console.warn('Notice: Failed reading liveContentFile:', err);
      }
    }

    if (!data) {
      data = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        events: [],
        flagship: {},
        publications: [],
        news: [],
        research: [],
        experts: [],
        circulars: [],
        centres: [],
        nationalTeam: [],
        stateChapters: [],
        podcasts: [],
        magazines: [],
        careers: [],
        inquiries: [],
        subscribers: [],
        taxonomy: {},
        media: [],
      };
    }

    this.cache = data;
    return this.cache;
  }

  /**
   * Save store to both server data file AND frontend liveContent.json for Git synchronization
   */
  public persist(updated: Partial<ContentStoreSchema>): ContentStoreSchema {
    const current = this.getSnapshot();
    const merged: ContentStoreSchema = {
      ...current,
      ...updated,
      lastUpdated: new Date().toISOString(),
    };

    const paths = this.getPaths();
    const jsonString = JSON.stringify(merged, null, 2);

    // 1. Write server/data/contentStore.json
    try {
      const serverDir = path.dirname(paths.serverDataFile);
      if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
      fs.writeFileSync(paths.serverDataFile, jsonString, 'utf8');
    } catch (err) {
      console.error('Failed writing server contentStore.json:', err);
    }

    // 2. Write src/data/liveContent.json (Repository sync mirror)
    try {
      const liveDir = path.dirname(paths.liveContentFile);
      if (!fs.existsSync(liveDir)) fs.mkdirSync(liveDir, { recursive: true });
      fs.writeFileSync(paths.liveContentFile, jsonString, 'utf8');
    } catch (err) {
      console.error('Failed writing src liveContent.json mirror:', err);
    }

    this.cache = merged;
    return merged;
  }

  /**
   * Retrieve records for a specific module
   */
  public getModule<T = any>(moduleName: keyof ContentStoreSchema): T {
    const snapshot = this.getSnapshot();
    return (snapshot[moduleName] || []) as T;
  }

  /**
   * Save an entire module
   */
  public saveModule(moduleName: keyof ContentStoreSchema, data: any): ContentStoreSchema {
    return this.persist({ [moduleName]: data });
  }

  /**
   * Upsert a single item in an array module
   */
  public upsertItem(moduleName: keyof ContentStoreSchema, item: any): any {
    const snapshot = this.getSnapshot();
    const current = (snapshot[moduleName] as any[]) || [];

    if (!Array.isArray(current)) {
      // Non-array module (e.g. flagship)
      this.saveModule(moduleName, item);
      return item;
    }

    const id = item.id || `item_${Date.now()}`;
    const itemWithId = { ...item, id };
    const index = current.findIndex(existing => existing.id === id);

    let updatedList: any[];
    if (index >= 0) {
      updatedList = [...current];
      updatedList[index] = { ...updatedList[index], ...itemWithId };
    } else {
      updatedList = [itemWithId, ...current];
    }

    this.saveModule(moduleName, updatedList);
    return itemWithId;
  }

  /**
   * Delete an item from an array module
   */
  public deleteItem(moduleName: keyof ContentStoreSchema, itemId: string): boolean {
    const snapshot = this.getSnapshot();
    const current = (snapshot[moduleName] as any[]) || [];

    if (!Array.isArray(current)) return false;

    const filtered = current.filter(item => item.id !== itemId);
    if (filtered.length === current.length) return false;

    this.saveModule(moduleName, filtered);
    return true;
  }

  /**
   * Save uploaded image or document to physical filesystem
   * Writes to public/uploads/ (so Vite & GitHub Pages can serve it) and server/uploads/
   */
  public saveUploadedFile(fileName: string, mimeType: string, dataUrlOrBase64: string): MediaRecord {
    const paths = this.getPaths();

    if (!fs.existsSync(paths.publicUploadsDir)) {
      fs.mkdirSync(paths.publicUploadsDir, { recursive: true });
    }
    if (!fs.existsSync(paths.serverUploadsDir)) {
      fs.mkdirSync(paths.serverUploadsDir, { recursive: true });
    }

    let base64Payload = dataUrlOrBase64;
    let detectedExt = '';

    if (dataUrlOrBase64.includes(';base64,')) {
      const parts = dataUrlOrBase64.split(';base64,');
      const header = parts[0].toLowerCase();
      base64Payload = parts[1];

      if (header.includes('image/png')) detectedExt = '.png';
      else if (header.includes('image/jpeg') || header.includes('image/jpg')) detectedExt = '.jpg';
      else if (header.includes('image/webp')) detectedExt = '.webp';
      else if (header.includes('image/svg')) detectedExt = '.svg';
      else if (header.includes('application/pdf')) detectedExt = '.pdf';
    }

    const originalExt = path.extname(fileName) || detectedExt || '.jpg';
    const cleanBaseName = path
      .basename(fileName, originalExt)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase()
      .slice(0, 40) || 'upload';

    const uniqueFileName = `${cleanBaseName}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${originalExt}`;
    const buffer = Buffer.from(base64Payload, 'base64');

    // Write physical files
    const publicPath = path.join(paths.publicUploadsDir, uniqueFileName);
    const serverPath = path.join(paths.serverUploadsDir, uniqueFileName);

    fs.writeFileSync(publicPath, buffer);
    fs.writeFileSync(serverPath, buffer);

    const mediaItem: MediaRecord = {
      id: `media_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      fileName: uniqueFileName,
      originalName: fileName,
      mimeType: mimeType || 'image/jpeg',
      sizeBytes: buffer.length,
      url: `uploads/${uniqueFileName}`,
      uploadedAt: new Date().toISOString(),
    };

    // Save to media list in store
    const snapshot = this.getSnapshot();
    const mediaList = snapshot.media || [];
    this.saveModule('media', [mediaItem, ...mediaList]);

    return mediaItem;
  }
}

export const contentStorage = new ContentStorageEngine();
