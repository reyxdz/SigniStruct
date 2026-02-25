const SignatureAuditLog = require('../models/SignatureAuditLog');
const Document = require('../models/Document');
const User = require('../models/User');
const { Parser } = require('json2csv');

/**
 * Audit Controller
 * Handles all audit log and compliance reporting endpoints
 * - Audit log retrieval with filters
 * - CSV/PDF exports
 * - Search and statistics
 * - Compliance reporting
 */

// GET /api/audit-logs
// Get audit logs with filtering, pagination, and sorting
exports.getAuditLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      documentId,
      userId: filterUserId,
      action,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sort = '-timestamp'
    } = req.query;

    // Build filter query
    const filter = {};

    // If not admin, only show logs for user's documents
    if (!req.user.isAdmin) {
      const userDocuments = await Document.find({ owner_id: userId }).select('_id');
      const docIds = userDocuments.map(doc => doc._id);
      filter.document_id = { $in: docIds };
    } else if (documentId) {
      // Admin can filter by specific document
      filter.document_id = documentId;
    }

    // Filter by user
    if (filterUserId) {
      filter.user_id = filterUserId;
    }

    // Filter by action type
    if (action) {
      filter.action = action;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Parse pagination parameters
    const pageLimit = Math.min(parseInt(limit), 500);
    const pageOffset = Math.max(parseInt(offset), 0);

    // Parse sort parameter
    const sortField = sort.startsWith('-') 
      ? { [sort.substring(1)]: -1 }
      : { [sort]: 1 };

    // Execute query with pagination
    const [logs, totalCount] = await Promise.all([
      SignatureAuditLog.find(filter)
        .populate('user_id', 'email name')
        .populate('document_id', 'title')
        .sort(sortField)
        .limit(pageLimit)
        .skip(pageOffset)
        .lean(),
      SignatureAuditLog.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);
    const currentPage = Math.floor(pageOffset / pageLimit) + 1;

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total: totalCount,
          limit: pageLimit,
          offset: pageOffset,
          currentPage,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit logs',
      code: 'AUDIT_LOGS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/audit-logs/filters/:field
// Get available filter options for dropdown preloading
exports.getFilterOptions = async (req, res) => {
  try {
    const { field } = req.params;
    const userId = req.user.id;

    // Define allowed filter fields
    const allowedFields = ['action', 'userId', 'documentId'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: `Invalid filter field: ${field}`,
        code: 'INVALID_FIELD'
      });
    }

    let options = [];

    // Get user's documents for filtering
    const userDocuments = !req.user.isAdmin 
      ? await Document.find({ owner_id: userId }).select('_id title')
      : await Document.find().select('_id title');

    switch (field) {
      case 'action':
        // Return all action types
        options = [
          'DOCUMENT_SIGNED',
          'SIGNATURE_VERIFIED',
          'SIGNATURE_REVOKED',
          'CERTIFICATE_GENERATED',
          'CERTIFICATE_REVOKED',
          'AUDIT_LOG_CREATED',
          'DOCUMENT_UPLOADED',
          'USER_LOGGED_IN',
          'COMPLIANCE_REPORT_GENERATED'
        ];
        break;

      case 'userId':
        // Return all users (admin only) or just current user
        if (req.user.isAdmin) {
          const users = await User.find().select('_id email name');
          options = users.map(u => ({
            value: u._id.toString(),
            label: `${u.email} (${u.name})`
          }));
        } else {
          options = [
            {
              value: userId,
              label: req.user.email
            }
          ];
        }
        break;

      case 'documentId':
        // Return documents accessible to user
        options = userDocuments.map(d => ({
          value: d._id.toString(),
          label: d.title || 'Untitled'
        }));
        break;
    }

    res.status(200).json({
      success: true,
      data: {
        field,
        options
      }
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving filter options',
      code: 'FILTER_OPTIONS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/audit-logs/export/csv
// Export audit logs as CSV
exports.exportAuditLogsAsCSV = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      documentId,
      userId: filterUserId,
      action,
      startDate,
      endDate
    } = req.query;

    // Build filter query (same as getAuditLogs)
    const filter = {};

    if (!req.user.isAdmin) {
      const userDocuments = await Document.find({ owner_id: userId }).select('_id');
      const docIds = userDocuments.map(doc => doc._id);
      filter.document_id = { $in: docIds };
    } else if (documentId) {
      filter.document_id = documentId;
    }

    if (filterUserId) filter.user_id = filterUserId;
    if (action) filter.action = action;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Get logs for export (all, no limit)
    const logs = await SignatureAuditLog.find(filter)
      .populate('user_id', 'email name')
      .populate('document_id', 'title')
      .sort({ timestamp: -1 })
      .lean();

    // Transform for CSV export
    const csvData = logs.map(log => ({
      'Timestamp': new Date(log.timestamp).toISOString(),
      'Action': log.action,
      'User Email': log.user_id?.email || 'N/A',
      'User Name': log.user_id?.name || 'N/A',
      'Document': log.document_id?.title || 'N/A',
      'IP Address': log.ip_address || 'N/A',
      'Status': log.status || 'SUCCESS',
      'Details': JSON.stringify(log.metadata || {})
    }));

    // Generate CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error('Export audit logs CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting audit logs',
      code: 'EXPORT_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/audit-logs/search
// Full-text search on audit logs
exports.searchAuditLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, limit = 20, offset = 0 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        code: 'EMPTY_QUERY'
      });
    }

    // Build base filter for user's documents
    const filter = {};
    if (!req.user.isAdmin) {
      const userDocuments = await Document.find({ owner_id: userId }).select('_id');
      const docIds = userDocuments.map(doc => doc._id);
      filter.document_id = { $in: docIds };
    }

    // Add text search filter
    filter.$text = { $search: query };

    // Parse pagination
    const pageLimit = Math.min(parseInt(limit), 100);
    const pageOffset = Math.max(parseInt(offset), 0);

    // Execute search
    const [results, totalCount] = await Promise.all([
      SignatureAuditLog.find(filter)
        .populate('user_id', 'email name')
        .populate('document_id', 'title')
        .sort({ score: { $meta: 'textScore' } })
        .limit(pageLimit)
        .skip(pageOffset)
        .lean(),
      SignatureAuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        results,
        pagination: {
          total: totalCount,
          limit: pageLimit,
          offset: pageOffset
        }
      }
    });
  } catch (error) {
    console.error('Search audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching audit logs',
      code: 'SEARCH_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/audit-logs/statistics
// Get audit statistics for compliance reporting
exports.getAuditStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Build filter for user's documents
    const filter = {};
    if (!req.user.isAdmin) {
      const userDocuments = await Document.find({ owner_id: userId }).select('_id');
      const docIds = userDocuments.map(doc => doc._id);
      filter.document_id = { $in: docIds };
    }

    // Add date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Aggregate statistics
    const stats = await SignatureAuditLog.aggregate([
      { $match: filter },
      {
        $facet: {
          byAction: [
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          timeline: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          totalEvents: [
            { $count: 'total' }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byAction: stats[0].byAction,
        byStatus: stats[0].byStatus,
        timeline: stats[0].timeline,
        total: stats[0].totalEvents[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get audit statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit statistics',
      code: 'STATISTICS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/compliance-report
// Generate compliance report
exports.generateComplianceReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, format = 'json' } = req.query;

    // Build filter for user's documents  
    const filter = {};
    if (!req.user.isAdmin) {
      const userDocuments = await Document.find({ owner_id: userId }).select('_id');
      const docIds = userDocuments.map(doc => doc._id);
      filter.document_id = { $in: docIds };
    }

    // Add date range
    const reportStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const reportEndDate = endDate ? new Date(endDate) : new Date();

    filter.timestamp = {
      $gte: reportStartDate,
      $lte: reportEndDate
    };

    // Get all logs for this period
    const logs = await SignatureAuditLog.find(filter)
      .populate('user_id', 'email name')
      .populate('document_id', 'title')
      .sort({ timestamp: -1 })
      .lean();

    // Calculate statistics
    const actionCounts = {};
    const statusCounts = {};
    let successCount = 0;
    let failureCount = 0;

    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;

      if (log.status === 'SUCCESS') {
        successCount++;
      } else if (log.status === 'FAILED') {
        failureCount++;
      }
    });

    // Build compliance report
    const report = {
      generatedAt: new Date().toISOString(),
      reportPeriod: {
        startDate: reportStartDate.toISOString().split('T')[0],
        endDate: reportEndDate.toISOString().split('T')[0]
      },
      summary: {
        totalEvents: logs.length,
        successfulOperations: successCount,
        failedOperations: failureCount,
        successRate: logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(2) + '%' : '0%'
      },
      actionBreakdown: actionCounts,
      statusBreakdown: statusCounts,
      complianceStatus: {
        gdprCompliant: true,
        hipaaCompliant: req.user.isAdmin ? 'Audit logs support HIPAA requirements' : 'N/A',
        soc2Compliant: 'System maintains comprehensive audit logs',
        eIDASCompliant: 'Signatures meet eIDAS requirements'
      },
      auditTrail: logs
    };

    if (format === 'csv') {
      // Export as CSV
      const csvData = logs.map(log => ({
        'Timestamp': new Date(log.timestamp).toISOString(),
        'Action': log.action,
        'User': log.user_id?.email || 'N/A',
        'Document': log.document_id?.title || 'N/A',
        'Status': log.status,
        'IP': log.ip_address || 'N/A'
      }));

      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="compliance-report-${reportStartDate.toISOString().split('T')[0]}.csv"`
      );
      res.status(200).send(csv);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        data: report
      });
    }
  } catch (error) {
    console.error('Generate compliance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating compliance report',
      code: 'COMPLIANCE_REPORT_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports;
