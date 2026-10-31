import { Request, Response } from 'express';
import { notificationService, NotificationPayload } from '../services/notification.service';
import { emailService } from '../services/email.service';
import { validateEmailAddress } from '../middleware/validation.middleware';

/**
 * Dispatch single notification (Admin authenticated)
 */
export const sendNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as NotificationPayload;

    if (!payload.type || (!payload.email && !payload.phone)) {
      res.status(400).json({ error: 'Notification type and recipient (email or phone) are required.' });
      return;
    }

    // Validate email format if email channel is requested
    if (payload.channels?.email && payload.email) {
      const emailVal = validateEmailAddress(payload.email);
      if (!emailVal.isValid) {
        res.status(400).json({ error: emailVal.error || 'Please enter a valid email address.' });
        return;
      }
      payload.email = emailVal.formatted;
    }

    const result = await notificationService.dispatchNotification(payload);

    res.status(200).json({
      success: true,
      message: 'Notification processed successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Send Notification Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Dispatch broadcast notification to multiple selected subscribers/contacts (Admin authenticated)
 * Enforces:
 * - Recipient validation
 * - Deduplication (prevents sending duplicate emails in a single campaign)
 * - Individual delivery (no recipient email addresses exposed to other recipients)
 * - Safe batching and activity logging
 */
export const broadcastNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscribers, type, dynamicData, channels } = req.body;

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      res.status(400).json({ error: 'Subscribers array is required' });
      return;
    }

    const batchTrackingId = `batch_${Date.now()}`;
    const ch = channels || { email: true, sms: false, whatsapp: false };

    // Process notification
    const result = await notificationService.broadcastNotification({
      subscribers,
      type: type || 'ADMIN_NOTIFICATION',
      dynamicData: dynamicData || {},
      channels: ch,
      batchId: batchTrackingId,
    });

    res.status(200).json({
      success: true,
      message: `Notification broadcast processed for ${result.total} recipient(s)`,
      data: {
        batchId: batchTrackingId,
        total: result.total,
        sent: result.sent,
        failed: result.failed,
      },
    });
  } catch (error: any) {
    console.error('Broadcast Notification Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Fetch Email Activity Logs (Admin authenticated)
 */
export const getEmailActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt((req.query.limit as string) || '100');
    const logs = emailService.getActivityLogs(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error: any) {
    console.error('Get Email Activity Logs Error:', error);
    res.status(500).json({ error: 'Failed to retrieve email activity logs' });
  }
};

/**
 * Send a verified test email using office@bharatcollective.in (Admin authenticated)
 */
export const sendTestEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Please enter a valid recipient email address.' });
      return;
    }

    const val = validateEmailAddress(email);
    if (!val.isValid) {
      res.status(400).json({ error: val.error || 'Please enter a valid email address.' });
      return;
    }

    const subject = 'Test Dispatch: Bharat Collective Secretariat Communications';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #781717; margin-top: 0;">Bharat Collective Foundation</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Namaste,<br/><br/>
          This is a verified test email dispatched from <strong>office@bharatcollective.in</strong> via GoDaddy Professional Email (Titan SMTP).
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin: 16px 0;">
          <strong>Sender:</strong> Bharat Collective Foundation &lt;office@bharatcollective.in&gt;<br/>
          <strong>Timestamp:</strong> ${new Date().toISOString()}<br/>
          <strong>Status:</strong> Verified Operational
        </div>
        <p style="color: #64748b; font-size: 12px;">Warm regards,<br/>Administrative Secretariat</p>
      </div>
    `;

    const success = await emailService.sendEmail({
      to: val.formatted,
      subject,
      html,
      category: 'admin_test',
    });

    if (success) {
      res.status(200).json({
        success: true,
        message: `Verified test email successfully dispatched to ${val.formatted}`,
        sender: 'office@bharatcollective.in',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email through the email gateway. Please check server logs and SMTP configuration.',
      });
    }
  } catch (error: any) {
    console.error('Send Test Email Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Verify GoDaddy Titan SMTP Connection (Admin authenticated)
 */
export const verifySmtpConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await emailService.verifyConnection();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: any) {
    console.error('Verify SMTP Connection Error:', error);
    res.status(500).json({ success: false, message: 'SMTP verification failed' });
  }
};
