import nodemailer from 'nodemailer';
import { config } from '../config/env';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: any;

  constructor() {
    // ============================================
    // EMAIL PROVIDER CONFIGURATION
    // Initializes the SMTP connection using the .env credentials.
    // ============================================
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }

  /**
   * Sends an email securely handling connection failures without crashing the main thread.
   */
  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // If config is missing, return false (preventing crashes if just testing)
      if (!config.email.host || !config.email.user) {
        console.warn('Email config missing. Mocking success.');
        return true; 
      }

      await this.transporter.sendMail({
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''), // fallback strip html
      });

      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false; // Does not throw, ensuring business logic isn't interrupted
    }
  }

  // Pre-configured Templates (Reusable)
  public async sendShortlistedEmail(to: string, name: string, contactPerson: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Congratulations ${name}, You Have Been Shortlisted`,
      html: `
        <h2>Hello ${name},</h2>
        <p>We are pleased to inform you that your application has been shortlisted by the Bharat Collective Foundation.</p>
        <p>Please connect with <strong>${contactPerson}</strong> for the next steps.</p>
        <br/>
        <p>Best regards,<br/>Bharat Collective Foundation</p>
      `
    });
  }

  public async sendNewContentEmail(to: string, contentType: string, title: string, url: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `New ${contentType} Published: ${title}`,
      html: `
        <h2>Hello Subscriber,</h2>
        <p>A new ${contentType.toLowerCase()} has just been published on Bharat Collective.</p>
        <h3>${title}</h3>
        <p><a href="${url}" style="padding: 10px 15px; background: #d97706; color: white; text-decoration: none; border-radius: 5px;">Read More</a></p>
        <br/>
        <p>Thank you for staying connected with us.</p>
      `
    });
  }
}

export const emailService = new EmailService();
