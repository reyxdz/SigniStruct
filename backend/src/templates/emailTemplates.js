/**
 * Email Templates for SigniStruct
 * 
 * Beautiful HTML email templates for various notifications.
 * All templates are responsive and use inline styles for maximum
 * email client compatibility.
 */

/**
 * Generate a signing invitation email
 * @param {Object} options
 * @param {string} options.recipientName - Name of the signer
 * @param {string} options.senderName - Name of the document owner
 * @param {string} options.documentTitle - Title of the document
 * @param {string} options.signingLink - Full URL to the signing page
 * @param {string} options.expiresIn - Human-readable expiration (e.g., "30 days")
 * @returns {{ html: string, text: string }}
 */
function signingInvitation({ recipientName, senderName, documentTitle, signingLink, expiresIn = '30 days' }) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="font-size: 28px; font-weight: 700; color: #1E3A5F;">
                ✍️ SigniStruct
              </div>
              <div style="font-size: 12px; color: #6B7280; margin-top: 4px; letter-spacing: 1px;">
                DIGITAL DOCUMENT SIGNING
              </div>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
              
              <!-- Blue Accent Bar -->
              <div style="height: 4px; background: linear-gradient(90deg, #0EA5E9, #1E3A5F);"></div>
              
              <!-- Content -->
              <div style="padding: 40px 36px;">
                
                <!-- Greeting -->
                <p style="font-size: 18px; color: #1F2937; margin: 0 0 8px 0; font-weight: 600;">
                  Hi ${recipientName},
                </p>
                <p style="font-size: 15px; color: #4B5563; margin: 0 0 24px 0; line-height: 1.6;">
                  <strong>${senderName}</strong> has invited you to sign a document on SigniStruct.
                </p>

                <!-- Document Info Card -->
                <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
                  <div style="font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                    Document
                  </div>
                  <div style="font-size: 16px; color: #1F2937; font-weight: 600;">
                    📄 ${documentTitle}
                  </div>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin-bottom: 28px;">
                  <a href="${signingLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #0EA5E9, #0284C7); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">
                    Review &amp; Sign Document
                  </a>
                </div>

                <!-- Expiry Notice -->
                <p style="font-size: 13px; color: #6B7280; margin: 0 0 20px 0; text-align: center;">
                  ⏰ This link will expire in <strong>${expiresIn}</strong>.
                </p>

                <!-- Divider -->
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">

                <!-- Link Fallback -->
                <p style="font-size: 12px; color: #9CA3AF; margin: 0; line-height: 1.6;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${signingLink}" style="color: #0EA5E9; word-break: break-all;">${signingLink}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 20px;">
              <p style="font-size: 12px; color: #9CA3AF; margin: 0; line-height: 1.6;">
                This email was sent by SigniStruct on behalf of ${senderName}.<br>
                Your digital signatures are secured with RSA encryption and certificate-based verification.
              </p>
              <p style="font-size: 11px; color: #D1D5DB; margin: 12px 0 0 0;">
                © ${new Date().getFullYear()} SigniStruct. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${recipientName},

${senderName} has invited you to sign a document on SigniStruct.

Document: ${documentTitle}

Click the link below to review and sign:
${signingLink}

This link will expire in ${expiresIn}.

---
SigniStruct - Digital Document Signing
  `.trim();

  return { html, text };
}

/**
 * Generate a document completed notification email
 * Sent to the document owner when all signers have signed
 * @param {Object} options
 * @param {string} options.ownerName - Name of the document owner
 * @param {string} options.documentTitle - Title of the document
 * @param {Array} options.signers - List of signers with name & email
 * @param {string} options.viewLink - Link to view the document
 * @returns {{ html: string, text: string }}
 */
function documentCompleted({ ownerName, documentTitle, signers, viewLink }) {
  const signerRows = signers.map(s => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #1F2937;">${s.name}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #6B7280;">${s.email}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #059669;">✅ Signed</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="font-size: 28px; font-weight: 700; color: #1E3A5F;">
                ✍️ SigniStruct
              </div>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
              
              <!-- Green Accent Bar -->
              <div style="height: 4px; background: linear-gradient(90deg, #059669, #10B981);"></div>
              
              <!-- Content -->
              <div style="padding: 40px 36px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <div style="font-size: 48px;">🎉</div>
                </div>
                
                <p style="font-size: 18px; color: #1F2937; margin: 0 0 8px 0; font-weight: 600; text-align: center;">
                  Document Fully Signed!
                </p>
                <p style="font-size: 15px; color: #4B5563; margin: 0 0 24px 0; line-height: 1.6; text-align: center;">
                  Hi ${ownerName}, all signers have completed signing <strong>"${documentTitle}"</strong>.
                </p>

                <!-- Signers Table -->
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; margin-bottom: 28px;">
                  <tr style="background-color: #F9FAFB;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6B7280; text-transform: uppercase;">Name</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6B7280; text-transform: uppercase;">Email</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6B7280; text-transform: uppercase;">Status</th>
                  </tr>
                  ${signerRows}
                </table>

                <!-- CTA Button -->
                <div style="text-align: center;">
                  <a href="${viewLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #059669, #10B981); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    View Document
                  </a>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 20px;">
              <p style="font-size: 11px; color: #D1D5DB; margin: 0;">
                © ${new Date().getFullYear()} SigniStruct. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${ownerName},

Great news! All signers have completed signing "${documentTitle}".

Signers:
${signers.map(s => `- ${s.name} (${s.email}) — Signed`).join('\n')}

View your document: ${viewLink}

---
SigniStruct - Digital Document Signing
  `.trim();

  return { html, text };
}

module.exports = {
  signingInvitation,
  documentCompleted
};
