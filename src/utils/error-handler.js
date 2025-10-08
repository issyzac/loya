/**
 * @module error-handler
 * @description Utilities for handling and displaying errors, success messages, and loading states.
 */

/**
 * Formats an error object into a user-friendly string.
 * @param {object|string} error - The error object or string.
 * @returns {string} A user-friendly error message.
 */
export function formatErrorMessage(error) {
  if (!error) return 'An unexpected error occurred';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error && error.error.message) return error.error.message;
  return 'An unexpected error occurred';
}

/**
 * Determines the type of error for styling and icon selection.
 * @param {object} error - The error object.
 * @returns {string} The error type (e.g., 'validation', 'network', 'server').
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
 * Gets the appropriate CSS classes for a given error type.
 * @param {string} errorType - The type of error.
 * @returns {object} An object containing CSS classes for the container, text, and icon.
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
 * Creates an error display object for rendering in the UI.
 * @param {object} error - The error object from the API service.
 * @returns {object} An object containing the formatted message, type, classes, and retry information.
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
 * Creates a success display object.
 * @param {string} message - The success message.
 * @param {string} [details=null] - Additional details to display.
 * @returns {object} A success display object with a message, type, and classes.
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
 * Creates a loading display object.
 * @param {string} [message='Loading...'] - The loading message.
 * @returns {object} A loading display object with a message, type, and classes.
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
 * Creates a field-specific validation error object.
 * @param {string} fieldName - The name of the field with the error.
 * @param {string} message - The error message.
 * @returns {object} A field error object.
 */
export function createFieldError(fieldName, message) {
  return {
    field: fieldName,
    message,
    type: 'field-error'
  };
}

/**
 * Checks if there is a validation error for a specific field.
 * @param {Array<object>} errors - The array of error objects.
 * @param {string} fieldName - The name of the field to check.
 * @returns {boolean} True if a field error exists, false otherwise.
 */
export function hasFieldError(errors, fieldName) {
  return errors && errors.some(error => error.field === fieldName);
}

/**
 * Gets the error message for a specific field.
 * @param {Array<object>} errors - The array of error objects.
 * @param {string} fieldName - The name of the field.
 * @returns {string|null} The error message, or null if no error is found.
 */
export function getFieldError(errors, fieldName) {
  if (!errors) return null;
  const error = errors.find(error => error.field === fieldName);
  return error ? error.message : null;
}