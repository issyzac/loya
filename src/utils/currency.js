/**
 * @module currency
 * @description Currency formatting and calculation utilities for TZS (Tanzanian Shilling).
 */

/**
 * Formats a number in cents to a TZS currency string.
 * @param {number} cents - The amount in cents.
 * @param {boolean} [showCurrency=true] - Whether to include the 'TZS' currency symbol.
 * @param {object} [options={}] - Formatting options.
 * @param {number} [options.minimumFractionDigits=0] - The minimum number of decimal places.
 * @param {number} [options.maximumFractionDigits=2] - The maximum number of decimal places.
 * @param {boolean} [options.useGrouping=true] - Whether to use thousand separators.
 * @param {boolean} [options.compact=false] - Whether to use compact notation (K for thousands, M for millions).
 * @returns {string} The formatted currency string.
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

  const amount = cents / 100;
  
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
  
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping
  });

  return showCurrency ? `TZS ${formatted}` : formatted;
}

/**
 * Formats a TZS amount with additional styling information.
 * @param {number} cents - The amount in cents.
 * @param {object} [options={}] - Styling options.
 * @param {boolean} [options.showCurrency=true] - Whether to include the 'TZS' currency symbol.
 * @param {boolean} [options.highlightLarge=false] - Whether to apply special styling for large amounts.
 * @param {boolean} [options.colorCode=false] - Whether to apply color coding based on the amount (positive/negative).
 * @returns {object} An object containing the formatted string and styling information.
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

  if (highlightLarge) {
    if (Math.abs(amount) >= 100000) {
      size = 'large';
      className += ' font-bold text-lg';
    } else if (Math.abs(amount) >= 10000) {
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
 * Parses a TZS currency string or number into cents.
 * @param {string|number} input - The TZS amount as a string or number.
 * @returns {number} The amount in cents.
 */
export function parseTZSToCents(input) {
  if (!input) return 0;
  
  let cleanInput = input.toString().replace(/TZS|,|\s/g, '');
  
  const amount = parseFloat(cleanInput);
  return isNaN(amount) ? 0 : Math.round(amount * 100);
}

/**
 * Formats a number in cents for use in an input field (no currency symbol).
 * @param {number} cents - The amount in cents.
 * @returns {string} The formatted amount string.
 */
export function formatTZSForInput(cents) {
  return formatTZS(cents, false);
}

/**
 * Validates a TZS amount input string.
 * @param {string} input - The input value to validate.
 * @returns {object} An object containing the validation result.
 * @property {boolean} isValid - Whether the input is valid.
 * @property {string} [error] - The error message if the input is invalid.
 * @property {number} [amount] - The parsed amount in cents if the input is valid.
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

  const decimalPart = cleanInput.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    return { isValid: false, error: 'Maximum 2 decimal places allowed' };
  }

  return { isValid: true, amount: Math.round(amount * 100) };
}

/**
 * Formats a balance display with appropriate styling classes.
 * @param {number} cents - The amount in cents.
 * @returns {object} An object containing the formatted balance and styling information.
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
 * Calculates a percentage of an amount in cents.
 * @param {number} amount - The amount in cents.
 * @param {number} percentage - The percentage to calculate (0-100).
 * @returns {number} The calculated amount in cents.
 */
export function calculatePercentage(amount, percentage) {
  return Math.round((amount * percentage) / 100);
}

/**
 * Safely adds two amounts in cents.
 * @param {number} amount1 - The first amount in cents.
 * @param {number} amount2 - The second amount in cents.
 * @returns {number} The sum in cents.
 */
export function addAmounts(amount1, amount2) {
  return (amount1 || 0) + (amount2 || 0);
}

/**
 * Safely subtracts one amount from another in cents.
 * @param {number} amount1 - The first amount in cents.
 * @param {number} amount2 - The second amount in cents.
 * @returns {number} The difference in cents.
 */
export function subtractAmounts(amount1, amount2) {
  return (amount1 || 0) - (amount2 || 0);
}

/**
 * Formats a transaction amount with a direction indicator (+/-).
 * @param {number} cents - The amount in cents.
 * @param {string} direction - The transaction direction ('CREDIT' or 'DEBIT').
 * @returns {object} An object containing the formatted transaction and styling information.
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