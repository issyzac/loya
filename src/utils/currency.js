/**
 * Currency formatting utilities for TZS (Tanzanian Shilling)
 */

/**
 * Format cents to TZS currency display with enhanced formatting
 * @param {number} cents - Amount in cents
 * @param {boolean} showCurrency - Whether to show currency symbol (default: true)
 * @param {Object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export function formatTZS(cents, showCurrency = true, options = {}) {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return showCurrency ? 'TZS 0' : '0';
  }

  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
    compact = false
  } = options;

  // Convert cents to TZS (divide by 100)
  const amount = cents / 100;
  
  // Handle compact formatting for large numbers
  if (compact && Math.abs(amount) >= 1000000) {
    const millions = amount / 1000000;
    const formatted = millions.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    return showCurrency ? `TZS ${formatted}M` : `${formatted}M`;
  } else if (compact && Math.abs(amount) >= 1000) {
    const thousands = amount / 1000;
    const formatted = thousands.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    return showCurrency ? `TZS ${formatted}K` : `${formatted}K`;
  }
  
  // Standard formatting with thousand separators
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping
  });

  return showCurrency ? `TZS ${formatted}` : formatted;
}

/**
 * Format TZS with enhanced visual styling
 * @param {number} cents - Amount in cents
 * @param {Object} options - Styling options
 * @returns {Object} Formatted currency with styling info
 */
export function formatTZSWithStyle(cents, options = {}) {
  const {
    showCurrency = true,
    highlightLarge = false,
    colorCode = false
  } = options;

  const formatted = formatTZS(cents, showCurrency);
  const amount = cents / 100;
  
  let className = '';
  let size = 'normal';
  let color = 'default';

  // Determine styling based on amount
  if (colorCode) {
    if (amount > 0) {
      color = 'positive';
      className = 'text-green-600';
    } else if (amount < 0) {
      color = 'negative';
      className = 'text-red-600';
    } else {
      color = 'neutral';
      className = 'text-gray-600';
    }
  }

  // Highlight large amounts
  if (highlightLarge) {
    if (Math.abs(amount) >= 100000) { // 1M+ TZS
      size = 'large';
      className += ' font-bold text-lg';
    } else if (Math.abs(amount) >= 10000) { // 100K+ TZS
      size = 'medium';
      className += ' font-semibold';
    }
  }

  return {
    formatted,
    amount,
    className,
    size,
    color,
    isLarge: Math.abs(amount) >= 100000,
    isMedium: Math.abs(amount) >= 10000,
    isPositive: amount > 0,
    isNegative: amount < 0,
    isZero: amount === 0
  };
}

/**
 * Parse TZS input to cents
 * @param {string|number} input - TZS amount as string or number
 * @returns {number} Amount in cents
 */
export function parseTZSToCents(input) {
  if (!input) return 0;
  
  // Remove currency symbol and spaces
  let cleanInput = input.toString().replace(/TZS|,|\s/g, '');
  
  // Parse as float and convert to cents
  const amount = parseFloat(cleanInput);
  return isNaN(amount) ? 0 : Math.round(amount * 100);
}

/**
 * Format cents for input fields (without currency symbol)
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted amount for input
 */
export function formatTZSForInput(cents) {
  return formatTZS(cents, false);
}

/**
 * Validate TZS amount input
 * @param {string} input - Input value
 * @returns {Object} Validation result
 */
export function validateTZSInput(input) {
  if (!input || input.trim() === '') {
    return { isValid: false, error: 'Amount is required' };
  }

  const cleanInput = input.toString().replace(/TZS|,|\s/g, '');
  const amount = parseFloat(cleanInput);

  if (isNaN(amount)) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }

  if (amount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }

  if (amount > 999999999) {
    return { isValid: false, error: 'Amount is too large' };
  }

  // Check for too many decimal places
  const decimalPart = cleanInput.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    return { isValid: false, error: 'Maximum 2 decimal places allowed' };
  }

  return { isValid: true, amount: Math.round(amount * 100) };
}

/**
 * Format balance display with proper styling classes
 * @param {number} cents - Amount in cents
 * @param {boolean} isPositive - Whether amount is positive (for styling)
 * @returns {Object} Formatted display object
 */
export function formatBalanceDisplay(cents) {
  const isPositive = cents >= 0;
  const formatted = formatTZS(Math.abs(cents));
  
  return {
    amount: formatted,
    isPositive,
    className: isPositive ? 'text-green-600' : 'text-red-600',
    prefix: isPositive ? '' : '-'
  };
}

/**
 * Calculate percentage of amount
 * @param {number} amount - Amount in cents
 * @param {number} percentage - Percentage (0-100)
 * @returns {number} Calculated amount in cents
 */
export function calculatePercentage(amount, percentage) {
  return Math.round((amount * percentage) / 100);
}

/**
 * Add two amounts in cents safely
 * @param {number} amount1 - First amount in cents
 * @param {number} amount2 - Second amount in cents
 * @returns {number} Sum in cents
 */
export function addAmounts(amount1, amount2) {
  return (amount1 || 0) + (amount2 || 0);
}

/**
 * Subtract two amounts in cents safely
 * @param {number} amount1 - First amount in cents
 * @param {number} amount2 - Second amount in cents
 * @returns {number} Difference in cents
 */
export function subtractAmounts(amount1, amount2) {
  return (amount1 || 0) - (amount2 || 0);
}

/**
 * Format transaction amount with direction indicator
 * @param {number} cents - Amount in cents
 * @param {string} direction - 'CREDIT' or 'DEBIT'
 * @returns {Object} Formatted transaction display
 */
export function formatTransactionAmount(cents, direction) {
  const formatted = formatTZS(cents);
  const isCredit = direction === 'CREDIT';
  
  return {
    amount: formatted,
    direction,
    isCredit,
    className: isCredit ? 'text-green-600' : 'text-red-600',
    prefix: isCredit ? '+' : '-',
    displayAmount: `${isCredit ? '+' : '-'}${formatted}`
  };
}