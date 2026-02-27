import nodemailer from 'nodemailer';
import { logger } from './logger';
import { createVerificationEmailTemplate } from '../templates/verificationEmail';
import { createTwoFactorEmailTemplate } from '../templates/twoFactorEmail';


interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM,
      NODE_ENV
    } = process.env;
    console.log('Testing email configuration...');

    // In development, use ethereal email (test account) if SMTP not configured
    if (NODE_ENV === 'development' && (!SMTP_HOST || !SMTP_USER)) {
      logger.warn('SMTP not configured. Emails will be logged to console only.');
      this.isConfigured = false;
      return;
    }

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      logger.warn('Email service not fully configured. Some SMTP variables are missing.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      this.isConfigured = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn(`[EMAIL NOT SENT] To: ${options.to}, Subject: ${options.subject}`);
      logger.warn('Email content (HTML):', options.html);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info(`Email sent successfully to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendVerificationEmail(
    to: string,
    firstName: string,
    verificationToken: string
  ): Promise<boolean> {
    const verificationUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const { html, text } = createVerificationEmailTemplate({
      firstName,
      verificationUrl,
      currentYear: new Date().getFullYear()
    });

    return this.sendEmail({
      to,
      subject: 'Verify Your Email Address',
      html,
      text,
    });
  }

  async send2FACode(to: string, firstName: string, code: string): Promise<boolean> {
    const { html, text } = createTwoFactorEmailTemplate({
      firstName,
      code,
      currentYear: new Date().getFullYear()
    });

    return this.sendEmail({
      to,
      subject: 'Your Login Verification Code',
      html,
      text,
    });
  }

}

// Export singleton instance
export const emailService = new EmailService();
