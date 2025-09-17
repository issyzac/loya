/**
 * Error handling utilities for wallet operations
 */

/**
 * Format error messages for user display
 * @param {Object} error - Error object from API service
 * @returns {string} User-friendly error message
 */
export function formatErrorMessage(error) {
  if (!error) return 'An unexpected error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  if (error.error && error.error.message) return error.error.message;
  
  return 'An unexpected error occurred';
}

/**
 * Get error type for styling and icons
 * @param {Object} error - Error object
 * @returns {string} Error type
 */
export function getErrorType(error) {
  if (!error || !error.error) return 'error';
  
  const code = error.error.code;
  
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'validation';
    case 'CUSTOMER_NOT_FOUND':
    case 'SLIP_NOT_FOUND':
      return 'not-found';
    case 'INSUFFICIENT_BALANCE':
      return 'insufficient-funds';
    case 'UNAUTHORIZED':
      return 'unauthorized';
    case 'NETWORK_ERROR':
      return 'network';
    case 'SERVER_ERROR':
      return 'server';
    default:
      return 'error';
  }
}

/**
 * Get appropriate CSS classes for error display
 * @param {string} errorType - Error type
 * @returns {Object} CSS classes
 */
export function getErrorClasses(errorType) {
  const baseClasses = 'p-4 rounded-lg border';
  
  switch (errorType) {
    case 'validation':
      return {
        container: `${baseClasses} bg-yellow-50 border-yellow-200`,
        text: 'text-yellow-800',
        icon: 'text-yellow-400'
      };
    case 'not-found':
      return {
        container: `${baseClasses} bg-blue-50 border-blue-200`,
        text: 'text-blue-800',
        icon: 'text-blue-400'
      };
    case 'insufficient-funds':
      return {
        container: `${baseClasses} bg-orange-50 border-orange-200`,
        text: 'text-orange-800',
        icon: 'text-orange-400'
      };
    case 'unauthorized':
      return {
        container: `${baseClasses} bg-red-50 border-red-200`,
        text: 'text-red-800',
        icon: 'text-red-400'
      };
    case 'network':
      return {
        container: `${baseClasses} bg-gray-50 border-gray-200`,
        text: 'text-gray-800',
        icon: 'text-gray-400'
      };
    default:
      return {
        container: `${baseClasses} bg-red-50 border-red-200`,
        text: 'text-red-800',
        icon: 'text-red-400'
      };
  }
}

/**
 * Create error display object
 * @param {Object} error - Error from API service
 * @returns {Object} Error display object
 */
export function createErrorDisplay(error) {
  const message = formatErrorMessage(error);
  const type = getErrorType(error);
  const classes = getErrorClasses(type);
  
  return {
    message,
    type,
    classes,
    canRetry: ['network', 'server'].includes(type),
    showDetails: process.env.NODE_ENV === 'development'
  };
}

/**
 * Success message utilities
 */
export function createSuccessDisplay(message, details = null) {
  return {
    message,
    details,
    type: 'success',
    classes: {
      container: 'p-4 rounded-lg border bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: 'text-green-400'
    }
  };
}

/**
 * Loading state utilities
 */
export function createLoadingDisplay(message = 'Loading...') {
  return {
    message,
    type: 'loading',
    classes: {
      container: 'p-4 rounded-lg border bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-400'
    }
  };
}

/**
 * Validation error helpers
 */
export function createFieldError(fieldName, message) {
  return {
    field: fieldName,
    message,
    type: 'field-error'
  };
}

export function hasFieldError(errors, fieldName) {
  return errors && errors.some(error => error.field === fieldName);
}

export function getFieldError(errors, fieldName) {
  if (!errors) return null;
  const error = errors.find(error => error.field === fieldName);
  return error ? error.message : null;
}