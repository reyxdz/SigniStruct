const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const auditController = require('../controllers/auditController');

/**
 * Audit Logging Routes
 * All routes require authentication
 * GET  /api/audit-logs
 * GET  /api/audit-logs/filters/:field
 * GET  /api/audit-logs/export/csv
 * GET  /api/audit-logs/search
 * GET  /api/audit-logs/statistics
 * GET  /api/compliance-report
 */

// Require authentication for all audit routes
router.use(authMiddleware);

// GET /api/audit-logs
// Get audit logs with filters and pagination
router.get('/', auditController.getAuditLogs);

// GET /api/audit-logs/filters/:field
// Get available filter options
router.get('/filters/:field', auditController.getFilterOptions);

// GET /api/audit-logs/export/csv
// Export audit logs as CSV
router.get('/export/csv', auditController.exportAuditLogsAsCSV);

// GET /api/audit-logs/search
// Search audit logs
router.get('/search', auditController.searchAuditLogs);

// GET /api/audit-logs/statistics
// Get audit statistics
router.get('/statistics', auditController.getAuditStatistics);

// GET /api/compliance-report
// Generate compliance report
router.get('/compliance-report', auditController.generateComplianceReport);

module.exports = router;
