/**
 * Crypto Console Logger
 * 
 * Reads `_crypto_logs` from backend API responses and prints them
 * as styled, grouped entries in the browser DevTools console.
 * 
 * This only runs when the backend has CRYPTO_LOGGING=true in .env,
 * which causes the backend to include _crypto_logs in responses.
 */

const CATEGORY_STYLES = {
  RSA:     'color: #e74c3c; font-weight: bold;', // Red
  AES:     'color: #3498db; font-weight: bold;', // Blue
  HASH:    'color: #2ecc71; font-weight: bold;', // Green
  SIGN:    'color: #e67e22; font-weight: bold;', // Orange
  VERIFY:  'color: #9b59b6; font-weight: bold;', // Purple
  CERT:    'color: #1abc9c; font-weight: bold;', // Teal
  ENCRYPT: 'color: #3498db; font-weight: bold;', // Blue
  DECRYPT: 'color: #f39c12; font-weight: bold;', // Gold
  HMAC:    'color: #16a085; font-weight: bold;', // Dark Teal
  KEY:     'color: #e91e63; font-weight: bold;', // Pink
};

const CATEGORY_ICONS = {
  RSA:     '🔑',
  AES:     '🔒',
  HASH:    '🔢',
  SIGN:    '✍️',
  VERIFY:  '✅',
  CERT:    '📜',
  ENCRYPT: '🔐',
  DECRYPT: '🔓',
  HMAC:    '🛡️',
  KEY:     '🗝️',
};

/**
 * Print crypto operation logs from an API response to the browser console.
 * 
 * @param {Array} logs - Array of crypto log entries from _crypto_logs
 * @param {string} endpoint - The API endpoint that produced these logs
 */
export function printCryptoLogs(logs, endpoint = '') {
  if (!logs || !Array.isArray(logs) || logs.length === 0) return;

  const title = endpoint
    ? `🔐 Crypto Operations — ${endpoint}`
    : '🔐 Crypto Operations';

  console.groupCollapsed(
    `%c${title} %c(${logs.length} operation${logs.length > 1 ? 's' : ''})`,
    'color: #e74c3c; font-size: 13px; font-weight: bold;',
    'color: #7f8c8d; font-size: 11px; font-weight: normal;'
  );

  logs.forEach((entry, index) => {
    const icon = CATEGORY_ICONS[entry.category] || '🔧';
    const style = CATEGORY_STYLES[entry.category] || 'color: gray;';

    console.groupCollapsed(
      `%c${icon} [${entry.category}] %c${entry.operation}`,
      style,
      'color: inherit; font-weight: normal;'
    );

    // Print details as a table if there are multiple keys, otherwise just log them
    if (entry.details && Object.keys(entry.details).length > 0) {
      console.table(entry.details);
    }

    // Timestamp
    if (entry.timestamp) {
      console.log('%cTimestamp: %c' + entry.timestamp, 'color: #95a5a6;', 'color: #bdc3c7;');
    }

    console.groupEnd();
  });

  console.groupEnd();
}

/**
 * Check an API response for _crypto_logs and print them.
 * This is meant to be called from an Axios response interceptor.
 * 
 * @param {object} response - Axios response object
 */
export function handleCryptoLogs(response) {
  const data = response?.data;
  if (!data || typeof data !== 'object') return;

  // Extract endpoint from request config
  const endpoint = response.config?.url || '';

  if (data._crypto_logs && data._crypto_logs.length > 0) {
    printCryptoLogs(data._crypto_logs, endpoint);
  }
}

const logger = { printCryptoLogs, handleCryptoLogs };

export default logger;
