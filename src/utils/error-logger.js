/**
 * @module error-logger
 * @description Comprehensive error logging and categorization system for the pending bills API integration.
 * Provides detailed logging while protecting user privacy and implementing proper error categorization.
 */

/**
 * Error categories for proper classification and handling
 */
export const ERROR_CATEGORIES = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION', 
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  VALIDATION: 'VALIDATION',
  AUTHORIZATION: 'AUTHORIZATION',
  RATE_LIMIT: 'RATE_LIMIT',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Privacy-safe data sanitizer to remove sensitive information from logs
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data safe for logging
 */
function sanitizeForLogging(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password', 'token', 'authorization', 'auth', 'secret', 'key',
    'customer_id', 'customerId', 'user_id', 'userId', 'email',
    'phone', 'address', 'ssn', 'credit_card', 'payment'
  ];

  const sanitized = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Categorizes errors based on their characteristics
 * @param {Error|object} error - The error to categorize
 * @returns {string} Error category from ERROR_CATEGORIES
 */
export function categorizeError(error) {
  if (!error) return ERROR_CATEGORIES.UNKNOWN;

  // Handle AbortError and cancellation
  if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
    return ERROR_CATEGORIES.CANCELLED;
  }

  // Handle axios/HTTP errors
  if (error.response) {
    const status = error.response.status;
    
    if (status === 401) return ERROR_CATEGORIES.AUTHENTICATION;
    if (status === 403) return ERROR_CATEGORIES.AUTHORIZATION;
    if (status === 429) return ERROR_CATEGORIES.RATE_LIMIT;
    if (status >= 400 && status < 500) return ERROR_CATEGORIES.CLIENT;
    if (status >= 500) return ERROR_CATEGORIES.SERVER;
  }

  // Handle network errors
  if (error.request || error.code === 'NETWORK_ERROR') {
    return ERROR_CATEGORIES.NETWORK;
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return ERROR_CATEGORIES.TIMEOUT;
  }

  // Handle validation errors
  if (error.message?.includes('validation') || error.code?.includes('VALIDATION')) {
    return ERROR_CATEGORIES.VALIDATION;
  }

  // Handle authentication-related errors
  if (error.code?.includes('AUTH') || error.message?.includes('authentication')) {
    return ERROR_CATEGORIES.AUTHENTICATION;
  }

  return ERROR_CATEGORIES.UNKNOWN;
}

/**
 * Determines error severity based on category and impact
 * @param {string} category - Error category
 * @param {Error|object} error - The original error
 * @returns {string} Error severity level
 */
export function determineErrorSeverity(category, error) {
  switch (category) {
    case ERROR_CATEGORIES.AUTHENTICATION:
    case ERROR_CATEGORIES.AUTHORIZATION:
      return ERROR_SEVERITY.HIGH;
    
    case ERROR_CATEGORIES.SERVER:
      // 5xx errors are critical for user experience
      return ERROR_SEVERITY.CRITICAL;
    
    case ERROR_CATEGORIES.NETWORK:
    case ERROR_CATEGORIES.TIMEOUT:
      return ERROR_SEVERITY.MEDIUM;
    
    case ERROR_CATEGORIES.RATE_LIMIT:
      return ERROR_SEVERITY.MEDIUM;
    
    case ERROR_CATEGORIES.CLIENT:
    case ERROR_CATEGORIES.VALIDATION:
      return ERROR_SEVERITY.LOW;
    
    case ERROR_CATEGORIES.CANCELLED:
      return ERROR_SEVERITY.LOW;
    
    default:
      return ERROR_SEVERITY.MEDIUM;
  }
}

/**
 * Creates a comprehensive error log entry
 * @param {Error|object} error - The error to log
 * @param {object} context - Additional context information
 * @returns {object} Structured error log entry
 */
export function createErrorLogEntry(error, context = {}) {
  const category = categorizeError(error);
  const severity = determineErrorSeverity(category, error);
  const timestamp = new Date().toISOString();

  // Extract error details safely
  const errorDetails = {
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
    code: error.code || error.response?.status || 'UNKNOWN',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };

  // Extract HTTP details if available
  const httpDetails = error.response ? {
    status: error.response.status,
    statusText: error.response.statusText,
    url: error.response.config?.url,
    method: error.response.config?.method?.toUpperCase(),
    headers: sanitizeForLogging(error.response.headers)
  } : null;

  // Sanitize context to remove sensitive data
  const sanitizedContext = sanitizeForLogging(context);

  return {
    timestamp,
    category,
    severity,
    error: errorDetails,
    http: httpDetails,
    context: sanitizedContext,
    userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location?.href : undefined
  };
}

/**
 * Logs errors with appropriate level based on severity
 * @param {object} logEntry - Error log entry from createErrorLogEntry
 */
export function logError(logEntry) {
  const { severity, category, error, context } = logEntry;
  
  // Create a readable log message
  const logMessage = `[${category}] ${error.message}`;
  
  // Log with appropriate console method based on severity
  switch (severity) {
    case ERROR_SEVERITY.CRITICAL:
      console.error('🚨 CRITICAL ERROR:', logMessage, logEntry);
      break;
    case ERROR_SEVERITY.HIGH:
      console.error('❌ HIGH SEVERITY:', logMessage, logEntry);
      break;
    case ERROR_SEVERITY.MEDIUM:
      console.warn('⚠️ MEDIUM SEVERITY:', logMessage, logEntry);
      break;
    case ERROR_SEVERITY.LOW:
      console.info('ℹ️ LOW SEVERITY:', logMessage, logEntry);
      break;
    default:
      console.log('📝 ERROR:', logMessage, logEntry);
  }

  // In production, you might want to send critical errors to an external service
  if (severity === ERROR_SEVERITY.CRITICAL && process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // errorTrackingService.captureError(logEntry);
  }
}

/**
 * Enhanced error logger that combines categorization, logging, and user-friendly error creation
 * @param {Error|object} error - The error to process
 * @param {object} context - Additional context information
 * @param {string} defaultMessage - Default user-friendly message
 * @returns {object} Processed error object for UI consumption
 */
export function processError(error, context = {}, defaultMessage = 'An unexpected error occurred') {
  // Create comprehensive log entry
  const logEntry = createErrorLogEntry(error, context);
  
  // Log the error
  logError(logEntry);
  
  // Create user-friendly error object
  const category = logEntry.category;
  const userFriendlyError = createUserFriendlyError(error, category, defaultMessage);
  
  return {
    ...userFriendlyError,
    logEntry,
    category,
    severity: logEntry.severity
  };
}

/**
 * Creates user-friendly error messages and recovery guidance
 * @param {Error|object} error - The original error
 * @param {string} category - Error category
 * @param {string} defaultMessage - Default message to use
 * @returns {object} User-friendly error object
 */
function createUserFriendlyError(error, category, defaultMessage) {
  let message = defaultMessage;
  let isRetryable = false;
  let severity = 'error';
  let code = 'UNKNOWN_ERROR';
  let requiresAuth = false;
  let recoveryGuidance = null;

  switch (category) {
    case ERROR_CATEGORIES.NETWORK:
      message = 'Unable to connect to the server. Please check your internet connection and try again.';
      isRetryable = true;
      severity = 'error';
      code = 'NETWORK_ERROR';
      recoveryGuidance = 'Check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.';
      break;

    case ERROR_CATEGORIES.AUTHENTICATION:
      message = 'Your session has expired. Please sign in again to continue.';
      isRetryable = false;
      severity = 'warning';
      code = 'AUTHENTICATION_REQUIRED';
      requiresAuth = true;
      recoveryGuidance = 'Please sign in again to access your pending bills.';
      break;

    case ERROR_CATEGORIES.AUTHORIZATION:
      message = 'You do not have permission to view this information.';
      isRetryable = false;
      severity = 'error';
      code = 'UNAUTHORIZED_ACCESS';
      recoveryGuidance = 'Contact support if you believe you should have access to this information.';
      break;

    case ERROR_CATEGORIES.SERVER:
      message = 'The server is experiencing issues. Please try again in a few moments.';
      isRetryable = true;
      severity = 'error';
      code = 'SERVER_ERROR';
      recoveryGuidance = 'This is a temporary issue. Please wait a moment and try again.';
      break;

    case ERROR_CATEGORIES.CLIENT:
      // Handle specific client errors
      if (error.response?.status === 404) {
        message = 'No pending bills found for your account.';
        severity = 'info';
        code = 'NO_DATA_FOUND';
        isRetryable = false;
        recoveryGuidance = 'You currently have no pending bills. New orders will appear here when created.';
      } else if (error.response?.status === 400) {
        message = 'There was an issue with your request. Please try again.';
        severity = 'warning';
        code = 'BAD_REQUEST';
        isRetryable = true;
        recoveryGuidance = 'Please refresh the page and try again. If the problem persists, contact support.';
      } else {
        message = 'There was an issue processing your request.';
        severity = 'error';
        code = 'CLIENT_ERROR';
        isRetryable = true;
      }
      break;

    case ERROR_CATEGORIES.RATE_LIMIT:
      message = 'Too many requests. Please wait a moment before trying again.';
      isRetryable = true;
      severity = 'warning';
      code = 'RATE_LIMITED';
      recoveryGuidance = 'Please wait 30 seconds before trying again to avoid being rate limited.';
      break;

    case ERROR_CATEGORIES.TIMEOUT:
      message = 'The request timed out. Please check your connection and try again.';
      isRetryable = true;
      severity = 'error';
      code = 'TIMEOUT_ERROR';
      recoveryGuidance = 'This usually indicates a slow connection. Please try again with a stable internet connection.';
      break;

    case ERROR_CATEGORIES.CANCELLED:
      message = 'Request was cancelled.';
      isRetryable = true;
      severity = 'info';
      code = 'REQUEST_CANCELLED';
      recoveryGuidance = 'The request was cancelled. You can try again if needed.';
      break;

    case ERROR_CATEGORIES.VALIDATION:
      message = 'Invalid data provided. Please check your information and try again.';
      isRetryable = false;
      severity = 'warning';
      code = 'VALIDATION_ERROR';
      recoveryGuidance = 'Please ensure all required information is provided correctly.';
      break;

    default:
      message = defaultMessage;
      isRetryable = true;
      severity = 'error';
      code = 'UNKNOWN_ERROR';
      recoveryGuidance = 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  return {
    message,
    code,
    severity,
    isRetryable,
    requiresAuth,
    recoveryGuidance,
    timestamp: new Date().toISOString(),
    originalError: error
  };
}

/**
 * Graceful degradation handler that provides fallback behavior
 * @param {string} feature - The feature that failed
 * @param {object} error - The error that occurred
 * @param {object} fallbackData - Optional fallback data to use
 * @returns {object} Degradation strategy
 */
export function handleGracefulDegradation(feature, error, fallbackData = null) {
  const category = categorizeError(error);
  const severity = determineErrorSeverity(category, error);
  
  let strategy = 'show_error';
  let fallbackMessage = null;
  let canUseFallback = false;

  switch (feature) {
    case 'pending_bills':
      if (category === ERROR_CATEGORIES.NETWORK || category === ERROR_CATEGORIES.SERVER) {
        if (fallbackData && fallbackData.length > 0) {
          strategy = 'use_cached_data';
          fallbackMessage = 'Showing previously loaded data. Some information may be outdated.';
          canUseFallback = true;
        } else {
          strategy = 'show_empty_state';
          fallbackMessage = 'Unable to load pending bills. Please try again when your connection is restored.';
        }
      } else if (category === ERROR_CATEGORIES.AUTHENTICATION) {
        strategy = 'redirect_to_auth';
        fallbackMessage = 'Please sign in to view your pending bills.';
      } else {
        strategy = 'show_error';
      }
      break;

    default:
      strategy = 'show_error';
  }

  return {
    strategy,
    fallbackMessage,
    canUseFallback,
    fallbackData: canUseFallback ? fallbackData : null,
    severity,
    category
  };
}

/**
 * Performance monitoring for error tracking
 * @param {string} operation - The operation being performed
 * @param {number} startTime - Start time of the operation
 * @param {boolean} success - Whether the operation succeeded
 * @param {object} error - Error object if operation failed
 */
export function trackOperationPerformance(operation, startTime, success, error = null) {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  const performanceData = {
    operation,
    duration: Math.round(duration),
    success,
    timestamp: new Date().toISOString()
  };

  if (error) {
    performanceData.errorCategory = categorizeError(error);
    performanceData.errorCode = error.code || error.response?.status;
  }

  // Log performance data
  if (success) {
    console.log(`✅ ${operation} completed in ${performanceData.duration}ms`);
  } else {
    console.warn(`❌ ${operation} failed after ${performanceData.duration}ms:`, performanceData);
  }

  // In production, you might want to send this to analytics
  if (process.env.NODE_ENV === 'production') {
    // Example: analytics.track('operation_performance', performanceData);
  }

  return performanceData;
}