const notificationService = require('./notificationService');
const SigningRequest = require('../models/SigningRequest');

class BackgroundJobService {
  /**
   * Process reminder emails
   * Called periodically (e.g., via cron job every hour)
   */
  static async processPendingReminders() {
    try {
      console.log('[BackgroundJob] Starting pending reminders process...');
      const results = await notificationService.sendPendingReminders();
      
      console.log(`[BackgroundJob] Reminders processed: ${results.sent} sent, ${results.failed} failed`);
      
      if (results.failed > 0) {
        console.warn('[BackgroundJob] Some reminders failed:', results.errors);
      }
      
      return results;
    } catch (error) {
      console.error('[BackgroundJob] Failed to process reminders:', error.message);
      throw error;
    }
  }

  /**
   * Expire overdue signing requests
   * Called periodically to clean up expired requests
   */
  static async expireOverdueRequests() {
    try {
      console.log('[BackgroundJob] Starting expiration process...');
      
      const now = new Date();
      const result = await SigningRequest.updateMany(
        {
          status: 'pending',
          expiration_date: { $lt: now }
        },
        {
          status: 'expired',
          updated_at: now
        }
      );

      console.log(`[BackgroundJob] Expired ${result.modifiedCount} overdue requests`);
      return result;
    } catch (error) {
      console.error('[BackgroundJob] Failed to expire requests:', error.message);
      throw error;
    }
  }

  /**
   * Cleanup old audit logs (optional archiving)
   * Called periodically to maintain database performance
   */
  static async cleanupOldAuditLogs(daysOld = 90) {
    try {
      const SignatureAuditLog = require('../models/SignatureAuditLog');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await SignatureAuditLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      console.log(`[BackgroundJob] Deleted ${result.deletedCount} old audit logs (${daysOld} days)`);
      return result;
    } catch (error) {
      console.error('[BackgroundJob] Failed to cleanup audit logs:', error.message);
      throw error;
    }
  }
}

module.exports = BackgroundJobService;
