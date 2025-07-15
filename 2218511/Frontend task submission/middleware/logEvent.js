/**
 * Logging Middleware for URL Shortener Application
 * Handles all application events with structured logging
 */

class LoggingMiddleware {
  constructor() {
    this.logs = JSON.parse(localStorage.getItem('urlShortenerLogs') || '[]');
  }

  /**
   * Log an event with structured data
   * @param {string} component - Component name (e.g., 'frontend')
   * @param {string} level - Log level ('info', 'error', 'warning')
   * @param {string} module - Module/page name
   * @param {string} message - Event description
   * @param {object} data - Additional event data
   */
  logEvent(component, level, module, message, data = {}) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      component,
      level,
      module,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.unshift(logEntry);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }

    localStorage.setItem('urlShortenerLogs', JSON.stringify(this.logs));

    // Also output to console for development (can be disabled in production)
    const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
    console[consoleMethod](`[${level.toUpperCase()}] ${module}: ${message}`, data);
  }

  /**
   * Get all logs or filtered logs
   * @param {string} level - Filter by log level
   * @param {string} module - Filter by module
   * @returns {Array} Filtered logs
   */
  getLogs(level = null, module = null) {
    let filteredLogs = [...this.logs];

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (module) {
      filteredLogs = filteredLogs.filter(log => log.module === module);
    }

    return filteredLogs;
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('urlShortenerLogs');
    this.logEvent('frontend', 'info', 'LoggingMiddleware', 'All logs cleared');
  }
}

// Create singleton instance
const logger = new LoggingMiddleware();

// Export the logEvent function for use throughout the app
export const logEvent = (component, level, module, message, data) => {
  logger.logEvent(component, level, module, message, data);
};

export default logger;