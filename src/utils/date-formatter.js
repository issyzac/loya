/**
 * Centralized date formatting utility for the wallet application
 * Provides defensive date formatting with fallback handling for invalid dates
 */

/**
 * Default formatting options
 */
const DEFAULT_OPTIONS = {
  format: 'short',
  includeTime: false,
  fallbackText: 'N/A',
  locale: 'en-US'
};

/**
 * Validates if a given value is a valid date
 * @param {*} dateValue - The value to validate
 * @returns {boolean} - True if valid date, false otherwise
 */
export const isValidDate = (dateValue) => {
  if (dateValue === null || dateValue === undefined || dateValue === '') {
    return false;
  }
  
  const date = new Date(dateValue);
  return !isNaN(date.getTime());
};

/**
 * Safely creates a Date object from various input types
 * @param {*} dateValue - The date value to convert
 * @returns {Date|null} - Valid Date object or null if invalid
 */
const safeCreateDate = (dateValue) => {
  if (!isValidDate(dateValue)) {
    return null;
  }
  
  try {
    return new Date(dateValue);
  } catch (error) {
    return null;
  }
};

/**
 * Formats a date value with defensive handling
 * @param {*} dateValue - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string or fallback text
 */
export const formatDate = (dateValue, options = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const date = safeCreateDate(dateValue);
  if (!date) {
    return opts.fallbackText;
  }
  
  try {
    const formatOptions = {
      year: 'numeric',
      month: opts.format === 'long' ? 'long' : 'numeric',
      day: 'numeric'
    };
    
    if (opts.format === 'short') {
      formatOptions.month = '2-digit';
      formatOptions.day = '2-digit';
    }
    
    return date.toLocaleDateString(opts.locale, formatOptions);
  } catch (error) {
    return opts.fallbackText;
  }
};

/**
 * Formats a time value with defensive handling
 * @param {*} dateValue - The date/time to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted time string or fallback text
 */
export const formatTime = (dateValue, options = {}) => {
  const opts = { 
    ...DEFAULT_OPTIONS, 
    fallbackText: 'Time unavailable',
    ...options 
  };
  
  const date = safeCreateDate(dateValue);
  if (!date) {
    return opts.fallbackText;
  }
  
  try {
    return date.toLocaleTimeString(opts.locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return opts.fallbackText;
  }
};

/**
 * Formats both date and time with defensive handling
 * @param {*} dateValue - The date/time to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date and time string or fallback text
 */
export const formatDateTime = (dateValue, options = {}) => {
  const opts = { 
    ...DEFAULT_OPTIONS, 
    fallbackText: 'Date unavailable',
    ...options 
  };
  
  const date = safeCreateDate(dateValue);
  if (!date) {
    return opts.fallbackText;
  }
  
  const formattedDate = formatDate(dateValue, opts);
  const formattedTime = formatTime(dateValue, opts);
  
  if (formattedDate === opts.fallbackText || formattedTime === 'Time unavailable') {
    return opts.fallbackText;
  }
  
  return `${formattedDate} at ${formattedTime}`;
};

/**
 * Formats a relative date (e.g., "2 days ago")
 * @param {*} dateValue - The date to format relatively
 * @param {Object} options - Formatting options
 * @returns {string} - Relative date string or fallback text
 */
export const formatRelativeDate = (dateValue, options = {}) => {
  const opts = { 
    ...DEFAULT_OPTIONS, 
    fallbackText: 'Unknown time',
    ...options 
  };
  
  const date = safeCreateDate(dateValue);
  if (!date) {
    return opts.fallbackText;
  }
  
  try {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  } catch (error) {
    return opts.fallbackText;
  }
};

// Specialized wallet formatting functions

/**
 * Formats transaction dates consistently across the wallet interface
 * @param {*} dateValue - The transaction date to format
 * @returns {string} - Formatted transaction date or "Date unavailable"
 */
export const formatTransactionDate = (dateValue) => {
  return formatDate(dateValue, {
    format: 'short',
    fallbackText: 'Date unavailable'
  });
};

/**
 * Formats transaction times consistently across the wallet interface
 * @param {*} dateValue - The transaction time to format
 * @returns {string} - Formatted transaction time or "Time unavailable"
 */
export const formatTransactionTime = (dateValue) => {
  return formatTime(dateValue, {
    fallbackText: 'Time unavailable'
  });
};

/**
 * Formats credit slip age for display
 * @param {*} createdAt - The creation date of the credit slip
 * @returns {string} - Formatted age or "Unknown age"
 */
export const formatCreditSlipAge = (createdAt) => {
  return formatRelativeDate(createdAt, {
    fallbackText: 'Unknown age'
  });
};

/**
 * Formats last activity date for wallet insights
 * @param {*} dateValue - The last activity date
 * @returns {string} - Formatted date or "No recent activity"
 */
export const formatLastActivity = (dateValue) => {
  if (!isValidDate(dateValue)) {
    return 'No recent activity';
  }
  
  return formatRelativeDate(dateValue, {
    fallbackText: 'No recent activity'
  });
};

/**
 * Creates an enhanced transaction entry with formatted date fields
 * @param {Object} transaction - The raw transaction object
 * @returns {Object} - Enhanced transaction with formatted date fields
 */
export const enhanceTransactionWithDates = (transaction) => {
  const occurredAt = transaction.occurred_at || transaction.created_at || transaction.date;
  
  return {
    ...transaction,
    formatted_date: formatTransactionDate(occurredAt),
    formatted_time: formatTransactionTime(occurredAt),
    formatted_datetime: formatDateTime(occurredAt, { fallbackText: 'Date unavailable' }),
    is_date_valid: isValidDate(occurredAt),
    raw_occurred_at: occurredAt
  };
};

// Export all functions as default object for convenience
export default {
  isValidDate,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeDate,
  formatTransactionDate,
  formatTransactionTime,
  formatCreditSlipAge,
  formatLastActivity,
  enhanceTransactionWithDates
};