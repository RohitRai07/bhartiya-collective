import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  sms: {
    apiUrl: process.env.SMS_API_URL || '',
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || '',
    templates: {
      shortlist: process.env.SMS_TEMPLATE_ID_SHORTLIST || '',
      select: process.env.SMS_TEMPLATE_ID_SELECT || '',
      general: process.env.SMS_TEMPLATE_ID_GENERAL || '',
    }
  },

  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '"Bharat Collective" <noreply@bharatcollective.org>',
  },

  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0/',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiKey: process.env.WHATSAPP_API_KEY || '',
    templates: {
      shortlist: process.env.WHATSAPP_TEMPLATE_SHORTLIST || '',
      publish: process.env.WHATSAPP_TEMPLATE_PUBLISH || '',
    }
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  }
};
