/**
 * @file orders-transform.test.js
 * @description Unit tests for orders transformation utilities.
 */

import {
  transformMongoDate,
  validateOrderFields,
  transformOrderLine,
  transformOrder,
  transformOrdersResponse,
  handleMissingOrderData,
  sanitizeCurrencyAmount,
  createFallbackOrder,
  transformErrorResponse
} from '../orders-transform.js';

describe('orders-transform utilities', () => {
  describe('transformMongoDate', () => {
    it('should transform MongoDB date format to JavaScript Date', () => {
      const mongoDate = { $date: '2025-10-10T10:00:00.000Z' };
      const result = transformMongoDate(mongoDate);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2025-10-10T10:00:00.000Z');
    });

    it('should handle ISO string directly', () => {
      const isoString = '2025-10-10T10:00:00.000Z';
      const result = transformMongoDate(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2025-10-10T10:00:00.000Z');
    });

    it('should handle Date object', () => {
      const date = new Date('2025-10-10T10:00:00.000Z');
      const result = transformMongoDate(date);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2025-10-10T10:00:00.000Z');
    });

    it('should return null for invalid input', () => {
      expect(transformMongoDate(null)).toBeNull();
      expect(transformMongoDate(undefined)).toBeNull();
      expect(transformMongoDate('')).toBeNull();
      expect(transformMongoDate({})).toBeNull();
    });

    it('should handle invalid date strings gracefully', () => {
      const result = transformMongoDate('invalid-date');
      expect(result).toBeNull();
    });
  });

  describe('validateOrderFields', () => {
    it('should validate complete order object', () => {
      const order = {
        slip_id: 'test-123',
        slip_number: 'CS-001',
        lines: [{ item_id: '1', description: 'Test', quantity: 1, line_total: 100 }],
        totals: { grand_total: 100 }
      };
      
      const result = validateOrderFields(order);
      expect(result.isValid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should identify missing required fields', () => {
      const order = {
        slip_id: 'test-123'
        // Missing slip_number, lines, totals
      };
      
      const result = validateOrderFields(order);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('slip_number');
      expect(result.missingFields).toContain('lines');
      expect(result.missingFields).toContain('totals');
    });

    it('should validate nested totals fields', () => {
      const order = {
        slip_id: 'test-123',
        slip_number: 'CS-001',
        lines: [],
        totals: { /* missing grand_total */ }
      };
      
      const result = validateOrderFields(order);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('totals.grand_total');
    });

    it('should validate lines is an array', () => {
      const order = {
        slip_id: 'test-123',
        slip_number: 'CS-001',
        lines: 'not-an-array',
        totals: { grand_total: 100 }
      };
      
      const result = validateOrderFields(order);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('lines (must be array)');
    });

    it('should handle null/undefined order', () => {
      expect(validateOrderFields(null).isValid).toBe(false);
      expect(validateOrderFields(undefined).isValid).toBe(false);
    });
  });

  describe('transformOrderLine', () => {
    it('should transform complete line item', () => {
      const line = {
        item_id: 'item-123',
        description: 'Cappuccino',
        quantity: 2,
        line_total: 50 // In TZS
      };
      
      const result = transformOrderLine(line);
      expect(result).toEqual({
        item_id: 'item-123',
        item_name: 'Cappuccino',
        quantity: 2,
        price_total: 'TZS 50' // 50 TZS formatted
      });
    });

    it('should handle missing fields with defaults', () => {
      const line = {
        item_id: 'item-123'
        // Missing description, quantity, line_total
      };
      
      const result = transformOrderLine(line);
      expect(result).toEqual({
        item_id: 'item-123',
        item_name: 'Unknown Item',
        quantity: 0,
        price_total: 'TZS 0'
      });
    });

    it('should handle null/undefined line', () => {
      const result = transformOrderLine(null);
      expect(result).toEqual({
        item_id: '',
        item_name: 'Unknown Item',
        quantity: 0,
        price_total: 'TZS 0'
      });
    });

    it('should convert item_id to string', () => {
      const line = {
        item_id: 123, // Number
        description: 'Test Item',
        quantity: 1,
        line_total: 10
      };
      
      const result = transformOrderLine(line);
      expect(result.item_id).toBe('123');
    });
  });

  describe('transformOrder', () => {
    it('should transform complete order', () => {
      const order = {
        slip_id: 'order-123',
        slip_number: 'CS-001',
        created_at: { $date: '2025-10-10T10:00:00.000Z' },
        lines: [
          {
            item_id: 'item-1',
            description: 'Cappuccino',
            quantity: 1,
            line_total: 50
          }
        ],
        totals: {
          grand_total: 50
        }
      };
      
      const result = transformOrder(order);
      expect(result).toEqual({
        slip_id: 'order-123',
        slip_number: 'CS-001',
        created_at: '2025-10-10T10:00:00.000Z',
        grand_total: 'TZS 50',
        items: [
          {
            item_id: 'item-1',
            item_name: 'Cappuccino',
            quantity: 1,
            price_total: 'TZS 50'
          }
        ]
      });
    });

    it('should handle missing created_at with occurred_at fallback', () => {
      const order = {
        slip_id: 'order-123',
        slip_number: 'CS-001',
        occurred_at: { $date: '2025-10-09T14:30:00.000Z' },
        lines: [],
        totals: { grand_total: 0 }
      };
      
      const result = transformOrder(order);
      expect(result.created_at).toBe('2025-10-09T14:30:00.000Z');
    });

    it('should return null for invalid order', () => {
      const invalidOrder = {
        slip_id: 'order-123'
        // Missing required fields
      };
      
      const result = transformOrder(invalidOrder);
      expect(result).toBeNull();
    });

    it('should handle null/undefined order', () => {
      expect(transformOrder(null)).toBeNull();
      expect(transformOrder(undefined)).toBeNull();
    });

    it('should filter out invalid line items', () => {
      const order = {
        slip_id: 'order-123',
        slip_number: 'CS-001',
        lines: [
          { item_id: 'valid', description: 'Valid Item', quantity: 1, line_total: 10 },
          null, // Invalid line
          { item_id: 'valid2', description: 'Valid Item 2', quantity: 1, line_total: 20 }
        ],
        totals: { grand_total: 30 }
      };
      
      const result = transformOrder(order);
      expect(result.items).toHaveLength(3); // All items should be included, even null gets transformed to default
      expect(result.items[0].item_name).toBe('Valid Item');
      expect(result.items[1].item_name).toBe('Unknown Item'); // null line becomes default
      expect(result.items[2].item_name).toBe('Valid Item 2');
    });
  });

  describe('transformOrdersResponse', () => {
    it('should transform successful API response', () => {
      const apiResponse = {
        success: true,
        data: {
          orders: [
            {
              slip_id: 'order-1',
              slip_number: 'CS-001',
              lines: [{ item_id: '1', description: 'Item 1', quantity: 1, line_total: 10 }],
              totals: { grand_total: 10 }
            }
          ],
          pagination: {
            current_page: 1,
            per_page: 20,
            total_orders: 1,
            total_pages: 1
          }
        }
      };
      
      const result = transformOrdersResponse(apiResponse);
      expect(result.hasError).toBe(false);
      expect(result.orders).toHaveLength(1);
      expect(result.pagination).toEqual(apiResponse.data.pagination);
      expect(result.totalCount).toBe(1);
    });

    it('should handle error response', () => {
      const errorResponse = {
        success: false,
        error: {
          message: 'Customer not found',
          code: 'CUSTOMER_NOT_FOUND',
          isRetryable: false
        }
      };
      
      const result = transformOrdersResponse(errorResponse);
      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBe('Customer not found');
      expect(result.errorCode).toBe('CUSTOMER_NOT_FOUND');
      expect(result.isRetryable).toBe(false);
      expect(result.orders).toHaveLength(0);
    });

    it('should handle null/undefined response', () => {
      const result = transformOrdersResponse(null);
      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBe('No response received');
      expect(result.orders).toHaveLength(0);
    });

    it('should filter out invalid orders', () => {
      const apiResponse = {
        success: true,
        data: {
          orders: [
            {
              slip_id: 'valid-order',
              slip_number: 'CS-001',
              lines: [],
              totals: { grand_total: 0 }
            },
            {
              slip_id: 'invalid-order'
              // Missing required fields
            }
          ]
        }
      };
      
      const result = transformOrdersResponse(apiResponse);
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].slip_id).toBe('valid-order');
    });
  });

  describe('handleMissingOrderData', () => {
    it('should provide defaults for missing fields', () => {
      const incompleteOrder = {
        slip_id: 'test-123'
        // Missing other fields
      };
      
      const result = handleMissingOrderData(incompleteOrder);
      expect(result.slip_id).toBe('test-123');
      expect(result.slip_number).toBe('Unknown Order');
      expect(result.grand_total).toBe('TZS 0');
      expect(result.items).toEqual([]);
      expect(result.created_at).toBeDefined();
    });

    it('should handle null order', () => {
      const result = handleMissingOrderData(null);
      expect(result.slip_id).toBe('unknown');
      expect(result.slip_number).toBe('Unknown Order');
      expect(result.grand_total).toBe('TZS 0');
      expect(result.items).toEqual([]);
    });
  });

  describe('sanitizeCurrencyAmount', () => {
    it('should return valid numbers unchanged', () => {
      expect(sanitizeCurrencyAmount(100)).toBe(100);
      expect(sanitizeCurrencyAmount(0)).toBe(0);
      expect(sanitizeCurrencyAmount(99.99)).toBe(99.99);
    });

    it('should convert string numbers', () => {
      expect(sanitizeCurrencyAmount('100')).toBe(100);
      expect(sanitizeCurrencyAmount('99.99')).toBe(99.99);
    });

    it('should return 0 for invalid values', () => {
      expect(sanitizeCurrencyAmount(null)).toBe(0);
      expect(sanitizeCurrencyAmount(undefined)).toBe(0);
      expect(sanitizeCurrencyAmount('invalid')).toBe(0);
      expect(sanitizeCurrencyAmount(NaN)).toBe(0);
    });

    it('should return 0 for negative values', () => {
      expect(sanitizeCurrencyAmount(-100)).toBe(0);
      expect(sanitizeCurrencyAmount('-50')).toBe(0);
    });
  });

  describe('createFallbackOrder', () => {
    it('should create fallback order structure', () => {
      const result = createFallbackOrder('customer-123');
      expect(result.slip_id).toBe('fallback');
      expect(result.slip_number).toBe('No Data Available');
      expect(result.grand_total).toBe('TZS 0');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].item_name).toBe('Unable to load order details');
    });

    it('should work without customer ID', () => {
      const result = createFallbackOrder();
      expect(result).toBeDefined();
      expect(result.slip_id).toBe('fallback');
    });
  });

  describe('transformErrorResponse', () => {
    it('should transform error with known code', () => {
      const errorResponse = {
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
          isRetryable: false,
          severity: 'warning'
        }
      };
      
      const result = transformErrorResponse(errorResponse);
      expect(result.message).toBe('Customer account not found. Please contact support.');
      expect(result.isRetryable).toBe(false);
      expect(result.severity).toBe('warning');
      expect(result.code).toBe('CUSTOMER_NOT_FOUND');
    });

    it('should use original message for unknown codes', () => {
      const errorResponse = {
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Something went wrong',
          isRetryable: true
        }
      };
      
      const result = transformErrorResponse(errorResponse);
      expect(result.message).toBe('Something went wrong');
      expect(result.isRetryable).toBe(true);
    });

    it('should handle missing error object', () => {
      const result = transformErrorResponse({});
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.isRetryable).toBe(true);
      expect(result.severity).toBe('error');
    });

    it('should handle null/undefined response', () => {
      const result = transformErrorResponse(null);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.isRetryable).toBe(true);
    });
  });
});