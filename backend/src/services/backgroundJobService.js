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

  /**
   * Check certificate expiry and send notifications
   * Called periodically (e.g., daily) to notify users of expiring certificates
   */
  static async checkCertificateExpiry() {
    try {
      console.log('[BackgroundJob] Starting certificate expiry check...');
      
      const UserCertificate = require('../models/UserCertificate');
      const User = require('../models/User');
      const SignatureAuditLog = require('../models/SignatureAuditLog');
      
      const now = new Date();
      let sentCount = 0;
      let failedCount = 0;

      // Check for certificates expiring in 30 days
      const expiring30Days = new Date();
      expiring30Days.setDate(expiring30Days.getDate() + 30);

      const certificatesExpiring30 = await UserCertificate.find({
        status: 'active',
        not_after: {
          $gte: now,
          $lte: expiring30Days
        },
        'expiry_notifications.notify_30_days.notified': false
      });

      for (const cert of certificatesExpiring30) {
        try {
          const user = await User.findById(cert.user_id);
          if (user && user.email) {
            await notificationService.sendCertificateExpiryNotification(
              user.email,
              user.name || user.first_name,
              cert.certificate_id,
              cert.not_after,
              '30 days'
            );

            // Mark as notified
            cert.expiry_notifications.notify_30_days.notified = true;
            cert.expiry_notifications.notify_30_days.sent_at = now;
            await cert.save();

            // Log notification
            await SignatureAuditLog.create({
              action: 'certificate_expiry_notification',
              signer_id: cert.user_id,
              details: {
                certificate_id: cert.certificate_id,
                days_until_expiry: 30,
                expiry_date: cert.not_after,
                notification_sent_at: now
              }
            });

            sentCount++;
          }
        } catch (error) {
          console.error(`[BackgroundJob] Failed to notify for certificate ${cert.certificate_id}:`, error.message);
          failedCount++;
        }
      }

      // Check for certificates expiring in 7 days
      const expiring7Days = new Date();
      expiring7Days.setDate(expiring7Days.getDate() + 7);

      const certificatesExpiring7 = await UserCertificate.find({
        status: 'active',
        not_after: {
          $gte: now,
          $lte: expiring7Days
        },
        'expiry_notifications.notify_7_days.notified': false
      });

      for (const cert of certificatesExpiring7) {
        try {
          const user = await User.findById(cert.user_id);
          if (user && user.email) {
            await notificationService.sendCertificateExpiryNotification(
              user.email,
              user.name || user.first_name,
              cert.certificate_id,
              cert.not_after,
              '7 days'
            );

            cert.expiry_notifications.notify_7_days.notified = true;
            cert.expiry_notifications.notify_7_days.sent_at = now;
            await cert.save();

            await SignatureAuditLog.create({
              action: 'certificate_expiry_notification',
              signer_id: cert.user_id,
              details: {
                certificate_id: cert.certificate_id,
                days_until_expiry: 7,
                expiry_date: cert.not_after,
                notification_sent_at: now
              }
            });

            sentCount++;
          }
        } catch (error) {
          console.error(`[BackgroundJob] Failed to notify for certificate ${cert.certificate_id}:`, error.message);
          failedCount++;
        }
      }

      // Check for certificates expiring in 1 day
      const expiring1Day = new Date();
      expiring1Day.setDate(expiring1Day.getDate() + 1);

      const certificatesExpiring1 = await UserCertificate.find({
        status: 'active',
        not_after: {
          $gte: now,
          $lte: expiring1Day
        },
        'expiry_notifications.notify_1_day.notified': false
      });

      for (const cert of certificatesExpiring1) {
        try {
          const user = await User.findById(cert.user_id);
          if (user && user.email) {
            await notificationService.sendCertificateExpiryNotification(
              user.email,
              user.name || user.first_name,
              cert.certificate_id,
              cert.not_after,
              '1 day'
            );

            cert.expiry_notifications.notify_1_day.notified = true;
            cert.expiry_notifications.notify_1_day.sent_at = now;
            await cert.save();

            await SignatureAuditLog.create({
              action: 'certificate_expiry_notification',
              signer_id: cert.user_id,
              details: {
                certificate_id: cert.certificate_id,
                days_until_expiry: 1,
                expiry_date: cert.not_after,
                notification_sent_at: now
              }
            });

            sentCount++;
          }
        } catch (error) {
          console.error(`[BackgroundJob] Failed to notify for certificate ${cert.certificate_id}:`, error.message);
          failedCount++;
        }
      }

      // Mark expired certificates as expired
      const expiredCerts = await UserCertificate.find({
        status: 'active',
        not_after: { $lt: now }
      });

      for (const cert of expiredCerts) {
        cert.status = 'expired';
        await cert.save();

        await SignatureAuditLog.create({
          action: 'certificate_expired',
          signer_id: cert.user_id,
          details: {
            certificate_id: cert.certificate_id,
            expiry_date: cert.not_after,
            marked_expired_at: now
          }
        });
      }

      console.log(`[BackgroundJob] Certificate expiry check complete: ${sentCount} notifications sent, ${failedCount} failed`);
      
      return {
        notifications_sent: sentCount,
        notifications_failed: failedCount,
        certificates_expired: expiredCerts.length
      };
    } catch (error) {
      console.error('[BackgroundJob] Failed certificate expiry check:', error.message);
      throw error;
    }
  }

  /**
   * Cleanup superseded and revoked certificates
   * Optionally removes certificates older than the specified days
   */
  static async cleanupOldCertificates(daysOld = 365) {
    try {
      const UserCertificate = require('../models/UserCertificate');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await UserCertificate.deleteMany({
        $or: [
          {
            status: 'revoked',
            revoked_at: { $lt: cutoffDate }
          },
          {
            status: 'superseded',
            superseded_at: { $lt: cutoffDate }
          }
        ]
      });

      console.log(`[BackgroundJob] Cleaned up ${result.deletedCount} old certificates (${daysOld} days old)`);
      return result;
    } catch (error) {
      console.error('[BackgroundJob] Failed to cleanup old certificates:', error.message);
      throw error;
    }
  }

}

module.exports = BackgroundJobService;
