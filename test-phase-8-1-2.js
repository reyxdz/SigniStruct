#!/usr/bin/env node

/**
 * Phase 8.1.2 Test Script
 * 
 * Run this to test the POST /api/verification/documents/:documentId/verify-all endpoint
 * 
 * Usage:
 *   node test-phase-8-1-2.js <BASE_URL> <JWT_TOKEN> <DOCUMENT_ID>
 * 
 * Example:
 *   node test-phase-8-1-2.js http://localhost:5000 "eyJhbGciOi..." "507f1f77bcf86cd799439011"
 */

const https = require('https');
const http = require('http');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(message, 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');
}

// Get command line arguments
const args = process.argv.slice(2);
let baseUrl = args[0] || 'http://localhost:5000';
let jwtToken = args[1];
let documentId = args[2];

// Validate inputs
logHeader('Phase 8.1.2 Verification Endpoint Test');

if (!jwtToken) {
  logError('JWT Token is required!');
  log('\nUsage: node test-phase-8-1-2.js <BASE_URL> <JWT_TOKEN> <DOCUMENT_ID>');
  log('\nExample:');
  log('  node test-phase-8-1-2.js http://localhost:5000 "eyJhbGc..." "507f1f77bcf86cd799439011"');
  process.exit(1);
}

if (!documentId) {
  logWarning('Document ID not provided, will test with invalid ID');
  documentId = 'invalid_id_test_123';
}

logInfo(`Base URL: ${baseUrl}`);
logInfo(`JWT Token: ${jwtToken.substring(0, 20)}...`);
logInfo(`Document ID: ${documentId}`);

// Test configuration
const testUrl = new URL(`${baseUrl}/api/verification/documents/${documentId}/verify-all`);
const isHttps = testUrl.protocol === 'https:';
const client = isHttps ? https : http;

const options = {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Phase-8.1.2-Test-Script'
  }
};

// Run the test
logHeader('Sending Request');

logInfo(`Method: POST`);
logInfo(`Path: ${testUrl.pathname}`);
logInfo(`Host: ${testUrl.host}`);

const startTime = Date.now();

const request = client.request(testUrl, options, (response) => {
  let responseBody = '';

  response.on('data', (chunk) => {
    responseBody += chunk;
  });

  response.on('end', () => {
    const duration = Date.now() - startTime;
    
    logHeader('Response Received');
    
    log(`Status Code: ${response.statusCode}`, response.statusCode === 200 ? 'green' : (response.statusCode < 500 ? 'yellow' : 'red'));
    logInfo(`Duration: ${duration}ms`);
    logInfo(`Content-Type: ${response.headers['content-type']}`);
    
    // Try to parse JSON
    let jsonData;
    try {
      jsonData = JSON.parse(responseBody);
      
      logHeader('Response Body');
      log(JSON.stringify(jsonData, null, 2), 'cyan');
      
      // Validate response
      logHeader('Response Validation');
      
      if (response.statusCode === 200) {
        // Success response checks
        if (jsonData.success === true) {
          logSuccess('Response marked as success');
        } else {
          logError('Response marked as not successful');
        }
        
        if (jsonData.data) {
          logSuccess('Has "data" field');
          
          if (jsonData.data.verification) {
            logSuccess('Has verification object');
            
            if (jsonData.data.verification.document_id) {
              logSuccess(`Document ID verified: ${jsonData.data.verification.document_id}`);
            }
            
            if (typeof jsonData.data.verification.signature_count === 'number') {
              logSuccess(`Total signatures: ${jsonData.data.verification.signature_count}`);
            }
            
            if (typeof jsonData.data.verification.verified_count === 'number') {
              logSuccess(`Valid signatures: ${jsonData.data.verification.verified_count}`);
            }
          }
          
          if (jsonData.data.tampering) {
            logSuccess('Has tampering object');
            if (typeof jsonData.data.tampering.tampered === 'boolean') {
              logSuccess(`Tampering detected: ${jsonData.data.tampering.tampered}`);
            }
          }
          
          if (jsonData.data.summary) {
            logSuccess('Has summary object');
            
            if (jsonData.data.summary.requestId) {
              logSuccess(`Request ID: ${jsonData.data.summary.requestId}`);
            }
            
            if (jsonData.data.summary.verificationDuration) {
              logSuccess(`Verification duration: ${jsonData.data.summary.verificationDuration}`);
            }
            
            if (jsonData.data.summary.overallStatus) {
              logSuccess(`Overall status: ${jsonData.data.summary.overallStatus}`);
            }
          }
        }
      } else if (response.statusCode === 404) {
        logWarning('Document not found (expected if document ID is invalid)');
        if (jsonData.code === 'DOCUMENT_NOT_FOUND') {
          logSuccess('Correct error code returned');
        }
      } else if (response.statusCode === 403) {
        logWarning('Unauthorized (expected if user is not document owner)');
        if (jsonData.code === 'UNAUTHORIZED') {
          logSuccess('Correct error code returned');
        }
      } else if (response.statusCode >= 500) {
        logError('Server error occurred');
        if (jsonData.message) {
          logError(`Error message: ${jsonData.message}`);
        }
      }
      
    } catch (parseError) {
      logError('Failed to parse response as JSON');
      logError(`Parse error: ${parseError.message}`);
      log(`Raw response: ${responseBody}`, 'yellow');
    }
    
    logHeader('Test Complete');
    logSuccess('Phase 8.1.2 endpoint test finished');
    process.exit(response.statusCode === 200 ? 0 : 1);
  });
});

request.on('error', (error) => {
  const duration = Date.now() - startTime;
  
  logError(`Request failed after ${duration}ms`);
  logError(`Error: ${error.message}`);
  logError(`Code: ${error.code}`);
  
  if (error.code === 'ECONNREFUSED') {
    logError('Connection refused - is the backend running?');
    logInfo(`Try: npm start`);
  } else if (error.code === 'ENOTFOUND') {
    logError('Host not found - check your BASE_URL');
  }
  
  process.exit(1);
});

request.on('timeout', () => {
  logError('Request timed out after 10 seconds');
  logInfo('Is the backend responding?');
  process.exit(1);
});

// Set timeout
request.setTimeout(10000);

log('\n📝 Sending request... (waiting for response)\n');

// Send request
request.end();
