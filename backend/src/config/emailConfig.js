/**
 * Email Configuration
 * Handles email service initialization and setup
 */

const emailService = require('./services/emailService');

/**
 * Initialize all email services
 * Should be called during application startup
 */
async function initializeEmailServices() {
  try {
    console.log('Initializing email services...');
    
    // Initialize email transporter
    await emailService.initialize();
    
    // Log configuration
    const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
    const isInitialized = emailService.isInitialized();
    
    if (isInitialized) {
      console.log(`✓ Email service initialized (Provider: ${emailProvider})`);
      console.log(`  From: ${process.env.EMAIL_FROM_ADDRESS || 'noreply@signistruct.com'}`);
    } else {
      console.warn('⚠ Email service not initialized. Email notifications will not be sent.');
      console.warn('  Configure environment variables:');
      console.warn('    - EMAIL_PROVIDER (smtp|gmail|sendgrid)');
      console.warn('    - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD');
      console.warn('    - Or: GMAIL_USER, GMAIL_APP_PASSWORD');
      console.warn('    - Or: SENDGRID_API_KEY');
    }

    return isInitialized;
  } catch (error) {
    console.error('Failed to initialize email services:', error.message);
    console.warn('Application will continue without email notifications.');
    return false;
  }
}

/**
 * Setup background jobs for email processing
 * Uses node-cron for scheduling
 */
async function setupEmailBackgroundJobs() {
  try {
    const cron = require('node-cron');
    const BackgroundJobService = require('./services/backgroundJobService');

    console.log('Setting up email background jobs...');

    // Process reminders every hour
    cron.schedule('0 * * * *', async () => {
      console.log('[CRON] Running pending reminders job (hourly)...');
      try {
        await BackgroundJobService.processPendingReminders();
      } catch (error) {
        console.error('[CRON] Reminder job failed:', error.message);
      }
    });

    // Expire overdue requests every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('[CRON] Running expiration job (every 6 hours)...');
      try {
        await BackgroundJobService.expireOverdueRequests();
      } catch (error) {
        console.error('[CRON] Expiration job failed:', error.message);
      }
    });

    // Clean up old audit logs daily
    cron.schedule('0 2 * * *', async () => {
      console.log('[CRON] Running audit log cleanup job (daily)...');
      try {
        await BackgroundJobService.cleanupOldAuditLogs(90);
      } catch (error) {
        console.error('[CRON] Cleanup job failed:', error.message);
      }
    });

    console.log('✓ Email background jobs configured:');
    console.log('  - Reminders: Every hour');
    console.log('  - Expiration: Every 6 hours');
    console.log('  - Audit cleanup: Daily at 2 AM');

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn('⚠ node-cron not installed. Background jobs disabled.');
      console.warn('  Install with: npm install node-cron');
    } else {
      console.error('Failed to setup background jobs:', error.message);
    }
  }
}

module.exports = {
  initializeEmailServices,
  setupEmailBackgroundJobs
};
