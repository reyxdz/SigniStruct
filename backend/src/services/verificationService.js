/**
 * Verification Service
 * 
 * Handles cryptographic verification of digital signatures and certificates
 * Tracks audit logs for compliance and non-repudiation
 */

const mongoose = require('mongoose');
const DocumentSignature = require('../models/DocumentSignature');
const UserCertificate = require('../models/UserCertificate');
const SignatureAuditLog = require('../models/SignatureAuditLog');
const Document = require('../models/Document');
const EncryptionService = require('./encryptionService');
const SigningService = require('./signingService');

class VerificationService {
  /**
   * Verify all signatures on a document and generate verification report
   * 
   * @param {string} documentId - MongoDB ObjectId of document
   * @param {object} metadata - Additional metadata (userId, ipAddress, userAgent)
   * @returns {Promise<object>} Comprehensive verification result
   */
  async verifyDocument(documentId, metadata = {}) {
    try {
      // Validate document exists
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Get all signatures for document
      const signatures = await DocumentSignature.find({ document_id: documentId })
        .populate('signer_id', 'email name')
        .populate('certificate_id');

      if (signatures.length === 0) {
        // Document is unsigned
        return {
          is_valid: false,
          document_id: documentId,
          status: 'unsigned',
          signature_count: 0,
          verified_count: 0,
          details: {
            message: 'No signatures found on document'
          },
          timestamp: new Date(),
          signatures: []
        };
      }

      // Verify each signature
      const signatureVerifications = [];
      let validSignatureCount = 0;

      for (const signature of signatures) {
        try {
          console.log(`\n📋 Verifying signature: ${signature._id}`);
          console.log(`   Signer: ${signature.signer_id?.email || 'Unknown'}`);
          console.log(`   Status in DB: ${signature.status}`);
          console.log(`   Has signature_hash: ${!!signature.signature_hash}`);
          console.log(`   Has certificate_id: ${!!signature.certificate_id}`);
          console.log(`   is_valid flag: ${signature.is_valid}`);
          
          const verification = await this.verifySignature(
            signature._id.toString(),
            {
              ...metadata,
              skipAuditLog: true // Bulk operation, will log once
            }
          );
          
          console.log(`   Verification result: ${verification.is_valid ? '✅ VALID' : '❌ INVALID'}`);
          if (verification.errors && verification.errors.length > 0) {
            console.log(`   Errors: ${verification.errors.join(', ')}`);
          }
          
          signatureVerifications.push(verification);
          if (verification.is_valid) {
            validSignatureCount++;
          }
        } catch (error) {
          console.error(`❌ Error verifying signature ${signature._id}:`, error);
          signatureVerifications.push({
            signature_id: signature._id.toString(),
            is_valid: false,
            error: error.message
          });
        }
      }

      // Generate overall verification status
      const allValid = signatureVerifications.every(v => v.is_valid);
      const documentValid = validSignatureCount > 0 && validSignatureCount === signatures.length;

      // Log the verification action
      await this.generateAuditLog(
        'DOCUMENT_VERIFIED',
        metadata.userId || 'system',
        {
          documentId,
          totalSignatures: signatures.length,
          validSignatures: validSignatureCount,
          result: documentValid ? 'VALID' : 'INVALID',
          verificationTime: new Date()
        },
        metadata
      );

      return {
        is_valid: documentValid,
        document_id: documentId,
        document_title: document.title,
        status: documentValid ? 'verified' : 'verification_failed',
        signature_count: signatures.length,
        verified_count: validSignatureCount,
        verification_timestamp: new Date(),
        details: {
          allSignaturesValid: allValid,
          certificatesValid: signatureVerifications.every(s => !s.certificate_issues),
          noRevokedCertificates: signatureVerifications.every(s => !s.is_revoked),
          message: documentValid
            ? `Document verified: ${validSignatureCount}/${signatures.length} valid signatures`
            : `Verification failed: ${validSignatureCount}/${signatures.length} valid signatures`
        },
        signatures: signatureVerifications.map(v => ({
          signature_id: v.signature_id,
          is_valid: v.is_valid,
          signer: {
            email: v.signer_email,
            name: v.signer_name
          },
          signed_at: v.signed_at,
          certificate_valid: v.certificate_valid,
          certificate_expire_date: v.certificate_expire_date,
          is_revoked: v.is_revoked,
          errors: v.errors
        }))
      };
    } catch (error) {
      console.error('Document verification error:', error);
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Verify a single signature and its certificate
   * 
   * @param {string} signatureId - MongoDB ObjectId of signature
   * @param {object} metadata - Additional metadata (userId, ipAddress, userAgent)
   * @returns {Promise<object>} Signature verification details
   */
  async verifySignature(signatureId, metadata = {}) {
    try {
      // Get signature with relationships
      const signature = await DocumentSignature.findById(signatureId)
        .populate('signer_id', 'email name')
        .populate('certificate_id')
        .populate('document_id', 'title file_hash_sha256');

      if (!signature) {
        throw new Error('Signature not found');
      }

      console.log(`[VERIFY] Signature ${signatureId}: signer=${signature.signer_id?.email}, status=${signature.status}, is_valid=${signature.is_valid}`);

      // Verify signature cryptographically
      const cryptoVerification = await this._verifyCryptographicSignature(signature);
      console.log(`[VERIFY] Crypto check: ${cryptoVerification.is_valid ? 'PASS' : 'FAIL'} (${cryptoVerification.error || 'OK'})`);

      // Check certificate validity
      const certificateStatus = await this._verifyCertificate(signature.certificate_id);
      console.log(`[VERIFY] Cert check: valid=${certificateStatus.is_valid}, revoked=${certificateStatus.is_revoked}, expired=${!certificateStatus.is_not_expired}`);

      // Determine overall signature validity
      const isValid =
        signature.is_valid &&
        cryptoVerification.is_valid &&
        certificateStatus.is_valid &&
        !certificateStatus.is_revoked &&
        certificateStatus.is_not_expired;
      
      console.log(`[VERIFY] Final result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

      const verificationResult = {
        signature_id: signatureId,
        is_valid: isValid,
        signer_email: signature.signer_id?.email || signature.recipient_email || 'Unknown Signer',
        signer_name: signature.signer_id?.name || signature.recipient_name || 'Unknown',
        signed_at: signature.created_at,
        status: isValid ? 'valid' : 'invalid',
        certificate_valid: certificateStatus.is_valid,
        certificate_expire_date: certificateStatus.expires_at,
        is_revoked: certificateStatus.is_revoked,
        document_hash_match: cryptoVerification.hash_match,
        signature_hash_verified: cryptoVerification.signature_valid,
        errors: [],
        warnings: []
      };

      // Collect error messages
      if (!signature.is_valid) {
        verificationResult.errors.push('Signature marked as invalid in database');
      }
      if (!cryptoVerification.is_valid) {
        verificationResult.errors.push('Cryptographic signature verification failed');
      }
      if (!certificateStatus.is_valid) {
        verificationResult.errors.push('Certificate is invalid');
      }
      if (certificateStatus.is_revoked) {
        verificationResult.errors.push('Certificate has been revoked');
      }
      if (!certificateStatus.is_not_expired) {
        verificationResult.errors.push('Certificate has expired');
      }

      // Add warnings
      if (certificateStatus.days_until_expiry <= 30 && certificateStatus.is_not_expired) {
        verificationResult.warnings.push(
          `Certificate expires in ${certificateStatus.days_until_expiry} days`
        );
      }

      // Log the verification unless explicitly skipped
      if (!metadata.skipAuditLog) {
        await this.generateAuditLog(
          'SIGNATURE_VERIFIED',
          metadata.userId || signature.signer_id?._id,
          {
            signatureId,
            documentId: signature.document_id?._id,
            result: isValid ? 'VALID' : 'INVALID',
            certificateStatus: certificateStatus.status,
            verificationTime: new Date()
          },
          metadata
        );
      }

      return verificationResult;
    } catch (error) {
      console.error('Signature verification error:', error);
      throw new Error(`Signature verification failed: ${error.message}`);
    }
  }

  /**
   * Generate audit log entry for compliance and non-repudiation
   * 
   * @param {string} action - Action type (SIGNATURE_CREATED, DOCUMENT_VERIFIED, etc)
   * @param {string} userId - User ID performing action
   * @param {object} details - Action-specific details
   * @param {object} metadata - Request metadata (ipAddress, userAgent, etc)
   * @returns {Promise<object>} Created audit log
   */
  async generateAuditLog(action, userId, details = {}, metadata = {}) {
    try {
      // Validate action type
      const validActions = [
        'SIGNATURE_CREATED',
        'SIGNATURE_VERIFIED',
        'SIGNATURE_REVOKED',
        'CERTIFICATE_GENERATED',
        'CERTIFICATE_VERIFIED',
        'CERTIFICATE_REVOKED',
        'DOCUMENT_VERIFIED',
        'DOCUMENT_UPLOADED',
        'DOCUMENT_DELETED'
      ];

      if (!validActions.includes(action)) {
        console.warn(`Unknown audit action: ${action}`);
      }

      // Create audit log entry
      const auditLog = new SignatureAuditLog({
        action,
        user_id: userId,
        details: {
          ...details,
          timestamp: new Date().toISOString()
        },
        metadata: {
          ip_address: metadata.ipAddress || 'unknown',
          user_agent: metadata.userAgent || 'unknown',
          request_id: metadata.requestId || this._generateRequestId()
        },
        timestamp: new Date()
      });

      await auditLog.save();

      return auditLog;
    } catch (error) {
      console.error('Audit log generation error:', error);
      // Don't throw - audit log failure should not block main operation
      // Just log the error for investigation
    }
  }

  /**
   * Private method: Verify cryptographic signature
   * 
   * @private
   * @param {object} signature - Populated signature document
   * @returns {Promise<object>} Cryptographic verification result
   */
  async _verifyCryptographicSignature(signature) {
    try {
      // Get document hash
      const document = signature.document_id;
      if (!document || !document.file_hash_sha256) {
        return {
          is_valid: false,
          signature_valid: false,
          hash_match: false,
          error: 'Document hash not found'
        };
      }

      const documentHash = document.file_hash_sha256;
      const signatureHash = signature.signature_hash;

      // Get certificate public key
      const certificate = signature.certificate_id;
      if (!certificate || !certificate.public_key) {
        return {
          is_valid: false,
          signature_valid: false,
          hash_match: false,
          error: 'Certificate public key not found'
        };
      }

      // Verify using SigningService
      const isValid = await SigningService.verifySignature(
        signatureHash,
        documentHash,
        certificate._id.toString(),
        { skipAuditLog: true }
      );

      return {
        is_valid: isValid,
        signature_valid: isValid,
        hash_match: true // If signature verifies, hash matches
      };
    } catch (error) {
      console.error('Cryptographic signature verification error:', error);
      return {
        is_valid: false,
        signature_valid: false,
        hash_match: false,
        error: error.message
      };
    }
  }

  /**
   * Private method: Verify certificate validity and status
   * 
   * @private
   * @param {object} certificate - Certificate document
   * @returns {Promise<object>} Certificate verification status
   */
  async _verifyCertificate(certificate) {
    try {
      if (!certificate) {
        console.log(`[CERT] Certificate not found`);
        return {
          is_valid: false,
          is_revoked: false,
          is_not_expired: false,
          status: 'not_found',
          error: 'Certificate not found'
        };
      }

      const now = new Date();
      const expiresAt = new Date(certificate.not_after || certificate.expires_at);
      const isNotExpired = now < expiresAt;

      // Check revocation status
      const isRevoked = certificate.is_revoked || certificate.status === 'revoked' || false;

      // Check validity fields - certificate.status should be 'active' for valid
      const isValid = certificate.status === 'active' || (certificate.is_valid !== false && certificate.status !== 'revoked' && certificate.status !== 'expired');

      console.log(`[CERT] ID: ${certificate._id}, status: ${certificate.status}, valid: ${isValid}, revoked: ${isRevoked}, not_expired: ${isNotExpired}`);

      // Calculate days until expiry
      const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

      // Determine overall status
      let status = 'valid';
      if (isRevoked) {
        status = 'revoked';
      } else if (!isNotExpired) {
        status = 'expired';
      } else if (!isValid) {
        status = 'invalid';
      }

      return {
        is_valid: isValid && !isRevoked && isNotExpired,
        is_revoked: isRevoked,
        is_not_expired: isNotExpired,
        expires_at: expiresAt,
        days_until_expiry: daysUntilExpiry,
        status,
        certificate_id: certificate._id.toString()
      };
    } catch (error) {
      console.error('Certificate verification error:', error);
      return {
        is_valid: false,
        is_revoked: false,
        is_not_expired: false,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get verification history for a document
   * 
   * @param {string} documentId - MongoDB ObjectId of document
   * @param {object} options - Query options (limit, offset)
   * @returns {Promise<object>} Verification history
   */
  async getVerificationHistory(documentId, options = {}) {
    try {
      const limit = options.limit || 50;
      const skip = options.offset || 0;

      // Get audit logs for this document
      const logs = await SignatureAuditLog.find({
        'details.documentId': documentId,
        action: { $in: ['SIGNATURE_VERIFIED', 'DOCUMENT_VERIFIED'] }
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .populate('user_id', 'email name');

      const total = await SignatureAuditLog.countDocuments({
        'details.documentId': documentId,
        action: { $in: ['SIGNATURE_VERIFIED', 'DOCUMENT_VERIFIED'] }
      });

      return {
        total,
        items: logs.map(log => ({
          timestamp: log.timestamp,
          action: log.action,
          user_email: log.user_id?.email,
          user_name: log.user_id?.name,
          result: log.details?.result,
          ip_address: log.metadata?.ip_address,
          details: log.details
        }))
      };
    } catch (error) {
      console.error('Error retrieving verification history:', error);
      throw new Error(`Failed to retrieve verification history: ${error.message}`);
    }
  }

  /**
   * Get audit trail for a signature
   * 
   * @param {string} signatureId - MongoDB ObjectId of signature
   * @returns {Promise<object>} Complete audit trail
   */
  async getSignatureAuditTrail(signatureId) {
    try {
      const logs = await SignatureAuditLog.find({
        'details.signatureId': signatureId
      })
        .sort({ timestamp: -1 })
        .populate('user_id', 'email name');

      return {
        signature_id: signatureId,
        events: logs.map(log => ({
          timestamp: log.timestamp,
          action: log.action,
          user: log.user_id ? `${log.user_id.name} <${log.user_id.email}>` : 'system',
          status: log.details?.result,
          metadata: log.metadata
        }))
      };
    } catch (error) {
      console.error('Error retrieving audit trail:', error);
      throw new Error(`Failed to retrieve audit trail: ${error.message}`);
    }
  }

  /**
   * Revoke a certificate (mark as revoked)
   * 
   * @param {string} certificateId - MongoDB ObjectId of certificate
   * @param {string} reason - Reason for revocation
   * @param {object} metadata - Request metadata
   * @returns {Promise<object>} Revocation result
   */
  async revokeCertificate(certificateId, reason = '', metadata = {}) {
    try {
      const certificate = await UserCertificate.findByIdAndUpdate(
        certificateId,
        {
          is_revoked: true,
          revocation_reason: reason,
          revocation_date: new Date()
        },
        { new: true }
      );

      if (!certificate) {
        throw new Error('Certificate not found');
      }

      // Log the revocation
      await this.generateAuditLog(
        'CERTIFICATE_REVOKED',
        metadata.userId,
        {
          certificateId,
          reason,
          userId: certificate.user_id
        },
        metadata
      );

      return {
        success: true,
        certificate_id: certificateId,
        revoked_at: new Date(),
        reason
      };
    } catch (error) {
      console.error('Certificate revocation error:', error);
      throw new Error(`Revocation failed: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive compliance report
   * 
   * @param {object} filters - Report filters (dateRange, userId, documentId, etc)
   * @returns {Promise<object>} Compliance report
   */
  async generateComplianceReport(filters = {}) {
    try {
      const startDate = filters.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const endDate = filters.endDate || new Date();

      // Get audit logs for period
      const query = {
        timestamp: { $gte: startDate, $lte: endDate }
      };

      if (filters.userId) {
        query.user_id = filters.userId;
      }

      if (filters.action) {
        query.action = filters.action;
      }

      const logs = await SignatureAuditLog.find(query).populate('user_id', 'email name');

      // Group by action
      const actionCounts = {};
      const eventsByUser = {};

      logs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

        const userEmail = log.user_id?.email || 'unknown';
        if (!eventsByUser[userEmail]) {
          eventsByUser[userEmail] = [];
        }
        eventsByUser[userEmail].push({
          action: log.action,
          timestamp: log.timestamp,
          details: log.details
        });
      });

      return {
        report_period: {
          start: startDate,
          end: endDate
        },
        total_events: logs.length,
        actions: actionCounts,
        users: Object.keys(eventsByUser).length,
        events_by_user: eventsByUser,
        generated_at: new Date()
      };
    } catch (error) {
      console.error('Compliance report generation error:', error);
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  /**
   * Private method: Generate unique request ID for audit tracking
   * 
   * @private
   * @returns {string} Unique request ID
   */
  _generateRequestId() {
    return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new VerificationService();
