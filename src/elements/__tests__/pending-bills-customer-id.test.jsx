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

describe('PendingBills Customer ID Resolution', () => {
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

  it('should resolve customer ID from user._id field', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      phone_number: '+255123456789'
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

  it('should resolve customer ID from user.customer_id field when _id is not available', async () => {
    const mockUser = {
      customer_id: '507f1f77bcf86cd799439012',
      name: 'Jane Doe',
      phone_number: '+255123456790'
    };
    
    useUser.mockReturnValue(mockUser);
    ordersService.getCustomerOpenOrdersWithRetry.mockResolvedValue({
      success: true,
      data: { orders: [] }
    });

    render(<PendingBills />);

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
          cacheTtl: expect.any(Number),
          forceRefresh: false
        })
      );
    });
  });

  it('should handle missing user context gracefully', async () => {
    useUser.mockReturnValue(null);

    render(<PendingBills />);

    await waitFor(() => {
      expect(screen.getByText(/Using sample data because customer identification is not available/)).toBeInTheDocument();
    });

    // Should not make API call when no user context
    expect(ordersService.getCustomerOpenOrdersWithRetry).not.toHaveBeenCalled();
  });

  it('should handle invalid customer ID format', async () => {
    const mockUser = {
      _id: '', // Empty string
      customer_id: '123', // Too short
      name: 'Test User'
    };
    
    useUser.mockReturnValue(mockUser);

    render(<PendingBills />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Should not make API call with invalid customer ID
    expect(ordersService.getCustomerOpenOrdersWithRetry).not.toHaveBeenCalled();
    
    // Should show some kind of error or fallback
    expect(screen.getByText('Your Pending Bills')).toBeInTheDocument();
  });

  it('should show authentication error when customer ID is missing', async () => {
    const mockUser = {
      name: 'Test User',
      phone_number: '+255123456789'
      // No ID fields
    };
    
    useUser.mockReturnValue(mockUser);

    render(<PendingBills />);

    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getAllByText(/Customer identification not available/)).toHaveLength(2); // One in note, one in error
    });
  });

  it('should validate MongoDB ObjectId format correctly', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011', // Valid 24-character hex string
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

  it('should handle API errors with customer context', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User'
    };
    
    useUser.mockReturnValue(mockUser);
    
    const mockError = new Error('Network error');
    ordersService.getCustomerOpenOrdersWithRetry.mockRejectedValue(mockError);
    ordersService.handleError.mockReturnValue({
      error: {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        isRetryable: true,
        severity: 'error'
      }
    });

    render(<PendingBills />);

    await waitFor(() => {
      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument();
    });
  });
});