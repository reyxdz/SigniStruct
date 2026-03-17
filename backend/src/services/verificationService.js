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
   * Now includes both signed and unsigned signature fields
   * 
   * @param {string} documentId - MongoDB ObjectId of document
   * @param {object} metadata - Additional metadata (userId, ipAddress, userAgent)
   * @returns {Promise<object>} Comprehensive verification result with all fields
   */
  async verifyDocument(documentId, metadata = {}) {
    try {
      // Validate document exists
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Step 1: Get all signature fields from the document
      const signatureFields = document.fields
        ? document.fields.filter(f => f.fieldType === 'signature' || f.label?.toLowerCase().includes('signature'))
        : [];

      console.log(`📄 Document ${documentId} has ${signatureFields.length} signature fields`);
      signatureFields.forEach((f, i) => {
        console.log(`   Field ${i + 1}: ${f.label} (fieldType: ${f.fieldType})`);
        if (f.assignedRecipients && f.assignedRecipients.length > 0) {
          f.assignedRecipients.forEach(r => {
            console.log(`       Assigned to: ${r.recipientEmail || r.recipientId}`);
          });
        }
      });

      // Step 2: Get all existing signatures for this document
      const existingSignatures = await DocumentSignature.find({ document_id: documentId })
        .populate('signer_id', 'email name')
        .populate('certificate_id');

      console.log(`✍️ Found ${existingSignatures.length} existing signatures`);
      existingSignatures.forEach((sig, i) => {
        console.log(`   Sig ${i + 1}: ${sig.signer_id?.email || sig.recipient_email} (status: ${sig.status}, is_valid: ${sig.is_valid})`);
      });

      // Step 3: Separate into actually signed (status='signed') vs all others (pending/unsigned)
      // Only signatures with status === 'signed' are actually signed and ready for verification
      const actuallySignedSignatures = existingSignatures.filter(sig => sig.status === 'signed');
      
      // All other signatures (pending, declined, expired) are treated as unsigned
      const unsignedOrFailedSignatures = existingSignatures.filter(sig => sig.status !== 'signed');
      
      // Also find fields with NO signature record at all
      const fieldsWithSignatures = new Set(
        existingSignatures
          .flatMap(sig => [
            sig.recipient_email,
            sig.signer_id?._id.toString(),
            ...(sig.fields || [])
          ])
          .filter(Boolean)
      );
      
      const fieldsWithoutSignatures = signatureFields.filter(field => {
        const hasAnyRecord = unsignedOrFailedSignatures.some(sig => 
          sig.fields?.includes(field.id) || 
          (field.assignedRecipients && field.assignedRecipients.some(recipient => 
            sig.recipient_email === recipient.recipientEmail || 
            sig.signer_id?._id.toString() === recipient.recipientId?.toString()
          ))
        ) || fieldsWithSignatures.has(field.id);
        
        return !hasAnyRecord;
      });

      console.log(`✅ Actually Signed: ${actuallySignedSignatures.length}, ⏳ Not Yet Signed: ${unsignedOrFailedSignatures.length}, 📝 Fields without records: ${fieldsWithoutSignatures.length}`);
      
      // Debug logging
      if (actuallySignedSignatures.length > 0) {
        console.log(`\nActually Signed Signatures (status='signed'):`);
        actuallySignedSignatures.forEach(sig => {
          console.log(`  - ${sig.signer_id?.email || sig.recipient_email} (id: ${sig._id})`);
        });
      }
      
      if (unsignedOrFailedSignatures.length > 0) {
        console.log(`\nUnsigned/Other Signatures (status!='signed'):`);
        unsignedOrFailedSignatures.forEach(sig => {
          console.log(`  - ${sig.signer_id?.email || sig.recipient_email} (status: ${sig.status}, id: ${sig._id})`);
        });
      }
      
      if (fieldsWithoutSignatures.length > 0) {
        console.log(`\nFields Without Any Signature Record:`);
        fieldsWithoutSignatures.forEach(field => {
          console.log(`  - ${field.label} (id: ${field.id})`);
        });
      }

      // Step 4: Verify only actually signed signatures
      const signatureVerifications = [];
      let validSignatureCount = 0;

      for (const signature of actuallySignedSignatures) {
        try {
          console.log(`\n📋 Verifying signature: ${signature._id}`);
          console.log(`   Signer: ${signature.signer_id?.email || signature.recipient_email || 'Unknown'}`);
          console.log(`   Status in DB: ${signature.status}`);
          
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

      // Step 5: Build list of pending signatures (not yet signed)
      // This includes:
      // 1. Fields with DocumentSignature records but status !== 'signed'
      // 2. Fields with no DocumentSignature records at all
      const pendingSignatures = [];
      
      // Add signatures that exist but haven't been signed yet
      for (const signature of unsignedOrFailedSignatures) {
        const recipient = signature.recipient_email || signature.signer_id?.email;
        const recipientName = signature.recipient_name || signature.signer_id?.name;
        
        pendingSignatures.push({
          field_id: signature._id.toString(),
          field_label: signature.fields?.[0] || 'Signature Field',
          status: 'pending',
          is_valid: false,
          signer: {
            email: recipient || 'Unknown Recipient',
            name: recipientName || 'Unknown'
          },
          signed_at: null,
          certificate_valid: null,
          certificate_expire_date: null,
          is_revoked: false,
          errors: ['Signature not yet submitted']
        });
      }
      
      // Add fields that have no signature record at all
      for (const field of fieldsWithoutSignatures) {
        const assignedRecipients = field.assignedRecipients || [];
        
        pendingSignatures.push({
          field_id: field.id,
          field_label: field.label,
          status: 'pending',
          is_valid: false,
          signer: {
            email: assignedRecipients.length > 0 ? assignedRecipients[0].recipientEmail : 'Unassigned',
            name: assignedRecipients.length > 0 ? assignedRecipients[0].recipientName : 'Unassigned'
          },
          signed_at: null,
          certificate_valid: null,
          certificate_expire_date: null,
          is_revoked: false,
          errors: ['Signature not yet submitted']
        });
      }

      // Step 6: Combine all signatures (verified + pending)
      const allSignatures = [...signatureVerifications, ...pendingSignatures];

      // Step 7: Generate overall verification status
      const documentValid = validSignatureCount > 0 && 
                          actuallySignedSignatures.length === validSignatureCount && 
                          pendingSignatures.length === 0;

      // Log the verification action
      if (metadata.userId) {
        await this.generateAuditLog(
          'document_verified',
          metadata.userId,
          {
            documentId,
            totalSignatureFields: signatureFields.length,
            actuallySignedSignatures: actuallySignedSignatures.length,
            validSignatures: validSignatureCount,
            pendingSignatures: pendingSignatures.length,
            result: documentValid ? 'FULLY_SIGNED' : 'PARTIALLY_SIGNED',
            verificationTime: new Date()
          },
          metadata
        );
      }

      return {
        is_valid: documentValid,
        document_id: documentId,
        document_title: document.title,
        status: documentValid ? 'fully_signed' : pendingSignatures.length === 0 ? 'verified' : 'partially_signed',
        signature_count: signatureFields.length,
        signed_count: actuallySignedSignatures.length,
        unsigned_count: pendingSignatures.length,
        verified_count: validSignatureCount,
        verification_timestamp: new Date(),
        details: {
          allSignaturesValid: actuallySignedSignatures.length === validSignatureCount && pendingSignatures.length === 0,
          certificatesValid: signatureVerifications.every(s => !s.certificate_issues),
          noRevokedCertificates: signatureVerifications.every(s => !s.is_revoked),
          message: documentValid
            ? `✅ Document fully signed and verified: ${validSignatureCount}/${signatureFields.length} signatures`
            : `⏳ Document partially signed: ${actuallySignedSignatures.length}/${signatureFields.length} signed (${validSignatureCount} verified), ${pendingSignatures.length} pending`
        },
        signatures: allSignatures.map(v => ({
          signature_id: v.signature_id || v.field_id,
          is_valid: v.is_valid,
          status: v.status,
          signer: {
            email: v.signer?.email || v.signer_email,
            name: v.signer?.name || v.signer_name
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
      if (!metadata.skipAuditLog && (metadata.userId || signature.signer_id)) {
        await this.generateAuditLog(
          'signature_verified',
          metadata.userId || signature.signer_id?._id.toString(),
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
        'certificate_generated',
        'certificate_revoked',
        'certificate_renewed',
        'certificate_expired',
        'certificate_expiry_notification',
        'signature_created',
        'field_signed_cryptographic',
        'document_signed',
        'signature_verified',
        'document_verified',
        'signature_revoked'
      ];

      if (!validActions.includes(action)) {
        console.warn(`Unknown audit action: ${action}`);
      }

      // Create audit log entry with correct field names (signer_id, not user_id)
      const auditLog = new SignatureAuditLog({
        action,
        signer_id: userId,  // Model requires signer_id, not user_id
        document_id: details.document_id || details.documentId,
        details: {
          ...details,
          timestamp: new Date().toISOString()
        },
        ip_address: metadata.ipAddress || 'unknown',
        user_agent: metadata.userAgent || 'unknown',
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
      // Use the actual RSA signature (crypto_signature) and the content hash
      // that was hashed at signing time (content_hash).
      // NOTE: signature_hash only stores a SHA-256 checksum OF the RSA signature
      //       (for integrity), NOT the RSA signature itself.
      const rsaSignatureHex = signature.crypto_signature;
      const contentHash = signature.content_hash;

      if (!rsaSignatureHex || !contentHash) {
        // Fall back: legacy signatures that only have signature_hash + document hash
        const document = signature.document_id;
        if (!document || !document.file_hash_sha256) {
          return {
            is_valid: false,
            signature_valid: false,
            hash_match: false,
            error: 'No cryptographic data available on signature'
          };
        }

        const certificate = signature.certificate_id;
        if (!certificate || !certificate.public_key) {
          return {
            is_valid: false,
            signature_valid: false,
            hash_match: false,
            error: 'Certificate public key not found'
          };
        }

        const isValid = await SigningService.verifySignature(
          signature.signature_hash,
          document.file_hash_sha256,
          certificate._id.toString(),
          { skipAuditLog: true }
        );

        return {
          is_valid: isValid,
          signature_valid: isValid,
          hash_match: isValid
        };
      }

      // Modern path: verify crypto_signature against content_hash using the public key
      const certificate = signature.certificate_id;
      if (!certificate || !certificate.public_key) {
        return {
          is_valid: false,
          signature_valid: false,
          hash_match: false,
          error: 'Certificate public key not found'
        };
      }

      const isValid = await SigningService.verifySignature(
        rsaSignatureHex,
        contentHash,
        certificate._id.toString(),
        { skipAuditLog: true }
      );

      return {
        is_valid: isValid,
        signature_valid: isValid,
        hash_match: isValid
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
      const expiresAt = new Date(certificate.not_after);
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
        action: { $in: ['signature_verified', 'document_verified'] }
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .populate('user_id', 'email name');

      const total = await SignatureAuditLog.countDocuments({
        'details.documentId': documentId,
        action: { $in: ['signature_verified', 'document_verified'] }
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
