/**
 * @file orders-transform.integration.test.js
 * @description Integration tests for orders transformation utilities with realistic API data.
 */

import { transformOrdersResponse } from '../orders-transform.js';

describe('orders-transform integration tests', () => {
  it('should transform realistic API response correctly', () => {
    // Realistic API response based on the design document
    const apiResponse = {
      success: true,
      data: {
        respCode: 200,
        message: "Open orders retrieved successfully.",
        pagination: {
          current_page: 1,
          per_page: 20,
          total_orders: 2,
          total_pages: 1
        },
        orders: [
          {
            slip_id: "order_12345",
            slip_number: "CS-001",
            store_id: "store_001",
            currency: "TZS",
            lines: [
              {
                item_id: "item_101",
                description: "Cappuccino",
                quantity: 1,
                unit_price: 5000,
                line_total: 5000,
                paid: 0,
                remaining: 5000
              },
              {
                item_id: "item_102",
                description: "Americano",
                quantity: 1,
                unit_price: 4000,
                line_total: 4000,
                paid: 0,
                remaining: 4000
              }
            ],
            totals: {
              subtotal: 9000,
              tax: 0,
              discount: 0,
              grand_total: 9000,
              paid: 0,
              remaining: 9000
            },
            status: "OPEN",
            occurred_at: {
              $date: "2025-10-10T10:00:00.000Z"
            },
            created_at: {
              $date: "2025-10-10T10:00:00.000Z"
            },
            updated_at: {
              $date: "2025-10-10T10:00:00.000Z"
            }
          },
          {
            slip_id: "order_12346",
            slip_number: "CS-002",
            store_id: "store_001",
            currency: "TZS",
            lines: [
              {
                item_id: "item_201",
                description: "Espresso",
                quantity: 2,
                unit_price: 3000,
                line_total: 6000,
                paid: 0,
                remaining: 6000
              }
            ],
            totals: {
              subtotal: 6000,
              tax: 0,
              discount: 0,
              grand_total: 6000,
              paid: 0,
              remaining: 6000
            },
            status: "OPEN",
            occurred_at: {
              $date: "2025-10-09T14:30:00.000Z"
            },
            created_at: {
              $date: "2025-10-09T14:30:00.000Z"
            },
            updated_at: {
              $date: "2025-10-09T14:30:00.000Z"
            }
          }
        ]
      }
    };

    const result = transformOrdersResponse(apiResponse);

    expect(result.hasError).toBe(false);
    expect(result.orders).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.pagination).toEqual(apiResponse.data.pagination);

    // Check first order transformation
    const firstOrder = result.orders[0];
    expect(firstOrder).toEqual({
      slip_id: 'order_12345',
      slip_number: 'CS-001',
      created_at: '2025-10-10T10:00:00.000Z',
      grand_total: 'TZS 9,000', // 9000 TZS formatted
      items: [
        {
          item_id: 'item_101',
          item_name: 'Cappuccino',
          quantity: 1,
          price_total: 'TZS 5,000' // 5000 TZS formatted
        },
        {
          item_id: 'item_102',
          item_name: 'Americano',
          quantity: 1,
          price_total: 'TZS 4,000' // 4000 TZS formatted
        }
      ]
    });

    // Check second order transformation
    const secondOrder = result.orders[1];
    expect(secondOrder).toEqual({
      slip_id: 'order_12346',
      slip_number: 'CS-002',
      created_at: '2025-10-09T14:30:00.000Z',
      grand_total: 'TZS 6,000', // 6000 TZS formatted
      items: [
        {
          item_id: 'item_201',
          item_name: 'Espresso',
          quantity: 2,
          price_total: 'TZS 6,000' // 6000 TZS formatted
        }
      ]
    });
  });

  it('should handle API response with missing optional fields', () => {
    const apiResponse = {
      success: true,
      data: {
        orders: [
          {
            slip_id: "order_minimal",
            slip_number: "CS-MIN",
            lines: [
              {
                item_id: "item_min",
                description: "Basic Item",
                quantity: 1,
                line_total: 1000
              }
            ],
            totals: {
              grand_total: 1000
            }
            // Missing dates, status, etc.
          }
        ]
      }
    };

    const result = transformOrdersResponse(apiResponse);

    expect(result.hasError).toBe(false);
    expect(result.orders).toHaveLength(1);
    
    const order = result.orders[0];
    expect(order.slip_id).toBe('order_minimal');
    expect(order.slip_number).toBe('CS-MIN');
    expect(order.grand_total).toBe('TZS 1,000'); // 1000 TZS formatted
    expect(order.created_at).toBeDefined(); // Should have a default date
    expect(order.items).toHaveLength(1);
    expect(order.items[0].item_name).toBe('Basic Item');
    expect(order.items[0].price_total).toBe('TZS 1,000');
  });

  it('should handle error response from API', () => {
    const errorResponse = {
      success: false,
      error: {
        message: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND',
        severity: 'warning',
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

  it('should handle empty orders array', () => {
    const apiResponse = {
      success: true,
      data: {
        orders: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_orders: 0,
          total_pages: 0
        }
      }
    };

    const result = transformOrdersResponse(apiResponse);

    expect(result.hasError).toBe(false);
    expect(result.orders).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.pagination.total_orders).toBe(0);
  });
});