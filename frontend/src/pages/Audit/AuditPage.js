import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuditTrail from '../../components/Audit/AuditTrail';
import DocumentAuditService from '../../services/documentAuditService';
import './AuditPage.css';


import { LuClipboardCheck, LuPin } from 'react-icons/lu';

/**
 * AuditPage Component
 * 
 * Main page for viewing and filtering audit logs
 * Supports filtering by document, user, action, and date range
 * Includes audit trail export and compliance reporting
 */
const AuditPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalEvents, setTotalEvents] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    documentId: searchParams.get('documentId') || '',
    userId: searchParams.get('userId') || '',
    action: searchParams.get('action') || '',
    startDate: searchParams.get('startDate')
      ? new Date(searchParams.get('startDate'))
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : new Date()
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    currentPage: 1
  });

  // Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  // Filter options for dropdowns
  const [filterOptions, setFilterOptions] = useState({
    actions: [],
    users: []
  });

  /**
   * Load audit logs with current filters
   */
  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await DocumentAuditService.getAuditLogs({
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset
      });

      setEvents(response.items || []);
      setTotalEvents(response.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load available options for filters
   */
  const loadFilterOptions = async () => {
    try {
      const [actions, users] = await Promise.all([
        DocumentAuditService.getFilterOptions('action'),
        DocumentAuditService.getFilterOptions('userId')
      ]);

      setFilterOptions({ actions, users });
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  // Load audit logs on mount and when filters/pagination change
  useEffect(() => {
    loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination]);

  // Load filter options
  useEffect(() => {
    loadFilterOptions();
  }, []);

  /**
   * Update a single filter
   */
  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPagination({ ...pagination, offset: 0, currentPage: 1 }); // Reset pagination

    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.documentId) params.set('documentId', newFilters.documentId);
    if (newFilters.userId) params.set('userId', newFilters.userId);
    if (newFilters.action) params.set('action', newFilters.action);
    if (newFilters.startDate)
      params.set('startDate', newFilters.startDate.toISOString());
    if (newFilters.endDate) params.set('endDate', newFilters.endDate.toISOString());
    setSearchParams(params);
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    const defaultFilters = {
      documentId: '',
      userId: '',
      action: '',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    };
    setFilters(defaultFilters);
    setPagination({ limit: 50, offset: 0, currentPage: 1 });
    setSearchParams({});
  };

  /**
   * Navigate to previous page
   */
  const previousPage = () => {
    if (pagination.currentPage > 1) {
      const newPage = pagination.currentPage - 1;
      const newOffset = (newPage - 1) * pagination.limit;
      setPagination({
        ...pagination,
        offset: newOffset,
        currentPage: newPage
      });
      window.scrollTo(0, 0);
    }
  };

  /**
   * Navigate to next page
   */
  const nextPage = () => {
    const maxPage = Math.ceil(totalEvents / pagination.limit);
    if (pagination.currentPage < maxPage) {
      const newPage = pagination.currentPage + 1;
      const newOffset = (newPage - 1) * pagination.limit;
      setPagination({
        ...pagination,
        offset: newOffset,
        currentPage: newPage
      });
      window.scrollTo(0, 0);
    }
  };

  /**
   * Handle export
   */
  const handleExport = async () => {
    try {
      setIsExporting(true);

      if (exportFormat === 'csv') {
        await DocumentAuditService.exportAuditTrailAsCSV(filters);
      } else if (exportFormat === 'pdf') {
        await DocumentAuditService.downloadComplianceReport(filters);
      }

      setShowExportModal(false);
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Format date for input
   */
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  /**
   * Calculate total pages
   */
  const totalPages = Math.ceil(totalEvents / pagination.limit);

  return (
    <div className="audit-page">
      {/* Header */}
      <div className="audit-header">
        <div className="header-content">
          <h1><LuClipboardCheck /> Audit Trail</h1>
          <p className="subtitle">
            View and monitor all document signing and verification events
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setShowExportModal(true)}
          disabled={events.length === 0}
        >
          ⬇️ Export
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filters</h3>
          {(filters.documentId ||
            filters.userId ||
            filters.action) && (
            <button className="button-text" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        <div className="filters-grid">
          {/* Document Filter */}
          <div className="filter-group">
            <label htmlFor="documentFilter">Document ID</label>
            <input
              id="documentFilter"
              type="text"
              placeholder="Filter by document..."
              value={filters.documentId}
              onChange={(e) => updateFilter('documentId', e.target.value)}
              className="filter-input"
            />
          </div>

          {/* User Filter */}
          <div className="filter-group">
            <label htmlFor="userFilter">User</label>
            <select
              id="userFilter"
              value={filters.userId}
              onChange={(e) => updateFilter('userId', e.target.value)}
              className="filter-select"
            >
              <option value="">All Users</option>
              {filterOptions.users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="filter-group">
            <label htmlFor="actionFilter">Action</label>
            <select
              id="actionFilter"
              value={filters.action}
              onChange={(e) => updateFilter('action', e.target.value)}
              className="filter-select"
            >
              <option value="">All Actions</option>
              {filterOptions.actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div className="filter-group">
            <label htmlFor="startDateFilter">Start Date</label>
            <input
              id="startDateFilter"
              type="date"
              value={formatDateForInput(filters.startDate)}
              onChange={(e) =>
                updateFilter('startDate', new Date(e.target.value))
              }
              className="filter-input"
            />
          </div>

          {/* End Date Filter */}
          <div className="filter-group">
            <label htmlFor="endDateFilter">End Date</label>
            <input
              id="endDateFilter"
              type="date"
              value={formatDateForInput(filters.endDate)}
              onChange={(e) =>
                updateFilter('endDate', new Date(e.target.value))
              }
              className="filter-input"
            />
          </div>

          {/* Items Per Page */}
          <div className="filter-group">
            <label htmlFor="limitFilter">Items Per Page</label>
            <select
              id="limitFilter"
              value={pagination.limit}
              onChange={(e) =>
                setPagination({
                  ...pagination,
                  limit: parseInt(e.target.value),
                  offset: 0,
                  currentPage: 1
                })
              }
              className="filter-select"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p className="summary-text">
          Showing <strong>{Math.min(pagination.offset + 1, totalEvents)}</strong> to{' '}
          <strong>{Math.min(pagination.offset + pagination.limit, totalEvents)}</strong> of{' '}
          <strong>{totalEvents}</strong> events
        </p>
      </div>

      {/* Audit Trail */}
      <div className="audit-trail-section">
        <AuditTrail
          events={events}
          loading={isLoading}
          error={error}
          onRetry={loadAuditLogs}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="button button-secondary"
            onClick={previousPage}
            disabled={pagination.currentPage === 1}
          >
            ← Previous
          </button>

          <div className="page-info">
            Page <strong>{pagination.currentPage}</strong> of <strong>{totalPages}</strong>
          </div>

          <button
            className="button button-secondary"
            onClick={nextPage}
            disabled={pagination.currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Export Audit Trail</h3>

            <div className="export-options">
              <label className="export-radio">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <span>Download as CSV</span>
                <p className="option-description">
                  Import into spreadsheet applications for analysis
                </p>
              </label>

              <label className="export-radio">
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <span>Download as PDF (Compliance Report)</span>
                <p className="option-description">
                  Formatted report suitable for regulatory submission
                </p>
              </label>
            </div>

            <div className="export-filters-note">
              <p>
                <strong><LuPin /> Note:</strong> Export will include{' '}
                {filters.documentId
                  ? 'the selected document'
                  : filters.userId
                  ? 'events from the selected user'
                  : 'all events in the current filter'}{' '}
                from <strong>{filters.startDate.toLocaleDateString()}</strong> to{' '}
                <strong>{filters.endDate.toLocaleDateString()}</strong>
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? '⏳ Exporting...' : '⬇️ Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditPage;
