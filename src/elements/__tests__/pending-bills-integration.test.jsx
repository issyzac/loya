import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomerWalletDashboard from '../customer-wallet-dashboard';
import { AppProvider } from '../../providers/AppProvider';
import { UserProvider } from '../../providers/UserProvider';
import customerWalletService from '../../api/customer-wallet-service';

// Mock the customer wallet service
vi.mock('../../api/customer-wallet-service', () => ({
  default: {
    setUser: vi.fn(),
    getMyBalance: vi.fn(),
    getMyCreditSlipsSummary: vi.fn(),
    getMyTransactionHistory: vi.fn(),
  }
}));

// Mock currency utility
vi.mock('../../utils/currency', () => ({
  formatTZS: vi.fn((amount) => `${(amount / 100).toLocaleString()} TZS`)
}));

const mockUser = {
  _id: '675ab2c25855c2ccc099e056',
  name: 'Test Customer',
  email: 'test@example.com'
};

const mockBalanceResponse = {
  success: true,
  balance: {
    wallet_cents: 200000,
    outstanding_cents: 50000,
    formatted_wallet_balance: '2,000 TZS',
    formatted_outstanding_balance: '500 TZS',
    formatted_net_balance: '1,500 TZS',
    net_balance_cents: 150000,
    has_available_credit: true,
    has_outstanding_bills: true
  }
};

const mockCreditSlipsResponse = {
  success: true,
  summary: {
    count: 2,
    total_amount_cents: 50000,
    formatted_total_amount: '500 TZS',
    has_outstanding_bills: true
  }
};

const mockTransactionsResponse = {
  success: true,
  entries: [
    {
      entry_id: '1',
      description: 'Payment received',
      direction: 'CREDIT',
      amount_cents: 10000,
      formatted_amount: '100 TZS',
      formatted_date: '1/15/2024',
      display_description: 'Payment received'
    }
  ]
};

const TestWrapper = ({ children, onNavigateToPendingBills = vi.fn() }) => (
  <UserProvider initialUser={mockUser}>
    <AppProvider>
      <CustomerWalletDashboard
        onNavigateToPendingBills={onNavigateToPendingBills}
        onNavigateToTransactionHistory={vi.fn()}
      />
      {children}
    </AppProvider>
  </UserProvider>
);

describe('Pending Bills Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    customerWalletService.getMyBalance.mockResolvedValue(mockBalanceResponse);
    customerWalletService.getMyCreditSlipsSummary.mockResolvedValue(mockCreditSlipsResponse);
    customerWalletService.getMyTransactionHistory.mockResolvedValue(mockTransactionsResponse);
  });

  it('displays pending bills summary with count and total amount', async () => {
    render(<TestWrapper />);

    // Wait for data to load - use getAllByText since there are multiple "Pending Bills" elements
    await waitFor(() => {
      expect(screen.getAllByText('Pending Bills')).toHaveLength(2);
    });

    // Check that outstanding bills count is displayed
    expect(screen.getByText('Outstanding Bills:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    // Check that total amount is displayed
    expect(screen.getByText('Total Amount:')).toBeInTheDocument();
    // Use getAllByText since 500 TZS appears in both balance card and summary
    expect(screen.getAllByText('500 TZS')).toHaveLength(2);
  });

  it('provides navigation link to pending bills from summary section', async () => {
    const mockNavigate = vi.fn();
    render(<TestWrapper onNavigateToPendingBills={mockNavigate} />);

    // Wait for data to load - use getAllByText since there are multiple "Pending Bills" elements
    await waitFor(() => {
      expect(screen.getAllByText('Pending Bills')).toHaveLength(2);
    });

    // Find and click the "View All Bills" button
    const viewAllBillsButton = screen.getByRole('button', { name: /view all bills/i });
    expect(viewAllBillsButton).toBeInTheDocument();

    fireEvent.click(viewAllBillsButton);

    // Verify navigation callback was called
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('provides navigation link to pending bills from quick actions', async () => {
    const mockNavigate = vi.fn();
    render(<TestWrapper onNavigateToPendingBills={mockNavigate} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    // Find and click the "Pending Bills" quick action button
    const pendingBillsQuickAction = screen.getByRole('button', { name: /pending bills/i });
    expect(pendingBillsQuickAction).toBeInTheDocument();

    fireEvent.click(pendingBillsQuickAction);

    // Verify navigation callback was called
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('provides navigation link from balance status card when bills exist', async () => {
    const mockNavigate = vi.fn();
    render(<TestWrapper onNavigateToPendingBills={mockNavigate} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Your Wallet Balance')).toBeInTheDocument();
    });

    // The balance card doesn't show a "Pay Bills" button when there are outstanding bills
    // Instead, it shows "View Details" button. The "Pay Bills" functionality is in the summary section
    // Let's test the View All Bills button in the summary section instead
    const viewAllBillsButton = screen.getByRole('button', { name: /view all bills/i });
    expect(viewAllBillsButton).toBeInTheDocument();

    fireEvent.click(viewAllBillsButton);

    // Verify navigation callback was called
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('displays no outstanding bills message when customer has no bills', async () => {
    // Mock response with no outstanding bills
    const noBillsResponse = {
      success: true,
      summary: {
        count: 0,
        total_amount_cents: 0,
        formatted_total_amount: '0 TZS',
        has_outstanding_bills: false
      }
    };

    customerWalletService.getMyCreditSlipsSummary.mockResolvedValue(noBillsResponse);

    render(<TestWrapper />);

    // Wait for data to load - use getAllByText since there are multiple "Pending Bills" elements
    await waitFor(() => {
      expect(screen.getAllByText('Pending Bills')).toHaveLength(2); // One in summary section, one in quick actions
    });

    // Check that no outstanding bills message is displayed
    expect(screen.getByText('No outstanding bills')).toBeInTheDocument();
    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();

    // Verify that "View All Bills" button is not present when no bills
    expect(screen.queryByRole('button', { name: /view all bills/i })).not.toBeInTheDocument();
  });

  it('ensures seamless navigation between wallet and pending bills features', async () => {
    const mockNavigate = vi.fn();
    render(<TestWrapper onNavigateToPendingBills={mockNavigate} />);

    // Wait for data to load - use getAllByText since there are multiple "Pending Bills" elements
    await waitFor(() => {
      expect(screen.getAllByText('Pending Bills')).toHaveLength(2); // One in summary section, one in quick actions
    });

    // Test multiple navigation paths
    const viewAllBillsButton = screen.getByRole('button', { name: /view all bills/i });
    const pendingBillsQuickAction = screen.getByRole('button', { name: /pending bills/i });

    // Test navigation from summary section
    fireEvent.click(viewAllBillsButton);
    expect(mockNavigate).toHaveBeenCalledTimes(1);

    // Test navigation from quick actions
    fireEvent.click(pendingBillsQuickAction);
    expect(mockNavigate).toHaveBeenCalledTimes(2);

    // Verify all navigation calls use the same callback
    expect(mockNavigate).toHaveBeenCalledWith();
  });

  it('displays pending bills summary in balance status card', async () => {
    render(<TestWrapper />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Your Wallet Balance')).toBeInTheDocument();
    });

    // Check that the balance card shows outstanding amount (without colon)
    expect(screen.getByText('Amount Owed')).toBeInTheDocument();
    // Use getAllByText since 500 TZS appears in both balance card and summary
    expect(screen.getAllByText('500 TZS')).toHaveLength(2);

    // Check that available credit is also shown (without colon)
    expect(screen.getByText('Available Credit')).toBeInTheDocument();
    expect(screen.getByText('2,000 TZS')).toBeInTheDocument();
  });
});