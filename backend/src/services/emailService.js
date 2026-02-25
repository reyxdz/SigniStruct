const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize email transporter
   * Supports multiple email providers via environment configuration
   */
  async initialize() {
    try {
      const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';

      if (emailProvider === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });
      } else if (emailProvider === 'sendgrid') {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
      } else {
        // Default SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'localhost',
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
              }
            : undefined
        });
      }

      // Verify transporter configuration
      await this.transporter.verify();
      this.initialized = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Email service initialization failed:', error.message);
      console.warn('Emails will not be sent. Configure .env file with email settings.');
      this.initialized = false;
    }
  }

  /**
   * Send email
   * @param {Object} mailOptions - Email options
   * @returns {Promise} Send result
   */
  async sendMail(mailOptions) {
    if (!this.initialized) {
      console.warn('Email service not initialized. Email not sent:', mailOptions.subject);
      return { skipped: true, reason: 'Email service not initialized' };
    }

    try {
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM_ADDRESS || 'noreply@signistruct.com',
        ...mailOptions
      });

      console.log(`Email sent: ${mailOptions.to} - ${result.messageId}`);
      return result;
    } catch (error) {
      console.error(`Failed to send email to ${mailOptions.to}:`, error.message);
      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  /**
   * Send HTML email with text fallback
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - HTML content
   * @param {string} text - Plain text fallback
   */
  async sendHtmlEmail(to, subject, html, text) {
    return this.sendMail({
      to,
      subject,
      html,
      text
    });
  }

  /**
   * Test email sending
   * @param {string} testEmail - Email address to test with
   */
  async testEmail(testEmail) {
    try {
      await this.sendMail({
        to: testEmail,
        subject: 'SigniStruct Email Test',
        text: 'This is a test email from SigniStruct.',
        html: '<p>This is a test email from SigniStruct.</p>'
      });
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

module.exports = new EmailService();
