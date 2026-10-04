import { Request, Response } from 'express';
import { notificationService, NotificationPayload } from '../services/notification.service';

export const sendNotification = async (req: Request, res: Response) => {
  try {
    const payload = req.body as NotificationPayload;

    if (!payload.type || (!payload.email && !payload.phone)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const result = await notificationService.dispatchNotification(payload);

    res.status(200).json({
      success: true,
      message: 'Notification queued for processing',
      data: result
    });
  } catch (error) {
    console.error('Send Notification Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const broadcastNotification = async (req: Request, res: Response) => {
  try {
    const { subscribers, type, dynamicData, channels } = req.body;
    
    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return res.status(400).json({ error: 'Subscribers array is required' });
    }

    // Process all subscribers asynchronously
    // In production, split into chunks or push to queue
    const batchTrackingId = `batch_${Date.now()}`;
    
    setTimeout(() => {
      for (const sub of subscribers) {
        notificationService.dispatchNotification({
          userId: sub.id,
          name: sub.name || 'Subscriber',
          email: sub.email,
          phone: sub.phone,
          channels,
          type,
          dynamicData
        }).catch(err => console.error(err));
      }
    }, 0);

    res.status(200).json({
      success: true,
      message: `Broadcast queued for ${subscribers.length} subscribers`,
      batchId: batchTrackingId
    });
  } catch (error) {
    console.error('Broadcast Notification Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
