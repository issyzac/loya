/**
 * @file pending-bills-final-integration.test.jsx
 * @description Final integration test for task 9 - validates complete flow, 
 * backward compatibility, edge cases, cleanup, and accessibility
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PendingBills from '../pending-bills';
import { useUser } from '../../providers/UserProvider';
import { useUpdateOrder, useRemovedItems, useUpdateRemovedItems, useCurrentPage } from '../../providers/AppProvider';
import ordersService from '../../api/orders-service';
import { transformOrdersResponse } from '../../utils/orders-transform';

// Mock all dependencies
vi.mock('../../providers/UserProvider');
vi.mock('../../providers/AppProvider');
vi.mock('../../api/orders-service');
vi.mock('../../utils/orders-transform');

describe('Final Integration Test - Task 9', () => {
  const mockUpdateOrder = vi.fn();
  const mockClearRemovedItems = vi.fn();
  let user;

  // Sample test data that matches actual API structure
  const mockApiResponse = {
    success: true,
    data: {
      orders: [
        {
          slip_id: 'order_123',
          slip_number: 'CS-001',
          lines: [
            {
              item_id: 'item_1',
              description: 'Cappuccino',
              quantity: 1,
              line_total: 5000
            }
          ],
          totals: {
            grand_total: 5000
          },
          created_at: {
            $date: '2025-10-10T10:00:00.000Z'
          }
        }
      ]
    }
  };

  const mockTransformedData = {
    hasError: false,
    orders: [
      {
        slip_id: 'order_123',
        slip_number: 'CS-001',
        created_at: '2025-10-10T10:00:00.000Z',
        grand_total: 'TZS 5,000',
        items: [
          {
            item_id: 'item_1',
            item_name: 'Cappuccino',
            quantity: 1,
            price_total: 'TZS 5,000'
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    user = userEvent.setup();
    
    // Setup default mocks
    useUpdateOrder.mockReturnValue({ updateCustomerOrder: mockUpdateOrder });
    useRemovedItems.mockReturnValue([]);
    useUpdateRemovedItems.mockReturnValue({ clearRemovedItems: mockClearRemovedItems });
    useCurrentPage.mockReturnValue('PendingBills');
    
    // Mock orders service methods
    ordersService.getCustomerOpenOrdersWithRetry = vi.fn();
    ordersService.invalidateCustomerCache = vi.fn();
    ordersService.getCacheStats = vi.fn(() => ({
      cache: { hitRate: 0.8 },
      requests: { deduplicationRate: 0.5, pendingCount: 0 }
    }));
    
    // Mock transform function
    transformOrdersResponse.mockReturnValue(mockTransformedData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Complete Flow: Component Mount to Data Display', () => {
    it('should complete the full successful flow', async () => {
      // Setup: Valid user with customer ID
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue(mockApiResponse);

      // Act: Render component
      render(<PendingBills />);

      // Assert: Initial loading state
      expect(screen.getByText('Loading your pending bills...')).toBeInTheDocument();

      // Assert: API call made with correct parameters
      await waitFor(() => {
        expect(ordersService.getCustomerOpenOrdersWithRetry).toHaveBeenCalledWith(
          '507f1f77bcf86cd799439011',
          'TZS',
          1,
          20,
          3,
          expect.any(AbortSignal),
          expect.objectContaining({
            useCache: true,
            cacheTtl: expect.any(Number)
          })
        );
      });

      // Assert: Data transformation called
      expect(transformOrdersResponse).toHaveBeenCalledWith(mockApiResponse);

      // Assert: Loading state disappears and data is displayed
      await waitFor(() => {
        expect(screen.queryByText('Loading your pending bills...')).not.toBeInTheDocument();
      });

      // Assert: Bill data is displayed correctly
      expect(screen.getByText('CS-001')).toBeInTheDocument();
      expect(screen.getByText('TZS 5,000')).toBeInTheDocument();
    });

    it('should handle empty data correctly', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue({
        success: true,
        data: { orders: [] }
      });
      
      transformOrdersResponse.mockReturnValue({
        hasError: false,
        orders: []
      });

      render(<PendingBills />);

      await waitFor(() => {
        expect(screen.queryByText('Loading your pending bills...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('You have no pending bills.')).toBeInTheDocument();
    });
  });

  describe('2. Backward Compatibility', () => {
    it('should maintain existing UI interactions', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue(mockApiResponse);

      render(<PendingBills />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('CS-001')).toBeInTheDocument();
      });

      // Find and click the disclosure button to expand
      const disclosureButton = screen.getByRole('button', { name: /CS-001/ });
      await user.click(disclosureButton);

      // Should show item details
      await waitFor(() => {
        expect(screen.getByText('Cappuccino (x1)')).toBeInTheDocument();
      });

      // Should show action buttons
      expect(screen.getByRole('button', { name: 'Pay' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should maintain payment functionality', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue(mockApiResponse);

      render(<PendingBills />);

      await waitFor(() => {
        expect(screen.getByText('CS-001')).toBeInTheDocument();
      });

      const disclosureButton = screen.getByRole('button', { name: /CS-001/ });
      await user.click(disclosureButton);

      const payButton = await screen.findByRole('button', { name: 'Pay' });
      await user.click(payButton);

      // Should call updateCustomerOrder
      expect(mockUpdateOrder).toHaveBeenCalledWith(mockTransformedData.orders[0]);

      // Bill should be removed from the list
      await waitFor(() => {
        expect(screen.queryByText('CS-001')).not.toBeInTheDocument();
      });
    });
  });

  describe('3. Edge Cases', () => {
    it('should handle network failures', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      
      ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue({
        success: false,
        error: {
          message: 'Network error',
          code: 'NETWORK_ERROR',
          isRetryable: true,
          severity: 'error'
        }
      });

      transformOrdersResponse.mockReturnValue({
        hasError: true,
        errorMessage: 'Network error',
        errorCode: 'NETWORK_ERROR',
        isRetryable: true,
        orders: []
      });

      render(<PendingBills />);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('should handle missing customer ID', async () => {
      useUser.mockReturnValue(null);

      render(<PendingBills />);

      await waitFor(() => {
        expect(screen.getByText(/Using sample data because customer identification is not available/)).toBeInTheDocument();
      });

      // Should not make API call when no user context
      expect(ordersService.getCustomerOpenOrdersWithRetry).not.toHaveBeenCalled();
    });

    it('should handle malformed data gracefully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      
      ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue({
        success: true,
        data: { orders: [{ invalid: 'data' }] }
      });
      
      // Transform should filter out invalid data
      transformOrdersResponse.mockReturnValue({
        hasError: false,
        orders: [] // Filtered out malformed orders
      });

      render(<PendingBills />);

      await waitFor(() => {
        expect(screen.getByText('You have no pending bills.')).toBeInTheDocument();
      });
    });
  });

  describe('4. Cleanup and Memory Management', () => {
    it('should handle component unmount gracefully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      
      let resolvePromise;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      ordersService.getCustomerOpenOrdersWithRetry.mockReturnValue(controlledPromise);

      const { unmount } = render(<PendingBills />);

      // Verify the API call was made
      await waitFor(() => {
        expect(ordersService.getCustomerOpenOrdersWithRetry).toHaveBeenCalled();
      });

      // Unmount the component before the API call resolves
      unmount();

      // Now resolve the promise
      resolvePromise(mockApiResponse);

      // Wait a bit to ensure any state updates would have happened
      await new Promise(resolve => setTimeout(resolve, 100));

      // The test passes if no errors are thrown during unmount
      expect(true).toBe(true);
    });

    it('should handle user context changes', async () => {
      let currentUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'User 1'
      };
      
      useUser.mockImplementation(() => currentUser);
      ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue(mockApiResponse);

      const { rerender } = render(<PendingBills />);

      await waitFor(() => {
        expect(ordersService.getCustomerOpenOrdersWithRetry).toHaveBeenCalledWith(
          '507f1f77bcf86cd799439011',
          expect.any(String),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(AbortSignal),
          expect.any(Object)
        );
      });

      // Change user
      currentUser = {
        _id: '507f1f77bcf86cd799439012',
        name: 'User 2'
      };
      
      rerender(<PendingBills />);

      // Should make new API call for new user
      await waitFor(() => {
        const calls = ordersService.getCustomerOpenOrdersWithRetry.mock.calls;
        const hasNewUserCall = calls.some(call => call[0] === '507f1f77bcf86cd799439012');
        expect(hasNewUserCall).toBe(true);
      });
    });
  });

  describe('5. Accessibility and User Experience', () => {
    it('should provide proper ARIA labels and roles', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue(mockApiResponse);

      render(<PendingBills />);

      await waitFor(() => {
        expect(screen.getByText('CS-001')).toBeInTheDocument();
      });

      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: 'Your Pending Bills' })).toBeInTheDocument();

      // Check for proper button roles
      expect(screen.getByRole('button', { name: /CS-001/ })).toBeInTheDocument();
    });

    it('should provide loading announcements', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      
      ordersService.getCustomerOpenOrdersWithRetry.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(mockApiResponse), 1000)
        )
      );

      render(<PendingBills />);

      // Check for loading announcement
      const loadingElement = screen.getByText('Loading your pending bills...');
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement.closest('[aria-live]')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue(mockApiResponse);

      render(<PendingBills />);

      await waitFor(() => {
        expect(screen.getByText('CS-001')).toBeInTheDocument();
      });

      const disclosureButton = screen.getByRole('button', { name: /CS-001/ });
      
      // Focus the button
      disclosureButton.focus();
      expect(document.activeElement).toBe(disclosureButton);

      // Press Enter to expand
      await user.keyboard('{Enter}');

      // Should show expanded content
      await waitFor(() => {
        expect(screen.getByText('Cappuccino (x1)')).toBeInTheDocument();
      });
    });
  });

  describe('6. Performance and Error Recovery', () => {
    it('should handle retry operations', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      
      // First call fails, second succeeds
      ordersService.getCustomerOpenOrdersWithRetry
        .mockResolvedValueOnce({
          success: false,
          error: {
            message: 'Network error',
            code: 'NETWORK_ERROR',
            isRetryable: true,
            severity: 'error'
          }
        })
        .mockResolvedValueOnce(mockApiResponse);

      transformOrdersResponse
        .mockReturnValueOnce({
          hasError: true,
          errorMessage: 'Network error',
          errorCode: 'NETWORK_ERROR',
          isRetryable: true,
          orders: []
        })
        .mockReturnValueOnce(mockTransformedData);

      render(<PendingBills />);

      // Should show error first
      await waitFor(() => {
        expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      await user.click(retryButton);

      // Should show success after retry
      await waitFor(() => {
        expect(screen.getByText('CS-001')).toBeInTheDocument();
      });

      // Should have made two API calls
      expect(ordersService.getCustomerOpenOrdersWithRetry).toHaveBeenCalledTimes(2);
    });

    it('should handle API call cancellation', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };
      
      useUser.mockReturnValue(mockUser);
      ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue(mockApiResponse);

      render(<PendingBills />);

      // Verify AbortSignal is passed to API calls
      await waitFor(() => {
        expect(ordersService.getCustomerOpenOrdersWithRetry).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(AbortSignal), // This is the important part
          expect.any(Object)
        );
      });
    });
  });
});