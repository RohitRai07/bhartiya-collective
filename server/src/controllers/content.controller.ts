import { Request, Response } from 'express';
import { contentStorage, ContentStoreSchema } from '../storage/contentStorage';

export class ContentController {
  /**
   * GET /api/content
   * Public endpoint to fetch all published website content
   */
  public async getSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const snapshot = contentStorage.getSnapshot();
      res.status(200).json({
        success: true,
        data: snapshot,
        lastUpdated: snapshot.lastUpdated,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve website content snapshot.',
        details: err?.message,
      });
    }
  }

  /**
   * GET /api/content/:module
   * Public endpoint to fetch records for a specific module
   */
  public async getModule(req: Request, res: Response): Promise<void> {
    const { module } = req.params;
    try {
      const data = contentStorage.getModule(module as keyof ContentStoreSchema);
      res.status(200).json({
        success: true,
        module,
        data,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `Failed to retrieve content for module '${module}'.`,
        details: err?.message,
      });
    }
  }

  /**
   * POST /api/content/:module
   * Admin endpoint to upsert an item in a module
   */
  public async upsertItem(req: Request, res: Response): Promise<void> {
    const { module } = req.params;
    const item = req.body;

    if (!item) {
      res.status(400).json({ error: 'Item payload is required.' });
      return;
    }

    try {
      const updatedItem = contentStorage.upsertItem(module as keyof ContentStoreSchema, item);
      res.status(200).json({
        success: true,
        message: `Item in module '${module}' saved and synchronized to persistent storage.`,
        data: updatedItem,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `Failed to save item in module '${module}'.`,
        details: err?.message,
      });
    }
  }

  /**
   * PUT /api/content/:module
   * Admin endpoint to replace/save an entire module array
   */
  public async saveModule(req: Request, res: Response): Promise<void> {
    const { module } = req.params;
    const { items } = req.body;

    if (!items) {
      res.status(400).json({ error: 'Items payload is required.' });
      return;
    }

    try {
      contentStorage.saveModule(module as keyof ContentStoreSchema, items);
      res.status(200).json({
        success: true,
        message: `Module '${module}' saved and synchronized to persistent storage.`,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `Failed to update module '${module}'.`,
        details: err?.message,
      });
    }
  }

  /**
   * DELETE /api/content/:module/:id
   * Admin endpoint to delete an item
   */
  public async deleteItem(req: Request, res: Response): Promise<void> {
    const { module, id } = req.params;

    try {
      const deleted = contentStorage.deleteItem(module as keyof ContentStoreSchema, id);
      if (deleted) {
        res.status(200).json({
          success: true,
          message: `Item '${id}' removed from module '${module}'.`,
        });
      } else {
        res.status(404).json({
          success: false,
          error: `Item '${id}' not found in module '${module}'.`,
        });
      }
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `Failed to delete item '${id}' from module '${module}'.`,
        details: err?.message,
      });
    }
  }

  /**
   * POST /api/content/sync-all
   * Admin endpoint to synchronize entire client state to disk
   */
  public async syncAll(req: Request, res: Response): Promise<void> {
    const clientData = req.body;

    if (!clientData || typeof clientData !== 'object') {
      res.status(400).json({ error: 'Valid client data object is required.' });
      return;
    }

    try {
      const persisted = contentStorage.persist(clientData);
      res.status(200).json({
        success: true,
        message: 'All content successfully synchronized to persistent server and repository storage.',
        lastUpdated: persisted.lastUpdated,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to synchronize content state.',
        details: err?.message,
      });
    }
  }
}

export const contentController = new ContentController();
