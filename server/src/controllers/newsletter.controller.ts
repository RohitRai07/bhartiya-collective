import { Request, Response } from 'express';
import { newsletterService } from '../services/newsletter.service';

export const subscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, phone, source } = req.body || {};

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
        code: 'INVALID_INPUT',
      });
      return;
    }

    const result = await newsletterService.subscribe({
      email,
      name,
      phone,
      source,
    });

    if (!result.success) {
      const statusCode = result.status === 'invalid_email' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: result.message,
        status: result.status,
      });
      return;
    }

    if (result.status === 'already_subscribed') {
      res.status(200).json({
        success: true,
        status: 'already_subscribed',
        message: result.message,
        data: result.data,
      });
      return;
    }

    res.status(200).json({
      success: true,
      status: 'success',
      message: result.message,
      data: result.data,
      notificationSent: result.notificationSent,
    });
  } catch (error: any) {
    console.error('Newsletter Controller Subscribe Error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your subscription.',
    });
  }
};

export const unsubscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Email address is required.',
      });
      return;
    }

    const result = newsletterService.unsubscribe(email);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Newsletter Controller Unsubscribe Error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your unsubscribe request.',
    });
  }
};

export const listSubscribers = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscribers = newsletterService.getAllSubscribers();
    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers,
    });
  } catch (error: any) {
    console.error('Newsletter Controller List Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve newsletter subscribers.',
    });
  }
};
