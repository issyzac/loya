/**
 * @module orders-transform
 * @description Data transformation utilities for orders/pending bills API responses.
 * Transforms API response format to UI-compatible format while handling validation and error cases.
 */

import { formatTZS } from './currency.js';

/**
 * Transforms MongoDB date format to JavaScript Date object.
 * @param {object|string} mongoDate - MongoDB date object with $date property or ISO string.
 * @returns {Date|null} JavaScript Date object or null if invalid.
 */
export function transformMongoDate(mongoDate) {
  if (!mongoDate) return null;
  
  try {
    let date;
    
    // Handle MongoDB date format: { "$date": "ISO string" }
    if (typeof mongoDate === 'object' && mongoDate.$date) {
      date = new Date(mongoDate.$date);
    }
    // Handle direct ISO string
    else if (typeof mongoDate === 'string') {
      date = new Date(mongoDate);
    }
    // Handle already parsed Date object
    else if (mongoDate instanceof Date) {
      date = mongoDate;
    }
    else {
      return null;
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    console.warn('Failed to parse date:', mongoDate, error);
    return null;
  }
}

/**
 * Validates required fields in an order object.
 * @param {object} order - The order object to validate.
 * @returns {object} Validation result with isValid flag and missing fields.
 */
export function validateOrderFields(order) {
  const requiredFields = ['slip_id', 'slip_number', 'lines', 'totals'];
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!order || order[field] === undefined || order[field] === null) {
      missingFields.push(field);
    }
  });
  
  // Additional validation for nested required fields
  if (order && order.totals && typeof order.totals.grand_total !== 'number') {
    missingFields.push('totals.grand_total');
  }
  
  if (order && order.lines && !Array.isArray(order.lines)) {
    missingFields.push('lines (must be array)');
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Transforms an order line item from API format to UI format.
 * @param {object} line - The line item from the API.
 * @returns {object} Transformed line item for UI consumption.
 */
export function transformOrderLine(line) {
  if (!line) {
    return {
      item_id: '',
      item_name: 'Unknown Item',
      quantity: 0,
      price_total: 'TZS 0'
    };
  }
  
  // API returns amounts in TZS, formatTZS expects cents, so multiply by 100
  const lineTotal = Number(line.line_total) || 0;
  
  return {
    item_id: String(line.item_id || ''),
    item_name: line.description || 'Unknown Item',
    quantity: Number(line.quantity) || 0,
    price_total: formatTZS(lineTotal * 100) // Convert TZS to cents for formatting
  };
}

/**
 * Transforms a single order from API format to UI format.
 * @param {object} order - The order object from the API.
 * @returns {object|null} Transformed order for UI consumption or null if invalid.
 */
export function transformOrder(order) {
  if (!order) {
    console.warn('transformOrder: Received null or undefined order');
    return null;
  }
  
  // Validate required fields
  const validation = validateOrderFields(order);
  if (!validation.isValid) {
    console.warn('transformOrder: Order missing required fields:', validation.missingFields, order);
    return null;
  }
  
  try {
    // Transform the created_at date
    const createdAt = transformMongoDate(order.created_at || order.occurred_at);
    
    // Transform line items
    const items = (order.lines || []).map(transformOrderLine);
    
    // Handle missing or invalid totals
    const totals = order.totals || {};
    const grandTotal = Number(totals.grand_total) || 0;
    
    return {
      slip_id: String(order.slip_id || ''),
      slip_number: String(order.slip_number || 'Unknown'),
      created_at: createdAt ? createdAt.toISOString() : new Date().toISOString(),
      grand_total: formatTZS(grandTotal * 100), // Convert TZS to cents for formatting
      items: items
    };
  } catch (error) {
    console.error('transformOrder: Error transforming order:', error, order);
    return null;
  }
}

/**
 * Transforms the complete API response to UI-compatible format.
 * @param {object} apiResponse - The complete API response.
 * @returns {object} Transformed response with orders and metadata.
 */
export function transformOrdersResponse(apiResponse) {
  if (!apiResponse) {
    console.warn('transformOrdersResponse: Received null or undefined response');
    return {
      orders: [],
      pagination: null,
      hasError: true,
      errorMessage: 'No response received'
    };
  }
  
  try {
    // Handle successful response
    if (apiResponse.success && apiResponse.data) {
      const data = apiResponse.data;
      const orders = (data.orders || [])
        .map(transformOrder)
        .filter(order => order !== null);
      
      return {
        orders: orders,
        pagination: data.pagination || null,
        hasError: false,
        errorMessage: null,
        totalCount: data.pagination?.total_orders || orders.length
      };
    }
    
    // Handle error response
    if (!apiResponse.success && apiResponse.error) {
      return {
        orders: [],
        pagination: null,
        hasError: true,
        errorMessage: apiResponse.error.message || 'Unknown error occurred',
        errorCode: apiResponse.error.code,
        isRetryable: apiResponse.error.isRetryable || false
      };
    }
    
    // Handle unexpected response format
    console.warn('transformOrdersResponse: Unexpected response format:', apiResponse);
    return {
      orders: [],
      pagination: null,
      hasError: true,
      errorMessage: 'Unexpected response format'
    };
    
  } catch (error) {
    console.error('transformOrdersResponse: Error transforming response:', error, apiResponse);
    return {
      orders: [],
      pagination: null,
      hasError: true,
      errorMessage: 'Failed to process response data'
    };
  }
}

/**
 * Handles missing data gracefully by providing default values.
 * @param {object} order - The order object that may have missing data.
 * @returns {object} Order with default values for missing fields.
 */
export function handleMissingOrderData(order) {
  if (!order) {
    return {
      slip_id: 'unknown',
      slip_number: 'Unknown Order',
      created_at: new Date().toISOString(),
      grand_total: 'TZS 0',
      items: []
    };
  }
  
  return {
    slip_id: order.slip_id || 'unknown',
    slip_number: order.slip_number || 'Unknown Order',
    created_at: order.created_at || new Date().toISOString(),
    grand_total: order.grand_total || 'TZS 0',
    items: order.items || []
  };
}

/**
 * Validates and sanitizes currency amounts from the API.
 * @param {number|string} amount - The amount to validate and sanitize.
 * @param {string} [fieldName='amount'] - The field name for error reporting.
 * @returns {number} Sanitized amount or 0 if invalid.
 */
export function sanitizeCurrencyAmount(amount, fieldName = 'amount') {
  if (amount === null || amount === undefined) {
    return 0;
  }
  
  const numAmount = Number(amount);
  if (isNaN(numAmount)) {
    console.warn(`sanitizeCurrencyAmount: Invalid ${fieldName}:`, amount);
    return 0;
  }
  
  if (numAmount < 0) {
    console.warn(`sanitizeCurrencyAmount: Negative ${fieldName}:`, amount);
    return 0;
  }
  
  return numAmount;
}

/**
 * Creates a fallback order object when API data is completely unavailable.
 * @param {string} [customerId] - The customer ID for context.
 * @returns {object} Fallback order object.
 */
export function createFallbackOrder(customerId = null) {
  return {
    slip_id: 'fallback',
    slip_number: 'No Data Available',
    created_at: new Date().toISOString(),
    grand_total: 'TZS 0',
    items: [{
      item_id: 'fallback',
      item_name: 'Unable to load order details',
      quantity: 0,
      price_total: 'TZS 0'
    }]
  };
}

/**
 * Transforms API error response to user-friendly format.
 * @param {object} errorResponse - The error response from the API.
 * @returns {object} User-friendly error information.
 */
export function transformErrorResponse(errorResponse) {
  if (!errorResponse || !errorResponse.error) {
    return {
      message: 'An unexpected error occurred',
      isRetryable: true,
      severity: 'error'
    };
  }
  
  const error = errorResponse.error;
  
  // Map technical error codes to user-friendly messages
  const userFriendlyMessages = {
    'CUSTOMER_NOT_FOUND': 'Customer account not found. Please contact support.',
    'INVALID_CUSTOMER_ID': 'Invalid customer information. Please try logging in again.',
    'SESSION_EXPIRED': 'Your session has expired. Please log in again.',
    'UNAUTHORIZED': 'You do not have permission to view these orders.',
    'NO_ORDERS_FOUND': 'You have no pending bills at this time.',
    'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
    'TIMEOUT_ERROR': 'The request took too long. Please try again.',
    'SERVER_ERROR': 'Server is temporarily unavailable. Please try again later.',
    'RATE_LIMITED': 'Too many requests. Please wait a moment before trying again.'
  };
  
  return {
    message: userFriendlyMessages[error.code] || error.message || 'An error occurred while loading your pending bills',
    isRetryable: error.isRetryable || false,
    severity: error.severity || 'error',
    code: error.code
  };
}