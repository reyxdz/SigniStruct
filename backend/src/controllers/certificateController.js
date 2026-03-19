const User = require('../models/User');
const UserCertificate = require('../models/UserCertificate');
const CertificateService = require('../services/certificateService');

/**
 * Certificate Controller
 * Handles certificate generation, retrieval, verification, and revocation
 */

// @desc    Generate a new certificate for the user
// @route   POST /api/certificates/generate
// @access  Private
exports.generateCertificate = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { email, name, validityYears = 5 } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has an active certificate
    const existingCert = await UserCertificate.findOne({
      user_id: userId,
      status: 'active'
    });

    if (existingCert) {
      return res.status(409).json({ 
        error: 'User already has an active certificate',
        certificate_id: existingCert.certificate_id
      });
    }

    // Generate key pair
    const keyPair = CertificateService.generateKeyPair(req);

    // Create self-signed certificate
    const certData = CertificateService.createSelfSignedCertificate(
      keyPair,
      { userId, name, email },
      validityYears,
      req
    );

    // Encrypt private key
    const encryptionKey = process.env.MASTER_ENCRYPTION_KEY;
    if (!encryptionKey) {
      return res.status(500).json({ error: 'Server configuration error: encryption key missing' });
    }

    const encryptedPrivateKey = CertificateService.encryptPrivateKey(
      keyPair.privateKey,
      encryptionKey,
      userId,
      req
    );

    // Create certificate document in MongoDB
    const certificate = new UserCertificate({
      user_id: userId,
      certificate_id: certData.certificate_id,
      public_key: certData.public_key,
      private_key_encrypted: encryptedPrivateKey,
      certificate_pem: certData.certificate_pem,
      issuer: certData.issuer,
      subject: certData.subject,
      serial_number: certData.serial_number,
      not_before: certData.not_before,
      not_after: certData.not_after,
      fingerprint_sha256: certData.fingerprint_sha256,
      status: certData.status
    });

    await certificate.save();

    // Update user with certificate reference
    user.certificate_id = certificate._id;
    await user.save();

    // Return certificate (excluding encrypted private key)
    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      certificate: {
        certificate_id: certificate.certificate_id,
        public_key: certificate.public_key,
        issuer: certificate.issuer,
        subject: certificate.subject,
        serial_number: certificate.serial_number,
        not_before: certificate.not_before,
        not_after: certificate.not_after,
        fingerprint_sha256: certificate.fingerprint_sha256,
        status: certificate.status
      }
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: 'Certificate generation failed', details: error.message });
  }
};

// @desc    Get certificate for a specific user
// @route   GET /api/certificates/user/:userId
// @access  Private (user can only access their own, admin can access any)
exports.getUserCertificate = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Check if user is accessing their own certificate or is admin
    if (userId !== requestingUserId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Cannot access other user certificates' });
    }

    // Find active certificate for user
    const certificate = await UserCertificate.findOne({
      user_id: userId,
      status: 'active'
    });

    if (!certificate) {
      return res.status(404).json({ error: 'No active certificate found for this user' });
    }

    // Return certificate (excluding encrypted private key)
    res.status(200).json({
      success: true,
      certificate: {
        _id: certificate._id,
        certificate_id: certificate.certificate_id,
        public_key: certificate.public_key,
        issuer: certificate.issuer,
        subject: certificate.subject,
        serial_number: certificate.serial_number,
        not_before: certificate.not_before,
        not_after: certificate.not_after,
        fingerprint_sha256: certificate.fingerprint_sha256,
        status: certificate.status,
        created_at: certificate.created_at
      }
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Failed to retrieve certificate', details: error.message });
  }
};

// @desc    Verify a certificate
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    // Find certificate
    const certificate = await UserCertificate.findOne({ 
      certificate_id: certificateId 
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Check if certificate is still valid
    const now = new Date();
    const isExpired = now > certificate.not_after;
    const isNotYetValid = now < certificate.not_before;
    const isRevoked = certificate.status === 'revoked';

    const isValid = !isExpired && !isNotYetValid && !isRevoked;

    // Return verification status
    res.status(200).json({
      success: true,
      certificate_id: certificate.certificate_id,
      is_valid: isValid,
      status: certificate.status,
      verification_details: {
        is_expired: isExpired,
        is_not_yet_valid: isNotYetValid,
        is_revoked: isRevoked,
        not_before: certificate.not_before,
        not_after: certificate.not_after,
        current_time: now
      },
      issuer: certificate.issuer,
      subject: certificate.subject,
      serial_number: certificate.serial_number,
      fingerprint_sha256: certificate.fingerprint_sha256
    });
  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({ error: 'Certificate verification failed', details: error.message });
  }
};

// @desc    Revoke a certificate
// @route   POST /api/certificates/revoke
// @access  Private
exports.revokeCertificate = async (req, res) => {
  try {
    const { certificateId, reason } = req.body;
    const userId = req.user.id;

    // Find certificate
    const certificate = await UserCertificate.findOne({ 
      certificate_id: certificateId 
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Check authorization: only the owner or admin can revoke
    if (certificate.user_id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Cannot revoke other user certificates' });
    }

    // Check if already revoked
    if (certificate.status === 'revoked') {
      return res.status(409).json({ error: 'Certificate already revoked' });
    }

    // Update certificate status
    certificate.status = 'revoked';
    certificate.revoked_at = new Date();
    certificate.revocation_reason = reason || 'User requested revocation';

    await certificate.save();

    // Optionally: Update user to remove certificate reference
    await User.findByIdAndUpdate(userId, { certificate_id: null });

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully',
      certificate_id: certificate.certificate_id,
      revoked_at: certificate.revoked_at,
      status: certificate.status
    });
  } catch (error) {
    console.error('Certificate revocation error:', error);
    res.status(500).json({ error: 'Certificate revocation failed', details: error.message });
  }
};

// @desc    Get all user's certificates (active and revoked)
// @route   GET /api/certificates/user/:userId/all
// @access  Private
exports.getAllUserCertificates = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Check authorization
    if (userId !== requestingUserId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Cannot access other user certificates' });
    }

    // Find all certificates for user
    const certificates = await UserCertificate.find({ user_id: userId });

    if (certificates.length === 0) {
      return res.status(404).json({ error: 'No certificates found for this user' });
    }

    // Return certificates (excluding encrypted private keys)
    const sanitizedCerts = certificates.map(cert => ({
      _id: cert._id,
      certificate_id: cert.certificate_id,
      public_key: cert.public_key,
      issuer: cert.issuer,
      subject: cert.subject,
      serial_number: cert.serial_number,
      not_before: cert.not_before,
      not_after: cert.not_after,
      fingerprint_sha256: cert.fingerprint_sha256,
      status: cert.status,
      created_at: cert.created_at,
      revoked_at: cert.revoked_at
    }));

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates: sanitizedCerts
    });
  } catch (error) {
    console.error('Get all certificates error:', error);
    res.status(500).json({ error: 'Failed to retrieve certificates', details: error.message });
  }
};
// @desc    Download certificate (PEM format)
// @route   GET /api/certificates/:certificateId/download
// @access  Private
exports.downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    // Find certificate
    const certificate = await UserCertificate.findOne({ 
      certificate_id: certificateId 
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Verify authorization: owner or admin only
    if (certificate.user_id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Cannot download other user certificates' });
    }

    // Check if certificate is valid for download
    const now = new Date();
    if (certificate.status === 'revoked') {
      return res.status(410).json({ error: 'Cannot download revoked certificate' });
    }

    if (now > certificate.not_after) {
      return res.status(410).json({ error: 'Cannot download expired certificate' });
    }

    // Send certificate as PEM file
    const filename = `certificate-${certificateId}.pem`;
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(certificate.certificate_pem);

  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({ error: 'Failed to download certificate', details: error.message });
  }
};

// @desc    Get certificate expiry status
// @route   GET /api/certificates/:certificateId/expiry-status
// @access  Private
exports.getCertificateExpiryStatus = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    // Find certificate
    const certificate = await UserCertificate.findOne({ 
      certificate_id: certificateId 
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Verify authorization
    if (certificate.user_id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const now = new Date();
    const daysToExpiry = Math.ceil((certificate.not_after - now) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysToExpiry <= 30 && daysToExpiry > 0;
    const isExpired = daysToExpiry <= 0;

    res.status(200).json({
      success: true,
      certificate_id: certificateId,
      expiry_info: {
        not_after: certificate.not_after,
        days_remaining: daysToExpiry,
        is_expiring_soon: isExpiringSoon,
        is_expired: isExpired,
        expiry_warning_threshold: 30
      },
      status: certificate.status,
      current_time: now
    });

  } catch (error) {
    console.error('Certificate expiry status error:', error);
    res.status(500).json({ error: 'Failed to get certificate expiry status', details: error.message });
  }
};

// @desc    Renew a certificate
// @route   POST /api/certificates/:certificateId/renew
// @access  Private
exports.renewCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { validityYears = 5 } = req.body;
    const userId = req.user.id;

    // Find old certificate
    const oldCertificate = await UserCertificate.findOne({ 
      certificate_id: certificateId 
    });

    if (!oldCertificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Verify authorization
    if (oldCertificate.user_id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Cannot renew other user certificates' });
    }

    // Check if certificate is revoked
    if (oldCertificate.status === 'revoked') {
      return res.status(409).json({ error: 'Cannot renew revoked certificate' });
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new key pair
    const keyPair = CertificateService.generateKeyPair(req);

    // Create new certificate
    const encryptionKey = process.env.MASTER_ENCRYPTION_KEY;
    if (!encryptionKey) {
      return res.status(500).json({ error: 'Server configuration error: encryption key missing' });
    }

    const certData = CertificateService.createSelfSignedCertificate(
      keyPair,
      { userId, name: `${user.firstName} ${user.lastName}`, email: user.email },
      validityYears,
      req
    );

    const encryptedPrivateKey = CertificateService.encryptPrivateKey(
      keyPair.privateKey,
      encryptionKey,
      userId,
      req
    );

    // Create new certificate document
    const newCertificate = new UserCertificate({
      user_id: userId,
      certificate_id: certData.certificate_id,
      public_key: certData.public_key,
      private_key_encrypted: encryptedPrivateKey,
      certificate_pem: certData.certificate_pem,
      issuer: certData.issuer,
      subject: certData.subject,
      serial_number: certData.serial_number,
      not_before: certData.not_before,
      not_after: certData.not_after,
      fingerprint_sha256: certData.fingerprint_sha256,
      status: 'active',
      renewal_info: {
        renewed_from: oldCertificate._id,
        renewal_date: new Date(),
        renewal_reason: req.body.reason || 'Scheduled renewal'
      }
    });

    await newCertificate.save();

    // Mark old certificate as superseded
    oldCertificate.status = 'superseded';
    oldCertificate.superseded_by = newCertificate._id;
    oldCertificate.superseded_at = new Date();
    await oldCertificate.save();

    // Update user certificate reference
    user.certificate_id = newCertificate._id;
    await user.save();

    // Log renewal
    const SignatureAuditLog = require('../models/SignatureAuditLog');
    await SignatureAuditLog.create({
      action: 'certificate_renewed',
      signer_id: userId,
      details: {
        old_certificate_id: oldCertificate.certificate_id,
        new_certificate_id: newCertificate.certificate_id,
        validity_years: validityYears,
        renewal_date: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Certificate renewed successfully',
      new_certificate: {
        certificate_id: newCertificate.certificate_id,
        public_key: newCertificate.public_key,
        issuer: newCertificate.issuer,
        subject: newCertificate.subject,
        serial_number: newCertificate.serial_number,
        not_before: newCertificate.not_before,
        not_after: newCertificate.not_after,
        fingerprint_sha256: newCertificate.fingerprint_sha256,
        status: newCertificate.status
      },
      old_certificate_id: oldCertificate.certificate_id
    });

  } catch (error) {
    console.error('Certificate renewal error:', error);
    res.status(500).json({ error: 'Certificate renewal failed', details: error.message });
  }
};

// @desc    Get certificate audit history
// @route   GET /api/certificates/:certificateId/audit-history
// @access  Private
exports.getCertificateAuditHistory = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;

    // Find certificate
    const certificate = await UserCertificate.findOne({ 
      certificate_id: certificateId 
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Verify authorization
    if (certificate.user_id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get audit logs for this certificate
    const SignatureAuditLog = require('../models/SignatureAuditLog');
    const auditLogs = await SignatureAuditLog.find({
      'details.certificate_id': certificate._id
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    const total = await SignatureAuditLog.countDocuments({
      'details.certificate_id': certificate._id
    });

    res.status(200).json({
      success: true,
      certificate_id: certificateId,
      audit_history: auditLogs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Certificate audit history error:', error);
    res.status(500).json({ error: 'Failed to get certificate audit history', details: error.message });
  }
};