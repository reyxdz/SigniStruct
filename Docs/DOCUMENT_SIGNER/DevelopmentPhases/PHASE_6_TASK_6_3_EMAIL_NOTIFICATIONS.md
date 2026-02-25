# Phase 6 Task 6.3: Email Notifications & Background Jobs

## Overview

Phase 6.3 implements a comprehensive email notification system that automatically notifies document parties about signing requests, reminders, confirmations, and declinations. The system integrates with multiple email providers (SMTP, Gmail, SendGrid) and includes background job scheduling for automated reminders and request expiration.

### Key Features

- **Multi-Provider Email Support**: SMTP, Gmail, SendGrid with automatic fallback
- **Professional HTML/Text Templates**: 4 responsive email templates for all signing lifecycle events
- **Background Job Scheduling**: Automated reminders, expiration processing, and audit log cleanup
- **Non-Blocking Email**: Email failures don't interrupt core signing workflows
- **Comprehensive Logging**: All email operations logged to audit trail for compliance
- **Error Handling**: Graceful degradation when email service not configured

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Signing Workflow                            │
│  (createSigningRequest → acceptSigningRequest → etc)             │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                ┌──────────▼───────────┐
                │  SigningRequest      │
                │  Service             │
                └──────────┬───────────┘
                           │
                ┌──────────▼────────────────┐
                │ NotificationService       │
                │ - sendSigningRequestEmail │
                │ - sendReminderEmail       │
                │ - sendConfirmationEmails  │
                │ - sendDeclineEmail        │
                └──────────┬────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼─────────┐  ┌────▼──────────────┐
│EmailService  │  │EmailTemplates    │  │BackgroundJobs     │
│(Transporter) │  │(HTML/Text)       │  │(Cron Scheduling)  │
│ - SMTP       │  │ - Invitation     │  │(Uses node-cron)   │
│ - Gmail      │  │ - Reminder       │  └───────────────────┘
│ - SendGrid   │  │ - Confirmation   │
│ - Fallback   │  │ - Decline        │
└──────────────┘  └──────────────────┘
```

## Components

### 1. EmailService (`backend/src/services/emailService.js`)

Core email sending service with multi-provider support.

#### Responsibilities
- Initialize email transporter with configured provider
- Send plain text and HTML emails
- Verify email connectivity on startup
- Handle provider-specific authentication
- Graceful fallback when email not configured

#### Email Providers

**SMTP Configuration**
```javascript
{
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
}
```

**Gmail Configuration**
```javascript
{
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD  // App-specific password, not regular password
  }
}
```

**SendGrid Configuration**
```javascript
{
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
}
```

#### Methods

**`initialize()`** - Async initialization
- Creates transporter based on configured provider
- Verifies connection with test email
- Logs configuration details
- Non-blocking failure (continues if email not configured)

**`sendEmail(to, subject, text, html)`** - Send email
- Parameters:
  - `to`: Recipient email address
  - `subject`: Email subject line
  - `text`: Plain text version
  - `html`: HTML version
- Returns: Promise with result or error
- Handles transporter errors gracefully

**`verifyConnection()`** - Verify connectivity
- Tests if transporter can connect
- Called on initialization
- Logs success/failure
- Non-blocking failure

**`testEmail(testEmail)`** - Send test mail
- Parameters: Test email address
- Used for validation during setup
- Returns success/failure

### 2. EmailTemplates (`backend/src/services/emailTemplates.js`)

Professional HTML and plain text email templates for all signing lifecycle events.

#### Template Structure

All templates include:
- Company branding (configurable via `COMPANY_NAME` env var)
- Responsive design for mobile/desktop
- Professional HTML structure
- Plain text fallback
- Dynamic variable substitution
- Footer with legal/unsubscribe information

#### Templates Available

**Signing Request Invitation Template**
- **Purpose**: Initial notification when signing request created
- **Recipient**: Person invited to sign
- **Content**:
  - Greeting with sender name
  - Document title and sender email
  - Personal message from sender (if provided)
  - Expiration date with countdown
  - Direct signing link with call-to-action button
  - Document description/context
- **Visual**: Blue gradient header, professional styling
- **Triggered By**: `signatureRequests.create()` → `notificationService.sendSigningRequestEmail()`

**Reminder Email Template**
- **Purpose**: Automated reminder for pending signing requests
- **Recipient**: Signer with overdue request
- **Content**:
  - Emphasis on deadline approaching
  - Days/hours remaining until expiration
  - Reminder count tracking ("2nd reminder", etc.)
  - Direct link to document
  - Professional but urgent tone
- **Visual**: Orange/yellow gradient for urgency
- **Triggered By**: Background job hourly → `notificationService.sendReminderEmail()`

**Signature Confirmation Template**
- **Purpose**: Notify all parties when document signed
- **Recipient**: Document owner and other signers
- **Content**:
  - Confirmed date and time of signature
  - Signer name and email
  - Current signature status (e.g., "2 of 3 signed")
  - Progress indication
  - Document title and link
- **Visual**: Green gradient for success
- **Triggered By**: `signingRequests.accept()` → `notificationService.sendSignatureConfirmationEmails()`

**Request Declined Template**
- **Purpose**: Notify document owner when request declined
- **Recipient**: Document owner
- **Content**:
  - Decline reason (if provided)
  - Declined party name and email
  - Date/time of decline
  - Optional next steps guidance
- **Visual**: Red gradient for decline status
- **Triggered By**: `signingRequests.decline()` → `notificationService.sendDeclineNotificationEmail()`

#### Template Variables

| Variable | Description | Template(s) |
|----------|-------------|-----------|
| `recipientName` | First name of email recipient | All templates |
| `senderName` | Name of document owner/sender | Invitation, Decline |
| `senderEmail` | Email of document owner | Invitation, Decline |
| `documentTitle` | Title of the document | All templates |
| `shareLink` | Direct URL for signing | Invitation, Reminder, Confirmation |
| `expirationDate` | Deadline for signing | Invitation, Reminder |
| `daysRemaining` | Days until expiration | Reminder |
| `reminderCount` | How many reminders sent | Reminder |
| `signerName` | Name of person signing | Confirmation, Decline |
| `signerEmail` | Email of person signing | Confirmation, Decline |
| `signatureDate` | Date signature received | Confirmation, Decline |
| `completionStatus` | "X of Y signers" | Confirmation |
| `declineReason` | Why request was declined | Decline |
| `companyName` | Organization name | All templates |
| `companyLogo` | Company logo URL or inline | All templates |

### 3. NotificationService (`backend/src/services/notificationService.js`)

Orchestrates email sending for signing lifecycle events.

#### Methods

**`sendSigningRequestEmail(requestId)`** - Send initial invitation
```javascript
Parameters:
  - requestId: ObjectId of signing request

Flow:
1. Fetch request with document and sender details
2. Query share URL from environment/config
3. Format expiration date with countdown
4. Load invitation template with variables
5. Send via emailService.sendEmail()
6. Log to audit trail (notification_type: 'email')
7. Non-blocking error handling

Logs:
  - Signing request invitation sent to ${recipientEmail}
  - Email notification failed for request ${requestId}
```

**`sendReminderEmail(requestId)`** - Send reminder for pending request
```javascript
Parameters:
  - requestId: ObjectId of signing request

Flow:
1. Fetch request and verify status is 'pending'
2. Calculate minutes since last reminder
3. If last reminder > 24 hours ago (or no last reminder):
   - Increment reminder count in database
   - Load reminder template with countdown
   - Send via emailService.sendEmail()
   - Log to audit trail with reminder_count
   - Set last_reminder_sent timestamp
4. If last reminder < 24 hours ago, skip (prevent spam)

Logs:
  - Reminder #${count} sent to ${email} for request ${requestId}
  - Request not due for reminder
```

**`sendSignatureConfirmationEmails(documentId, signerId)`** - Notify all parties on signature
```javascript
Parameters:
  - documentId: ObjectId of document
  - signerId: ObjectId of person who signed

Flow:
1. Fetch document with all signing requests
2. Get signer name from User model
3. Find all unique recipients (document owner + other signers)
4. For each recipient:
   - Load confirmation template with variables
   - Send via emailService.sendEmail()
   - Log to audit trail (notification_type: 'email')
   - Continue on error (non-blocking)
5. Return success/failure count

Logs:
  - Signature confirmation sent for document ${documentId}
  - Email failed for participant ${email}
```

**`sendDeclineNotificationEmail(requestId)`** - Notify owner of decline
```javascript
Parameters:
  - requestId: ObjectId of signing request

Flow:
1. Fetch request and find document owner
2. Get decline reason from request
3. Load decline template with variables
4. Send via emailService.sendEmail()
5. Log to audit trail (notification_type: 'email')
6. Non-blocking error handling

Logs:
  - Decline notification sent for request ${requestId}
  - Email notification failed
```

**`sendPendingReminders()`** - Batch job for sending reminders
```javascript
No parameters (called by background job)

Flow:
1. Find all pending requests:
   - status = 'pending'
   - last_reminder_sent < 24 hours ago OR null
   - expiration_date > now (not yet expired)
2. For each request:
   - Call sendReminderEmail(requestId)
   - Collect success/failure statistics
3. Return { sent: N, failed: M, errors: [...] }

Returns:
  {
    sent: 5,
    failed: 1,
    errors: ['Request 123: email service failed']
  }

Logs:
  - Begin sendPendingReminders() batch job
  - Sent 5 reminders, 1 failed
```

#### Error Handling Strategy

All email errors are **non-blocking**:
- Email failures caught and logged but don't throw
- Request operations (create, accept, decline) always complete
- Users shown success message even if email fails
- Administrators can see failed emails in audit logs
- Failed emails can be retried through batch jobs

```javascript
// Example pattern used throughout
try {
  await notificationService.sendSigningRequestEmail(signingRequest._id);
} catch (emailError) {
  console.warn(`Email notification failed for request ${signingRequest._id}:`, emailError.message);
  // Request still succeeds, email failure is just logged
}
```

### 4. BackgroundJobService (`backend/src/services/backgroundJobService.js`)

Executes background jobs without blocking request handlers.

#### Static Methods

**`processPendingReminders()`** - Hourly reminder processing
```javascript
Static method, no parameters

Job Schedule: Every hour at 0 minutes (e.g., 1:00 AM, 2:00 AM)

Flow:
1. Log job start
2. Call notificationService.sendPendingReminders()
3. Log completion with statistics
4. Handle errors gracefully

Example Log Output:
  [09:00:00] Background job: Begin processing pending reminders
  [09:00:15] Sent 3 reminders, 0 failed
  [09:00:15] Background job: Reminders completed successfully
```

**`expireOverdueRequests()`** - Expire old requests
```javascript
Static method, no parameters

Job Schedule: Every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)

Flow:
1. Find all requests:
   - status = 'pending'
   - expiration_date < now
2. Update status to 'expired' for each
3. Log count of expired requests
4. Handle errors gracefully

Example Log Output:
  [12:00:00] Background job: Begin expiring overdue requests
  [12:00:05] Expired 2 pending requests
  [12:00:05] Background job: Expiration completed successfully
```

**`cleanupOldAuditLogs(daysOld)`** - Cleanup old audit logs
```javascript
Static method

Parameters:
  - daysOld: Number of days to keep (default: 90)

Job Schedule: Daily at 2:00 AM UTC

Flow:
1. Calculate cutoff date (today - daysOld)
2. Delete all audit logs created before cutoff
3. Log number of deleted logs
4. Handle errors gracefully

Example Log Output:
  [02:00:00] Background job: Begin cleanup of old audit logs (>90 days)
  [02:00:02] Deleted 157 audit log entries
  [02:00:02] Background job: Cleanup completed successfully
```

### 5. EmailConfig (`backend/src/config/emailConfig.js`)

Initialization and scheduling of email services and background jobs.

#### Startup Flow

**Step 1: `initializeEmailServices()`** - Called after MongoDB connection
```javascript
async function initializeEmailServices()

Flow:
1. Log: "Initializing email services..."
2. Try/catch block:
   - Check if SMTP_HOST, GMAIL_EMAIL, or SENDGRID_API_KEY configured
   - If none configured:
     - Log warning with required variables
     - Return (non-blocking)
   - Call emailService.initialize()
   - Log configuration details (provider, test result, etc.)
3. On error:
   - Log warning (non-blocking, doesn't prevent startup)
4. On success:
   - Log: "✓ Email service initialized successfully"
   - Display configured provider: "Provider: SMTP" or "Provider: Gmail"

Timing: Synchronous, executed during server startup
Return: Promise that resolves (doesn't reject)
```

**Step 2: `setupEmailBackgroundJobs()`** - Setup cron scheduling
```javascript
function setupEmailBackgroundJobs()

Dependencies:
  - Requires node-cron package installed

Flow:
1. Check if node-cron installed
2. If not installed:
   - Log warning about missing package
   - Return (non-blocking)
3. Setup three scheduled jobs:
   a) Reminder processing:
      - Cron: '0 * * * *' (every hour at 0 minutes)
      - Task: backgroundJobService.processPendingReminders()
      - Log: "Scheduled job: Send pending reminders (every hour)"
   
   b) Expiration processing:
      - Cron: '0 */6 * * *' (every 6 hours)
      - Task: backgroundJobService.expireOverdueRequests()
      - Log: "Scheduled job: Expire overdue requests (every 6 hours)"
   
   c) Audit log cleanup:
      - Cron: '0 2 * * *' (daily at 2:00 AM)
      - Task: backgroundJobService.cleanupOldAuditLogs(90)
      - Log: "Scheduled job: Clean old audit logs (daily at 2 AM)"

4. Log final summary

Timing: Synchronous setup, jobs run async
Return: void
Errors: Logged as warnings, don't prevent startup
```

#### Cron Schedule Reference

| Schedule | Description | Example Times |
|----------|-------------|---|
| `0 * * * *` | Every hour at 0 minutes | 1:00, 2:00, 3:00, ... |
| `0 */6 * * *` | Every 6 hours at 0 minutes | 0:00, 6:00, 12:00, 18:00 |
| `0 2 * * *` | Daily at 2:00 AM | 2:00 AM every day |
| `0 0 * * 0` | Weekly at midnight Sunday | Once per week |

All times are in the system's local timezone. For UTC, configure system timezone or modify cron expressions.

## Integration Points

### 1. SigningRequestService Modifications

Three integration points where emails are triggered:

**Point 1: After Request Creation**
```javascript
// File: backend/src/services/signingRequestService.js
// Method: createSigningRequest()
// Line: ~72

// Send invitation email (non-blocking)
try {
  await notificationService.sendSigningRequestEmail(signingRequest._id);
} catch (emailError) {
  console.warn(`Email notification failed for request ${signingRequest._id}:`, emailError.message);
}
```

**Point 2: After Request Acceptance**
```javascript
// File: backend/src/services/signingRequestService.js
// Method: acceptSigningRequest()
// Line: ~213

// Send confirmation email (non-blocking)
try {
  await notificationService.sendSignatureConfirmationEmails(request.document_id, recipientId);
} catch (emailError) {
  console.warn(`Email notification failed for accepted request ${requestId}:`, emailError.message);
}
```

**Point 3: After Request Decline**
```javascript
// File: backend/src/services/signingRequestService.js
// Method: declineSigningRequest()
// Line: ~245

// Send decline notification (non-blocking)
try {
  await notificationService.sendDeclineNotificationEmail(requestId);
} catch (emailError) {
  console.warn(`Email notification failed for declined request ${requestId}:`, emailError.message);
}
```

### 2. Server Startup Integration

Modified `backend/src/server.js`:

```javascript
// Line: 14
const { initializeEmailServices, setupEmailBackgroundJobs } = require('./config/emailConfig');

// Line: 35-37 (inside connectDB function)
// Initialize email services
await initializeEmailServices();

// Setup background jobs for email reminders, expiration, and cleanup
setupEmailBackgroundJobs();
```

## Environment Configuration

### Required Environment Variables

Create `.env` file in `backend/` directory with one email provider configured:

**Option 1: SMTP Provider**
```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

**Option 2: Gmail Direct**
```env
# Gmail Configuration
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password
```

**Option 3: SendGrid**
```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Optional Configuration Variables

```env
# Email Customization
FROM_EMAIL=noreply@yourdomain.com
COMPANY_NAME=SigniStruct
COMPANY_LOGO_URL=https://yourdomain.com/logo.png

# Share Link Configuration
SIGNING_SHARE_URL=https://app.yourdomain.com/sign

# Audit Log Retention
AUDIT_LOG_RETENTION_DAYS=90

# Email Service (for testing)
EMAIL_DEBUG=false
```

### Provider Setup Guides

**Gmail SMTP Setup**
1. Enable 2-Factor Authentication on Google Account
2. Generate App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy generated password (16 characters)
3. Use in `SMTP_USER` and `SMTP_PASSWORD` (not your regular password)
4. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`

**SendGrid Setup**
1. Create account at https://sendgrid.com
2. Verify sender email address
3. Generate API key:
   - Settings → API Keys → Create API Key
   - Copy full API key
4. Use as `SENDGRID_API_KEY` environment variable

**Custom SMTP Setup**
1. Obtain SMTP credentials from email provider
2. Test connection with provided host/port
3. Set secure based on port (usually 465=true, 587=false)
4. Use credentials in `SMTP_USER` and `SMTP_PASSWORD`

## Audit Trail Integration

All email operations are logged to the `SignatureAuditLog` collection:

```javascript
{
  _id: ObjectId,
  action: 'email_notification',
  notification_type: 'signing_request_invitation' | 'reminder' | 'signature_confirmation' | 'request_declined',
  recipient_email: 'user@example.com',
  document_id: ObjectId,
  request_id: ObjectId,
  signer_id: ObjectId,
  timestamp: ISODate,
  status: 'sent' | 'failed',
  error_message: 'SMTP error...' // only if status: 'failed'
}
```

### Queries for Monitoring

**Get all emails sent in last 24 hours**
```javascript
db.SignatureAuditLogs.find({
  action: 'email_notification',
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
})
```

**Get all failed emails**
```javascript
db.SignatureAuditLogs.find({
  action: 'email_notification',
  status: 'failed'
}).sort({ timestamp: -1 })
```

**Get reminder count for a request**
```javascript
db.SignatureAuditLogs.countDocuments({
  request_id: ObjectId('...'),
  notification_type: 'reminder'
})
```

## Testing Strategy

### Unit Testing (Mock Emails)

```javascript
// Example: Mock emailService for testing
jest.mock('./emailService', () => ({
  initialize: jest.fn(),
  sendEmail: jest.fn().mockResolvedValue({ success: true })
}));

// Example: Test notification service
test('sendSigningRequestEmail sends invitation', async () => {
  await notificationService.sendSigningRequestEmail(requestId);
  expect(emailService.sendEmail).toHaveBeenCalledWith(
    expect.stringContaining('@'),
    expect.stringContaining('Sign Document'),
    expect.any(String),
    expect.any(String)
  );
});
```

### Integration Testing (Real Provider)

```javascript
// test/email-integration.js
const emailService = require('../services/emailService');

test('Send real email to test inbox', async () => {
  await emailService.initialize();
  const result = await emailService.sendEmail(
    process.env.TEST_EMAIL,
    'Test Subject',
    'Test text',
    '<p>Test HTML</p>'
  );
  expect(result.response).toBeDefined();
});
```

### Manual Testing

1. **Test Service Initialization**
   ```bash
   cd backend
   npm start
   # Check console for: "✓ Email service initialized successfully"
   ```

2. **Test Email Sending**
   ```javascript
   // In Node REPL or test file
   const emailService = require('./services/emailService');
   await emailService.initialize();
   await emailService.sendEmail(
     'test@example.com',
     'Test Email',
     'This is a test',
     '<p>This is a test</p>'
   );
   ```

3. **Test Background Jobs**
   - Create pending requests with expires_at in past
   - Wait for hourly job (or modify cron for testing)
   - Check audit logs for reminder emails sent
   - Check database for expired_at status change

4. **Test Template Rendering**
   - Create signing request
   - Check in audit logs if email notification created
   - Monitor email provider for delivery
   - Verify HTML renders correctly in email client

## Monitoring & Troubleshooting

### Common Issues

**Issue: "Email service not initialized"**
- Check console for initialization errors
- Verify environment variables set correctly
- Check provider-specific setup (Gmail app password, SendGrid API key)
- Ensure `.env` file exists in `backend/` directory

**Issue: Emails not sending**
- Check emailService logs for transporter errors
- Verify recipient email address is valid
- Test connectivity: `curl -v smtp.gmail.com:587`
- Check SMTP credentials are correct
- For Gmail: Ensure 2FA enabled and app password used

**Issue: Background jobs not running**
- Check if node-cron installed: `npm list node-cron`
- Verify server started successfully
- Check logs for "Scheduled job" messages
- Test cron expression: Use https://crontab.guru/
- Check system timezone matches expected job times

**Issue: Database audit logs growing too large**
- Background job cleanup runs daily
- Adjust `AUDIT_LOG_RETENTION_DAYS` environment variable
- Manually delete old logs:
  ```javascript
  db.SignatureAuditLogs.deleteMany({
    timestamp: { $lt: new Date('2024-01-01') }
  })
  ```

### Monitoring Queries

**Check email service status**
```bash
# Check if emails initialized during startup
grep "Email service initialized" backend/logs/*.log

# Count emails sent today
db.SignatureAuditLogs.countDocuments({
  action: 'email_notification',
  timestamp: { $gte: new Date().setHours(0,0,0,0) }
})
```

**Check background job execution**
```bash
# Watch for background job logs in real time
tail -f backend/logs/*.log | grep "Background job"
```

**Verify request lifecycle**
```javascript
// Trace all notifications for a request
db.SignatureAuditLogs.find({
  request_id: ObjectId('...')
}).sort({ timestamp: 1 })
```

## Future Enhancements

1. **Email Templates Management UI**
   - Allow customization of templates through admin panel
   - Preview templates before sending
   - A/B testing for different template versions

2. **Advanced Scheduling**
   - Custom reminder frequencies (e.g., after 3 days, 7 days)
   - Business hours-only sending
   - Different templates for different time zones

3. **Webhook Integrations**
   - Receive delivery status from email providers
   - Track open rates and click-through rates
   - Automatic retry on provider-side failures

4. **Multilingual Support**
   - Email templates in multiple languages
   - Language preference per user
   - Automatic detection based on locale

5. **Email Analytics**
   - Dashboard showing email metrics
   - Delivery rate statistics
   - Template performance comparison

6. **SMS Integration**
   - Alternative notification channel via SMS
   - SMS templates for time-sensitive notifications
   - Multi-channel preferences per user

7. **DLP (Data Loss Prevention)**
   - Watermark documents in email previews
   - Restrict forwarding of sensitive emails
   - Track leaked documents

## Summary

Phase 6.3 provides a production-ready email notification system that:

✅ **Notifies all parties** about signing requests, confirmations, reminders, and declinations
✅ **Integrates seamlessly** with multiple email providers
✅ **Maintains non-blocking architecture** where email failures don't interrupt core workflows
✅ **Automates reminders** through background job scheduling
✅ **Provides comprehensive logging** for compliance and troubleshooting
✅ **Gracefully degrades** when email service not configured

The system is ready for production deployment after environment variables are configured.

### Quick Start Checklist

- [ ] Choose email provider (SMTP, Gmail, or SendGrid)
- [ ] Configure environment variables in `backend/.env`
- [ ] Test email initialization: `npm start` and check logs
- [ ] Create test signing request and verify email received
- [ ] Adjust background job schedules if needed
- [ ] Set `AUDIT_LOG_RETENTION_DAYS` based on compliance requirements
- [ ] Monitor audit logs for email delivery failures
- [ ] Deploy to production after testing

### Files Modified/Created

**New Files (5):**
- `backend/src/services/emailService.js` (95 lines)
- `backend/src/services/emailTemplates.js` (580 lines)
- `backend/src/services/notificationService.js` (365 lines)
- `backend/src/services/backgroundJobService.js` (75 lines)
- `backend/src/config/emailConfig.js` (105 lines)

**Modified Files (2):**
- `backend/src/server.js` (+5 lines for email initialization)
- `backend/src/services/signingRequestService.js` (+21 lines for email triggers)

**Total Phase 6.3 Code:** ~1,240 lines
