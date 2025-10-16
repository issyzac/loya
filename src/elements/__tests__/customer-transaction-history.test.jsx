import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CustomerTransactionHistory from '../customer-transaction-history';
import customerWalletService from '../../api/customer-wallet-service';

// Mock the customer wallet service
vi.mock('../../api/customer-wallet-service', () => ({
  default: {
    getMyTransactionHistory: vi.fn()
  }
}));

// Mock currency utility
vi.mock('../../utils/currency', () => ({
  formatTZS: vi.fn((cents) => `${Math.floor(cents / 100)} TZS`)
}));

describe('CustomerTransactionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    customerWalletService.getMyTransactionHistory.mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<CustomerTransactionHistory />);
    
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
    expect(screen.getByText('View and filter your wallet transaction history')).toBeInTheDocument();
    
    // Check for loading skeletons
    const skeletons = screen.container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays transaction history with proper formatting', async () => {
    const mockTransactions = [
      {
        entry_id: '1',
        entry_type: 'PAYMENT',
        direction: 'CREDIT',
        amount_cents: 20000,
        occurred_at: '2024-01-15T10:30:00Z',
        description: 'Payment received',
        display_description: 'Payment received',
        formatted_amount: '200 TZS',
        formatted_date: '2024-01-15',
        formatted_time: '10:30:00'
      },
      {
        entry_id: '2',
        entry_type: 'CREDIT_SLIP',
        direction: 'DEBIT',
        amount_cents: 15000,
        occurred_at: '2024-01-14T14:20:00Z',
        description: 'Credit slip created',
        display_description: 'Credit slip created',
        formatted_amount: '150 TZS',
        formatted_date: '2024-01-14',
        formatted_time: '14:20:00'
      }
    ];

    customerWalletService.getMyTransactionHistory.mockResolvedValue({
      success: true,
      entries: mockTransactions,
      summary: {
        total_entries: 2,
        current_page: 1,
        per_page: 20,
        has_more: false
      }
    });

    render(<CustomerTransactionHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Payment received')).toBeInTheDocument();
    });

    expect(screen.getByText('Credit slip created')).toBeInTheDocument();
    expect(screen.getByText('+200 TZS')).toBeInTheDocument();
    expect(screen.getByText('150 TZS')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15 • 10:30:00')).toBeInTheDocument();
    expect(screen.getByText('2024-01-14 • 14:20:00')).toBeInTheDocument();
  });

  it('displays empty state when no transactions', async () => {
    customerWalletService.getMyTransactionHistory.mockResolvedValue({
      success: true,
      entries: [],
      summary: {
        total_entries: 0,
        current_page: 1,
        per_page: 20,
        has_more: false
      }
    });

    render(<CustomerTransactionHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    expect(screen.getByText('Your transaction history will appear here when you make payments or receive credits')).toBeInTheDocument();
  });

  it('handles filter functionality', async () => {
    const mockTransactions = [
      {
        entry_id: '1',
        entry_type: 'PAYMENT',
        direction: 'CREDIT',
        amount_cents: 20000,
        occurred_at: '2024-01-15T10:30:00Z',
        description: 'Payment received',
        display_description: 'Payment received',
        formatted_amount: '200 TZS',
        formatted_date: '2024-01-15',
        formatted_time: '10:30:00'
      }
    ];

    customerWalletService.getMyTransactionHistory.mockResolvedValue({
      success: true,
      entries: mockTransactions,
      summary: {
        total_entries: 1,
        current_page: 1,
        per_page: 20,
        has_more: false
      }
    });

    render(<CustomerTransactionHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Payment received')).toBeInTheDocument();
    });

    // Test filter controls
    expect(screen.getByLabelText('From Date')).toBeInTheDocument();
    expect(screen.getByLabelText('To Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Transaction Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Direction')).toBeInTheDocument();
    
    // Test filter buttons
    expect(screen.getByText('Apply Filters')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('displays error state when loading fails', async () => {
    customerWalletService.getMyTransactionHistory.mockResolvedValue({
      success: false,
      error: {
        message: 'Failed to load transactions',
        code: 'TRANSACTION_LOAD_ERROR',
        severity: 'error',
        isRetryable: true
      }
    });

    render(<CustomerTransactionHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load transactions')).toBeInTheDocument();
    });
  });

  it('shows transaction type badges correctly', async () => {
    const mockTransactions = [
      {
        entry_id: '1',
        entry_type: 'PAYMENT',
        direction: 'CREDIT',
        amount_cents: 20000,
        occurred_at: '2024-01-15T10:30:00Z',
        description: 'Payment received',
        display_description: 'Payment received',
        formatted_amount: '200 TZS',
        formatted_date: '2024-01-15',
        formatted_time: '10:30:00'
      },
      {
        entry_id: '2',
        entry_type: 'CREDIT_SLIP',
        direction: 'DEBIT',
        amount_cents: 15000,
        occurred_at: '2024-01-14T14:20:00Z',
        description: 'Credit slip created',
        display_description: 'Credit slip created',
        formatted_amount: '150 TZS',
        formatted_date: '2024-01-14',
        formatted_time: '14:20:00'
      }
    ];

    customerWalletService.getMyTransactionHistory.mockResolvedValue({
      success: true,
      entries: mockTransactions,
      summary: {
        total_entries: 2,
        current_page: 1,
        per_page: 20,
        has_more: false
      }
    });

    render(<CustomerTransactionHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Payment')).toBeInTheDocument();
    });

    expect(screen.getByText('Credit Slip')).toBeInTheDocument();
  });

  it('handles pagination when more transactions available', async () => {
    const mockTransactions = [
      {
        entry_id: '1',
        entry_type: 'PAYMENT',
        direction: 'CREDIT',
        amount_cents: 20000,
        occurred_at: '2024-01-15T10:30:00Z',
        description: 'Payment received',
        display_description: 'Payment received',
        formatted_amount: '200 TZS',
        formatted_date: '2024-01-15',
        formatted_time: '10:30:00'
      }
    ];

    customerWalletService.getMyTransactionHistory.mockResolvedValue({
      success: true,
      entries: mockTransactions,
      summary: {
        total_entries: 25,
        current_page: 1,
        per_page: 20,
        has_more: true
      }
    });

    render(<CustomerTransactionHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Payment received')).toBeInTheDocument();
    });

    expect(screen.getByText('Load More Transactions')).toBeInTheDocument();
    expect(screen.getByText('(1 of 25)')).toBeInTheDocument();
  });

  it('applies mobile-responsive design classes', async () => {
    customerWalletService.getMyTransactionHistory.mockResolvedValue({
      success: true,
      entries: [],
      summary: {
        total_entries: 0,
        current_page: 1,
        per_page: 20,
        has_more: false
      }
    });

    render(<CustomerTransactionHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    // Check for responsive grid classes in filter section
    const filterGrid = screen.container.querySelector('.grid-cols-1.md\\:grid-cols-4');
    expect(filterGrid).toBeInTheDocument();
  });
});