import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CustomerWalletDashboard from '../customer-wallet-dashboard';
import { useUser } from '../../providers/UserProvider';
import { useCurrentPage } from '../../providers/AppProvider';
import customerWalletService from '../../api/customer-wallet-service';

// Mock the providers
vi.mock('../../providers/UserProvider');
vi.mock('../../providers/AppProvider');
vi.mock('../../api/customer-wallet-service');

// Mock the child components
vi.mock('../customer-balance-status-card', () => ({
  default: ({ loading, walletCents, outstandingCents, onViewDetails, onPayBills }) => (
    <div data-testid="balance-status-card">
      {loading ? (
        <div>Loading balance...</div>
      ) : (
        <div>
          <div>Wallet: {walletCents}</div>
          <div>Outstanding: {outstandingCents}</div>
          {onViewDetails && <button onClick={onViewDetails}>View Details</button>}
          {onPayBills && <button onClick={onPayBills}>Pay Bills</button>}
        </div>
      )}
    </div>
  )
}));

vi.mock('../../components/loading-skeleton', () => ({
  LoadingSkeleton: () => <div data-testid="loading-skeleton">Loading...</div>
}));

vi.mock('../../components/error-display', () => ({
  ErrorDisplay: ({ error, onRetry }) => (
    <div data-testid="error-display">
      <div>Error: {error.message}</div>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  )
}));

vi.mock('../../components/button', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

vi.mock('../../components/text', () => ({
  Text: ({ children, className }) => <span className={className}>{children}</span>
}));

describe('CustomerWalletDashboard', () => {
  const mockUser = {
    _id: '675ab2c25855c2ccc099e056',
    name: 'Test Customer'
  };

  const mockWalletBalance = {
    wallet_cents: 150000,
    outstanding_cents: 50000,
    formatted_wallet_balance: '1,500 TZS',
    formatted_outstanding_balance: '500 TZS',
    has_available_credit: true,
    has_outstanding_bills: true
  };

  const mockCreditSlipsSummary = {
    count: 2,
    total_amount_cents: 50000,
    formatted_total_amount: '500 TZS',
    has_outstanding_bills: true
  };

  const mockRecentTransactions = [
    {
      entry_id: '1',
      display_description: 'Payment received',
      formatted_date: '2024-01-15',
      formatted_amount: '200 TZS',
      direction: 'CREDIT'
    },
    {
      entry_id: '2',
      display_description: 'Credit slip created',
      formatted_date: '2024-01-14',
      formatted_amount: '150 TZS',
      direction: 'DEBIT'
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    useUser.mockReturnValue(mockUser);
    useCurrentPage.mockReturnValue('Wallet');
    
    customerWalletService.setUser = vi.fn();
    customerWalletService.getMyBalance = vi.fn().mockResolvedValue({
      success: true,
      balance: mockWalletBalance
    });
    customerWalletService.getMyCreditSlipsSummary = vi.fn().mockResolvedValue({
      success: true,
      summary: mockCreditSlipsSummary
    });
    customerWalletService.getMyTransactionHistory = vi.fn().mockResolvedValue({
      success: true,
      entries: mockRecentTransactions
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    render(<CustomerWalletDashboard />);
    
    expect(screen.getByText('Loading balance...')).toBeInTheDocument();
  });

  it('renders wallet dashboard with balance card and summary sections', async () => {
    render(<CustomerWalletDashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Your Wallet')).toBeInTheDocument();
      expect(screen.getByTestId('balance-status-card')).toBeInTheDocument();
    });

    // Check that balance status card is rendered
    expect(screen.getByText('Wallet: 150000')).toBeInTheDocument();
    expect(screen.getByText('Outstanding: 50000')).toBeInTheDocument();

    // Check summary sections (use getAllByText for multiple instances)
    expect(screen.getAllByText('Pending Bills')).toHaveLength(2); // Header and quick action
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('displays pending bills summary when customer has outstanding bills', async () => {
    render(<CustomerWalletDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Outstanding Bills:')).toBeInTheDocument();
    });

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('500 TZS')).toBeInTheDocument();
    expect(screen.getByText('View All Bills')).toBeInTheDocument();
  });

  it('displays recent transactions when available', async () => {
    render(<CustomerWalletDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Payment received')).toHaveLength(2); // One in recent activity, one in transaction history
    });

    expect(screen.getAllByText('Credit slip created')).toHaveLength(2); // One in recent activity, one in transaction history
    expect(screen.getByText('View All Transactions')).toBeInTheDocument();
  });

  it('displays empty state when no outstanding bills', async () => {
    customerWalletService.getMyCreditSlipsSummary.mockResolvedValue({
      success: true,
      summary: {
        count: 0,
        total_amount_cents: 0,
        formatted_total_amount: '0 TZS',
        has_outstanding_bills: false
      }
    });

    render(<CustomerWalletDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No outstanding bills')).toBeInTheDocument();
    });

    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
  });

  it('displays empty state when no recent transactions', async () => {
    customerWalletService.getMyTransactionHistory.mockResolvedValue({
      success: true,
      entries: []
    });

    render(<CustomerWalletDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });

    expect(screen.getByText('Your transactions will appear here')).toBeInTheDocument();
  });

  it('handles navigation callbacks correctly', async () => {
    const mockNavigateToPendingBills = vi.fn();
    const mockNavigateToTransactionHistory = vi.fn();

    render(
      <CustomerWalletDashboard 
        onNavigateToPendingBills={mockNavigateToPendingBills}
        onNavigateToTransactionHistory={mockNavigateToTransactionHistory}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Your Wallet')).toBeInTheDocument();
    });

    // Test pending bills navigation
    fireEvent.click(screen.getByText('View All Bills'));
    expect(mockNavigateToPendingBills).toHaveBeenCalled();

    // Test transaction history navigation
    fireEvent.click(screen.getByText('View All Transactions'));
    expect(mockNavigateToTransactionHistory).toHaveBeenCalled();
  });

  it('displays error state when wallet data fails to load', async () => {
    customerWalletService.getMyBalance.mockResolvedValue({
      success: false,
      error: { message: 'Failed to load balance' }
    });

    render(<CustomerWalletDashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });

    expect(screen.getByText('Error: Failed to load balance')).toBeInTheDocument();
  });

  it('handles partial failure gracefully', async () => {
    // Mock balance to succeed but other services to fail
    customerWalletService.getMyBalance.mockResolvedValue({
      success: true,
      balance: mockWalletBalance
    });
    customerWalletService.getMyCreditSlipsSummary.mockResolvedValue({
      success: false,
      error: { message: 'Network error' }
    });
    customerWalletService.getMyTransactionHistory.mockResolvedValue({
      success: false,
      error: { message: 'Network error' }
    });

    render(<CustomerWalletDashboard />);
    
    // Wait for component to load with partial data
    await waitFor(() => {
      expect(screen.getByText('Your Wallet')).toBeInTheDocument();
      expect(screen.getByTestId('balance-status-card')).toBeInTheDocument();
    });

    // Should show empty states for failed sections
    expect(screen.getByText('No outstanding bills')).toBeInTheDocument();
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('displays wallet notifications based on balance status', async () => {
    render(<CustomerWalletDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Available Wallet Credit')).toBeInTheDocument();
    });

    expect(screen.getByText(/You have 1,500 available in your wallet/)).toBeInTheDocument();
    expect(screen.getByText(/Consider using it to pay your pending bills/)).toBeInTheDocument();
  });

  it('sets user context in wallet service on mount', () => {
    render(<CustomerWalletDashboard />);
    
    expect(customerWalletService.setUser).toHaveBeenCalledWith(mockUser);
  });

  it('refreshes data when returning to wallet page', async () => {
    const { rerender } = render(<CustomerWalletDashboard />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Your Wallet')).toBeInTheDocument();
    });

    // Clear the mock call count
    customerWalletService.getMyBalance.mockClear();

    // Change page and back
    useCurrentPage.mockReturnValue('Home');
    rerender(<CustomerWalletDashboard />);
    
    useCurrentPage.mockReturnValue('Wallet');
    rerender(<CustomerWalletDashboard />);

    // Should trigger another load
    await waitFor(() => {
      expect(customerWalletService.getMyBalance).toHaveBeenCalledTimes(1);
    });
  });

  it('applies mobile-first responsive design classes', async () => {
    render(<CustomerWalletDashboard />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Your Wallet')).toBeInTheDocument();
    });

    // Check for responsive grid classes using role or data attributes
    const summarySection = screen.getByText('Outstanding Bills:').closest('.grid');
    expect(summarySection).toHaveClass('grid-cols-1', 'md:grid-cols-2');

    // Check for mobile-friendly quick actions - use the one in Quick Actions section
    const quickActionsSection = screen.getByText('Quick Actions');
    const quickActionsGrid = quickActionsSection.parentElement.querySelector('.grid');
    expect(quickActionsGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
  });
});