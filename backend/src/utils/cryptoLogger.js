/**
 * Crypto Logger Utility
 * 
 * A request-scoped logger that collects cryptographic operation logs
 * during API request processing. When CRYPTO_LOGGING is enabled in the
 * environment, these logs are attached to API responses under `_crypto_logs`
 * so the frontend can display them in the browser console.
 * 
 * Toggle: Set CRYPTO_LOGGING=true in .env to enable, remove/set to false to disable.
 */

class CryptoLogger {
  /**
   * Check if crypto logging is enabled
   * @returns {boolean}
   */
  static isEnabled() {
    return process.env.CRYPTO_LOGGING === 'true';
  }

  /**
   * Initialize the crypto log array on a request object.
   * Called by the middleware at the start of each request.
   * @param {object} req - Express request object
   */
  static init(req) {
    if (this.isEnabled()) {
      req._cryptoLogs = [];
    }
  }

  /**
   * Log a cryptographic operation.
   * If a request context is provided and logging is enabled,
   * the log entry is added to the request-scoped log array.
   * Also prints to server console for server-side visibility.
   * 
   * @param {object|null} req - Express request object (null for non-request contexts)
   * @param {string} category - Category: RSA, AES, HASH, SIGN, VERIFY, CERT, ENCRYPT, DECRYPT
   * @param {string} operation - Operation name (e.g., "Generate Key Pair", "SHA-256 Hash")
   * @param {object} details - Operation details (algorithm, input/output snippets, etc.)
   */
  static log(req, category, operation, details = {}) {
    if (!this.isEnabled()) return;

    const entry = {
      timestamp: new Date().toISOString(),
      category: category.toUpperCase(),
      operation,
      details
    };

    // Add to request-scoped logs if available
    if (req && req._cryptoLogs) {
      req._cryptoLogs.push(entry);
    }

    // Also log to server console
    const icon = this._getIcon(category);
    console.log(`${icon} [CRYPTO-LOG] [${category.toUpperCase()}] ${operation}`, 
      Object.keys(details).length > 0 ? details : '');
  }

  /**
   * Get logs collected during this request
   * @param {object} req - Express request object
   * @returns {array} Array of log entries, or empty array if disabled
   */
  static getLogs(req) {
    if (!this.isEnabled() || !req || !req._cryptoLogs) {
      return [];
    }
    return req._cryptoLogs;
  }

  /**
   * Get emoji icon for a category
   * @private
   */
  static _getIcon(category) {
    const icons = {
      'RSA': '🔑',
      'AES': '🔒',
      'HASH': '🔢',
      'SIGN': '✍️',
      'VERIFY': '✅',
      'CERT': '📜',
      'ENCRYPT': '🔐',
      'DECRYPT': '🔓',
      'HMAC': '🛡️',
      'KEY': '🗝️'
    };
    return icons[category.toUpperCase()] || '🔧';
  }
}

module.exports = CryptoLogger;
