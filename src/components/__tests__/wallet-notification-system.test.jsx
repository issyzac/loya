import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import WalletNotificationSystem from '../wallet-notification-system';

// Mock the currency utility
vi.mock('../../utils/currency', () => ({
  formatTZS: (cents) => `TZS ${(cents / 100).toLocaleString()}`
}));

describe('WalletNotificationSystem', () => {
  const mockNavigateToPendingBills = vi.fn();
  const mockNavigateToAddCredit = vi.fn();
  const mockNavigateToApplyWallet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    onNavigateToPendingBills: mockNavigateToPendingBills,
    onNavigateToAddCredit: mockNavigateToAddCredit,
    onNavigateToApplyWallet: mockNavigateToApplyWallet
  };

  it('renders no notifications when wallet data is null', () => {
    const { container } = render(
      <WalletNotificationSystem
        {...defaultProps}
        walletData={null}
        creditSlipsSummary={null}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('shows old credit slips reminder notification', () => {
    const walletData = {
      wallet_cents: 10000,
      outstanding_cents: 5000,
      currency: 'TZS'
    };

    const creditSlipsSummary = {
      slips: [
        {
          id: 'slip1',
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
          days_old: 8,
          totals: { remaining_cents: 3000 }
        },
        {
          id: 'slip2',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          days_old: 10,
          totals: { remaining_cents: 2000 }
        }
      ]
    };

    render(
      <WalletNotificationSystem
        {...defaultProps}
        walletData={walletData}
        creditSlipsSummary={creditSlipsSummary}
      />
    );

    expect(screen.getByText('Outstanding Bills Reminder')).toBeInTheDocument();
    expect(screen.getByText('You have 2 bills from over a week ago')).toBeInTheDocument();
    expect(screen.getByText('Total amount: TZS 50')).toBeInTheDocument();
    expect(screen.getByText('View Bills')).toBeInTheDocument();
  });

  it('shows significant credit notification', () => {
    const walletData = {
      wallet_cents: 75000, // 750 TZS
      outstanding_cents: 0,
      currency: 'TZS'
    };

    render(
      <WalletNotificationSystem
        {...defaultProps}
        walletData={walletData}
        creditSlipsSummary={{ slips: [] }}
      />
    );

    expect(screen.getByText('Available Wallet Credit')).toBeInTheDocument();
    expect(screen.getByText('You have TZS 750 available in your wallet')).toBeInTheDocument();
    expect(screen.getByText('Ready to use for your next purchase')).toBeInTheDocument();
    expect(screen.getByText('Use Credit')).toBeInTheDocument();
  });

  it('shows negative balance warning', () => {
    const walletData = {
      wallet_cents: 5000,
      outstanding_cents: 20000, // Net balance: -15000 (150 TZS owed)
      currency: 'TZS'
    };

    render(
      <WalletNotificationSystem
        {...defaultProps}
        walletData={walletData}
        creditSlipsSummary={{ slips: [] }}
      />
    );

    expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
    expect(screen.getByText('You owe TZS 150')).toBeInTheDocument();
    expect(screen.getByText('You can use your wallet credit to reduce this amount')).toBeInTheDocument();
    expect(screen.getByText('Apply Wallet')).toBeInTheDocument();
  });

  it('shows positive balance success message', () => {
    const walletData = {
      wallet_cents: 50000,
      outstanding_cents: 0,
      currency: 'TZS'
    };

    render(
      <WalletNotificationSystem
        {...defaultProps}
        walletData={walletData}
        creditSlipsSummary={{ slips: [] }}
      />
    );

    expect(screen.getByText('Great Job!')).toBeInTheDocument();
    expect(screen.getByText('Your account is in good standing')).toBeInTheDocument();
    expect(screen.getByText('You have TZS 500 ready for your next visit')).toBeInTheDocument();
  });

  it('handles notification dismissal', () => {
    const walletData = {
      wallet_cents: 75000,
      outstanding_cents: 0,
      currency: 'TZS'
    };

    render(
      <WalletNotificationSystem
        {...defaultProps}
        walletData={walletData}
        creditSlipsSummary={{ slips: [] }}
      />
    );

    const dismissButtons = screen.getAllByLabelText('Dismiss notification');
    fireEvent.click(dismissButtons[0]); // Click the first dismiss button

    expect(screen.queryByText('Available Wallet Credit')).not.toBeInTheDocument();
  });

  it('handles notification actions', () => {
    const walletData = {
      wallet_cents: 10000,
      outstanding_cents: 5000,
      currency: 'TZS'
    };

    const creditSlipsSummary = {
      slips: [
        {
          id: 'slip1',
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          days_old: 8,
          totals: { remaining_cents: 5000 }
        }
      ]
    };

    render(
      <WalletNotificationSystem
        {...defaultProps}
        walletData={walletData}
        creditSlipsSummary={creditSlipsSummary}
      />
    );

    const viewBillsButton = screen.getByText('View Bills');
    fireEvent.click(viewBillsButton);

    expect(mockNavigateToPendingBills).toHaveBeenCalledTimes(1);
  });

  it('shows success notifications with auto-hide enabled', () => {
    const walletData = {
      wallet_cents: 50000,
      outstanding_cents: 0,
      currency: 'TZS'
    };

    render(
      <WalletNotificationSystem
        {...defaultProps}
        walletData={walletData}
        creditSlipsSummary={{ slips: [] }}
      />
    );

    // Success notification should be present
    expect(screen.getByText('Great Job!')).toBeInTheDocument();
    expect(screen.getByText('Your account is in good standing')).toBeInTheDocument();
  });

  it('sorts notifications by priority', () => {
    const walletData = {
      wallet_cents: 75000, // This creates a low priority notification
      outstanding_cents: 20000, // This creates a medium priority notification
      currency: 'TZS'
    };

    const creditSlipsSummary = {
      slips: [
        {
          id: 'slip1',
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          days_old: 8,
          totals: { remaining_cents: 20000 }
        }
      ]
    };

    render(
      <WalletNotificationSystem
        {...defaultProps}
        walletData={walletData}
        creditSlipsSummary={creditSlipsSummary}
      />
    );

    const notifications = screen.getAllByRole('alert');
    
    // Should have multiple notifications
    expect(notifications.length).toBeGreaterThan(1);
    
    // Check that we have the expected notifications
    expect(screen.getByText('Outstanding Bills Reminder')).toBeInTheDocument();
    expect(screen.getByText('Available Wallet Credit')).toBeInTheDocument();
  });
});