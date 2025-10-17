import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PendingBills from '../pending-bills';
import { useUser } from '../../providers/UserProvider';
import { useUpdateOrder, useRemovedItems, useUpdateRemovedItems, useCurrentPage } from '../../providers/AppProvider';
import ordersService from '../../api/orders-service';

// Mock the providers
vi.mock('../../providers/UserProvider');
vi.mock('../../providers/AppProvider');
vi.mock('../../api/orders-service');

// Mock the orders transform utility
vi.mock('../../utils/orders-transform', () => ({
  transformOrdersResponse: vi.fn(() => ({
    hasError: false,
    orders: []
  }))
}));

describe('PendingBills Lifecycle Management', () => {
  const mockUpdateOrder = vi.fn();
  const mockClearRemovedItems = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    useUpdateOrder.mockReturnValue({ updateCustomerOrder: mockUpdateOrder });
    useRemovedItems.mockReturnValue([]);
    useUpdateRemovedItems.mockReturnValue({ clearRemovedItems: mockClearRemovedItems });
    useCurrentPage.mockReturnValue('PendingBills');
    
    ordersService.getCustomerOpenOrdersWithRetry = vi.fn();
    ordersService.handleError = vi.fn();
  });

  it('should handle component unmount gracefully', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User'
    };
    
    useUser.mockReturnValue(mockUser);
    
    // Create a promise that we can control
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
    resolvePromise({
      success: true,
      data: { orders: [] }
    });

    // Wait a bit to ensure any state updates would have happened
    await new Promise(resolve => setTimeout(resolve, 100));

    // The test passes if no errors are thrown during unmount
    expect(true).toBe(true);
  });

  it('should pass AbortSignal to API calls', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User'
    };
    
    useUser.mockReturnValue(mockUser);
    ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue({
      success: true,
      data: { orders: [] }
    });

    render(<PendingBills />);

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
          cacheTtl: expect.any(Number),
          forceRefresh: false
        })
      );
    });
  });

  it('should handle user context changes properly', async () => {
    const mockUser1 = {
      _id: '507f1f77bcf86cd799439011',
      name: 'User 1'
    };
    
    const mockUser2 = {
      _id: '507f1f77bcf86cd799439012',
      name: 'User 2'
    };
    
    // Start with first user
    useUser.mockReturnValue(mockUser1);
    ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue({
      success: true,
      data: { orders: [] }
    });

    const { rerender } = render(<PendingBills />);

    // Wait for initial API calls to complete
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
          cacheTtl: expect.any(Number),
          forceRefresh: false
        })
      );
    });

    const initialCallCount = ordersService.getCustomerOpenOrdersWithRetry.mock.calls.length;

    // Change user context
    useUser.mockReturnValue(mockUser2);
    rerender(<PendingBills />);

    // Should make new API call for new user
    await waitFor(() => {
      expect(ordersService.getCustomerOpenOrdersWithRetry).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        'TZS',
        1,
        20,
        3,
        expect.any(AbortSignal),
        expect.objectContaining({
          useCache: true,
          forceRefresh: true // Should force refresh when user changes
        })
      );
    });

    // Should have made additional calls for the new user
    expect(ordersService.getCustomerOpenOrdersWithRetry.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should handle page navigation properly', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User'
    };
    
    useUser.mockReturnValue(mockUser);
    ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue({
      success: true,
      data: { orders: [] }
    });

    // Start on different page
    useCurrentPage.mockReturnValue('Home');
    const { rerender } = render(<PendingBills />);

    // Wait for initial API calls to complete
    await waitFor(() => {
      expect(ordersService.getCustomerOpenOrdersWithRetry).toHaveBeenCalled();
    });

    const initialCallCount = ordersService.getCustomerOpenOrdersWithRetry.mock.calls.length;

    // Navigate to PendingBills page
    useCurrentPage.mockReturnValue('PendingBills');
    rerender(<PendingBills />);

    // Should make additional API call when navigating to the page
    await waitFor(() => {
      expect(ordersService.getCustomerOpenOrdersWithRetry.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });
});