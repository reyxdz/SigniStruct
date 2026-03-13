/**
 * Email Templates for SigniStruct
 * Provides HTML and text templates for different email types
 */

const templates = {
  /**
   * Signing Request Invitation
   */
  signingRequestInvitation: (data) => {
    const {
      recipientName = 'Recipient',
      senderName = 'User',
      senderEmail,
      documentTitle,
      message = '',
      shareLink,
      expirationDate,
      companyName = 'SigniStruct'
    } = data;

    const expiryText = new Date(expirationDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: white; }
            .message-box { background: #f0f8ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #0056b3; }
            .details { background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .detail-row { margin: 10px 0; }
            .detail-label { font-weight: 600; color: #666; }
            .detail-value { color: #333; margin-left: 10px; }
            .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            .warning { color: #856404; background: #fff3cd; border: 1px solid #ffeaa7; padding: 12px; border-radius: 4px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Signing Request</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              
              <p><strong>${senderName}</strong> has requested your signature on a document.</p>
              
              <h2>Document Details</h2>
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Document:</span>
                  <span class="detail-value">${documentTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">From:</span>
                  <span class="detail-value">${senderEmail}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Expires:</span>
                  <span class="detail-value">${expiryText}</span>
                </div>
              </div>

              ${message ? `
                <h3>Message from Sender:</h3>
                <div class="message-box">
                  <p>${message}</p>
                </div>
              ` : ''}

              <p style="text-align: center; margin: 30px 0;">
                <a href="${shareLink}" class="button">Review & Sign Document</a>
              </p>

              <div class="warning">
                <strong>⏰ Important:</strong> This request expires on <strong>${expiryText}</strong>. Please complete your review and signature before this date.
              </div>

              <p style="color: #666; font-size: 14px;">
                If you're unable to access the document or have concerns about this request, please contact ${senderName} directly at ${senderEmail}.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this address.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Signing Request

Hi ${recipientName},

${senderName} has requested your signature on a document.

Document Details:
- Document: ${documentTitle}
- From: ${senderEmail}
- Expires: ${expiryText}

${message ? `Message from Sender:\n${message}\n` : ''}

Review & Sign Document:
${shareLink}

Important: This request expires on ${expiryText}. Please complete your review and signature before this date.

If you're unable to access the document or have concerns about this request, please contact ${senderName} directly at ${senderEmail}.

---
© ${new Date().getFullYear()} ${companyName}. All rights reserved.
This is an automated email. Please do not reply to this address.
    `;

    return { html, text };
  },

  /**
   * Reminder Email
   */
  reminderEmail: (data) => {
    const {
      recipientName = 'Recipient',
      senderName = 'User',
      senderEmail,
      documentTitle,
      shareLink,
      expirationDate,
      reminderCount = 1,
      companyName = 'SigniStruct'
    } = data;

    const expiryText = new Date(expirationDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: white; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #0056b3; }
            .alert { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
            h1 { margin: 0; font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Reminder: Pending Signature</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              
              <p>This is a reminder that <strong>${senderName}</strong> is still waiting for your signature on:</p>
              <p style="font-size: 18px; font-weight: 600; color: #007bff; margin: 20px 0;">${documentTitle}</p>

              <div class="alert">
                <strong>⏰ Deadline: ${expiryText}</strong>
                <p>Please sign this document before the deadline to avoid delays.</p>
              </div>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${shareLink}" class="button">Complete Signature Now</a>
              </p>

              <p style="color: #666; font-size: 14px;">
                If you have questions about this document or the signing process, please reach out to ${senderName} at ${senderEmail}.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this address.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Reminder: Pending Signature

Hi ${recipientName},

This is a reminder that ${senderName} is still waiting for your signature on:

${documentTitle}

Deadline: ${expiryText}
Please sign this document before the deadline to avoid delays.

Complete Signature Now:
${shareLink}

If you have questions about this document or the signing process, please reach out to ${senderName} at ${senderEmail}.

---
© ${new Date().getFullYear()} ${companyName}. All rights reserved.
This is an automated email. Please do not reply to this address.
    `;

    return { html, text };
  },

  /**
   * Signature Confirmation Email (Sent to all participants)
   */
  signatureConfirmationEmail: (data) => {
    const {
      recipientName = 'Recipient',
      signerName = 'User',
      signerEmail,
      documentTitle,
      signedAt,
      companyName = 'SigniStruct'
    } = data;

    const signedDate = new Date(signedAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: white; }
            .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
            h1 { margin: 0; font-size: 24px; }
            .checkmark { font-size: 48px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="checkmark">✓</div>
              <h1>Document Signed</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              
              <div class="success-box">
                <p><strong>${signerName}</strong> (${signerEmail}) has successfully signed the document:</p>
                <p style="font-size: 18px; font-weight: 600; margin: 10px 0;">📄 ${documentTitle}</p>
                <p style="margin: 10px 0;"><strong>Signed on:</strong> ${signedDate}</p>
              </div>

              <p>The signing process is progressing as expected. You will receive updates as other signers complete their signatures.</p>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Thank you for using ${companyName} for secure document signing.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this address.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Document Signed

Hi ${recipientName},

${signerName} (${signerEmail}) has successfully signed the document:

${documentTitle}

Signed on: ${signedDate}

The signing process is progressing as expected. You will receive updates as other signers complete their signatures.

Thank you for using ${companyName} for secure document signing.

---
© ${new Date().getFullYear()} ${companyName}. All rights reserved.
This is an automated email. Please do not reply to this address.
    `;

    return { html, text };
  },

  /**
   * Request Declined Email
   */
  requestDeclinedEmail: (data) => {
    const {
      documentOwnerName = 'User',
      recipientName = 'Recipient',
      recipientEmail,
      documentTitle,
      reason = '',
      companyName = 'SigniStruct'
    } = data;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: white; }
            .decline-box { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
            h1 { margin: 0; font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Request Declined</h1>
            </div>
            <div class="content">
              <p>Hi ${documentOwnerName},</p>
              
              <div class="decline-box">
                <p><strong>${recipientName}</strong> (${recipientEmail}) has declined your signing request for:</p>
                <p style="font-size: 18px; font-weight: 600; margin: 10px 0;">📄 ${documentTitle}</p>
                ${reason ? `
                  <p><strong>Reason:</strong></p>
                  <p>${reason}</p>
                ` : ''}
              </div>

              <p>You may want to contact ${recipientName} directly to discuss the reason for declining or to send a new request to another recipient.</p>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                You can send a new signing request to another person through your document management dashboard.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this address.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Request Declined

Hi ${documentOwnerName},

${recipientName} (${recipientEmail}) has declined your signing request for:

${documentTitle}

${reason ? `Reason:\n${reason}\n` : ''}

You may want to contact ${recipientName} directly to discuss the reason for declining or to send a new request to another recipient.

You can send a new signing request to another person through your document management dashboard.

---
© ${new Date().getFullYear()} ${companyName}. All rights reserved.
This is an automated email. Please do not reply to this address.
    `;

    return { html, text };
  },

  /**
   * Certificate Expiry Notification
   */
  certificateExpiryNotification: (data) => {
    const {
      userName = 'User',
      certificateId,
      expiryDate,
      timeframe = '30 days',
      certificateUrl,
      companyName = 'SigniStruct'
    } = data;

    const expiryDateFormatted = new Date(expiryDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: white; }
            .warning-box { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #f57c00; }
            .details { background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .detail-row { margin: 10px 0; }
            .detail-label { font-weight: 600; color: #666; }
            .detail-value { color: #333; margin-left: 10px; }
            .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #ff9800; border-bottom: 2px solid #ff9800; padding-bottom: 10px; }
            .urgent { color: #d32f2f; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Certificate Expiry Notice</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              
              <div class="warning-box">
                <p><strong>Your digital certificate will expire in ${timeframe}.</strong></p>
              </div>

              <h2>Certificate Details</h2>
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Certificate ID:</span>
                  <span class="detail-value">${certificateId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Expiry Date:</span>
                  <span class="detail-value urgent">${expiryDateFormatted}</span>
                </div>
              </div>

              <h2>What You Should Do</h2>
              <p>To ensure uninterrupted access to your digital signing capabilities, please renew your certificate before it expires. After expiration, you will not be able to use this certificate for signing documents.</p>

              <p><strong>Steps to renew your certificate:</strong></p>
              <ol>
                <li>Log in to your ${companyName} account</li>
                <li>Go to Settings → Certificates</li>
                <li>Find your certificate and click "Renew"</li>
                <li>Follow the renewal process</li>
              </ol>

              <a href="${certificateUrl}" class="button">Renew Certificate Now</a>

              <h2>About Certificate Renewal</h2>
              <p>Renewing your certificate will:</p>
              <ul>
                <li>Generate a new digital certificate with extended validity</li>
                <li>Maintain your signing history and audit trails</li>
                <li>Ensure continuity of your digital signing operations</li>
              </ul>

              <p><strong>Questions?</strong> Contact our support team for assistance with certificate renewal or any other issues.</p>

              <p>Best regards,<br/>The ${companyName} Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this address.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Certificate Expiry Notice

Hi ${userName},

Your digital certificate will expire in ${timeframe}.

Certificate Details:
ID: ${certificateId}
Expiry Date: ${expiryDateFormatted}

What You Should Do:
To ensure uninterrupted access to your digital signing capabilities, please renew your certificate before it expires. After expiration, you will not be able to use this certificate for signing documents.

Steps to renew your certificate:
1. Log in to your ${companyName} account
2. Go to Settings → Certificates
3. Find your certificate and click "Renew"
4. Follow the renewal process

Renew your certificate here: ${certificateUrl}

About Certificate Renewal:
Renewing your certificate will:
- Generate a new digital certificate with extended validity
- Maintain your signing history and audit trails
- Ensure continuity of your digital signing operations

Questions? Contact our support team for assistance.

Best regards,
The ${companyName} Team

---
© ${new Date().getFullYear()} ${companyName}. All rights reserved.
This is an automated email. Please do not reply to this address.
    `;

    return { html, text };
  }
};

module.exports = templates;

