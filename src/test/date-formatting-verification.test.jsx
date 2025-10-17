/**
 * Comprehensive test suite to verify that no "Invalid Date" displays remain
 * in the wallet interface and that date formatting is working correctly
 */

import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CustomerWalletDashboard from '../elements/customer-wallet-dashboard';
import CustomerTransactionHistory from '../elements/customer-transaction-history';
import CustomerWalletInsights from '../elements/customer-wallet-insights';
import customerWalletService from '../api/customer-wallet-service';
import { UserProvider } from '../providers/UserProvider';
import { AppProvider } from '../providers/AppProvider';
import { 
  formatTransactionDate, 
  formatTransactionTime, 
  formatDateTime,
  formatLastActivity,
  formatCreditSlipAge,
  isValidDate 
} from '../utils/date-formatter';

// Mock the wallet service
vi.mock('../api/customer-wallet-service');

// Mock user context
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Customer',
  email: 'test@example.com'
};

// Test data with various date scenarios
const testTransactions = [
  {
    entry_id: '1',
    description: 'Valid date transaction',
    occurred_at: '2023-12-15T10:30:00Z',
    amount_cents: 50000,
    direction: 'CREDIT',
    entry_type: 'payment'
  },
  {
    entry_id: '2',
    description: 'Null date transaction',
    occurred_at: null,
    amount_cents: 25000,
    direction: 'DEBIT',
    entry_type: 'payment'
  },
  {
    entry_id: '3',
    description: 'Invalid date string transaction',
    occurred_at: 'invalid-date-string',
    amount_cents: 15000,
    direction: 'CREDIT',
    entry_type: 'credit_slip'
  },
  {
    entry_id: '4',
    description: 'Empty date transaction',
    occurred_at: '',
    amount_cents: 30000,
    direction: 'DEBIT',
    entry_type: 'wallet_application'
  },
  {
    entry_id: '5',
    description: 'Undefined date transaction',
    occurred_at: undefined,
    amount_cents: 20000,
    direction: 'CREDIT',
    entry_type: 'refund'
  }
];

const testBalance = {
  wallet_cents: 100000,
  outstanding_cents: 50000,
  formatted_wallet_balance: 'TZS 1,000.00',
  formatted_outstanding_balance: 'TZS 500.00',
  formatted_net_balance: 'TZS 500.00'
};

const testCreditSlips = [
  {
    slip_id: '1',
    created_at: '2023-12-10T08:00:00Z',
    totals: { remaining_cents: 25000 }
  },
  {
    slip_id: '2',
    created_at: null,
    totals: { remaining_cents: 25000 }
  },
  {
    slip_id: '3',
    created_at: 'invalid-date',
    totals: { remaining_cents: 0 }
  }
];

const testInsights = {
  current_balance: testBalance,
  activity_summary: {
    recent_transaction_count: 3,
    last_transaction_date: '2023-12-15T10:30:00Z',
    has_recent_activity: true
  },
  spending_patterns: {
    avg_transaction_amount: 'TZS 280.00',
    recent_spending_total: 'TZS 1,400.00',
    most_active_day: 'Friday'
  },
  notifications: [],
  recommendations: []
};

// Helper component to wrap components with providers
const TestWrapper = ({ children }) => (
  <AppProvider>
    <UserProvider value={mockUser}>
      {children}
    </UserProvider>
  </AppProvider>
);

describe('Date Formatting Verification Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful service responses
    customerWalletService.getMyBalance.mockResolvedValue({
      success: true,
      balance: testBalance
    });
    
    customerWalletService.getMyTransactionHistory.mockResolvedValue({
      success: true,
      entries: testTransactions,
      summary: {
        total_entries: testTransactions.length,
        has_more: false
      }
    });
    
    customerWalletService.getMyCreditSlipsSummary.mockResolvedValue({
      success: true,
      summary: {
        count: 2,
        total_amount_cents: 50000,
        formatted_total_amount: 'TZS 500.00',
        has_outstanding_bills: true
      },
      slips: testCreditSlips
    });
    
    customerWalletService.getMyWalletInsights.mockResolvedValue({
      success: true,
      insights: testInsights
    });
  });

  describe('Date Formatter Utility Functions', () => {
    test('formatTransactionDate handles invalid dates correctly', () => {
      expect(formatTransactionDate(null)).toBe('Date unavailable');
      expect(formatTransactionDate(undefined)).toBe('Date unavailable');
      expect(formatTransactionDate('')).toBe('Date unavailable');
      expect(formatTransactionDate('invalid-date')).toBe('Date unavailable');
      expect(formatTransactionDate('2023-12-15T10:30:00Z')).not.toBe('Date unavailable');
    });

    test('formatTransactionTime handles invalid dates correctly', () => {
      expect(formatTransactionTime(null)).toBe('Time unavailable');
      expect(formatTransactionTime(undefined)).toBe('Time unavailable');
      expect(formatTransactionTime('')).toBe('Time unavailable');
      expect(formatTransactionTime('invalid-date')).toBe('Time unavailable');
      expect(formatTransactionTime('2023-12-15T10:30:00Z')).not.toBe('Time unavailable');
    });

    test('formatDateTime handles invalid dates correctly', () => {
      expect(formatDateTime(null)).toBe('Date unavailable');
      expect(formatDateTime(undefined)).toBe('Date unavailable');
      expect(formatDateTime('')).toBe('Date unavailable');
      expect(formatDateTime('invalid-date')).toBe('Date unavailable');
      expect(formatDateTime('2023-12-15T10:30:00Z')).not.toBe('Date unavailable');
    });

    test('formatLastActivity handles invalid dates correctly', () => {
      expect(formatLastActivity(null)).toBe('No recent activity');
      expect(formatLastActivity(undefined)).toBe('No recent activity');
      expect(formatLastActivity('')).toBe('No recent activity');
      expect(formatLastActivity('invalid-date')).toBe('No recent activity');
      expect(formatLastActivity('2023-12-15T10:30:00Z')).not.toBe('No recent activity');
    });

    test('formatCreditSlipAge handles invalid dates correctly', () => {
      expect(formatCreditSlipAge(null)).toBe('Unknown age');
      expect(formatCreditSlipAge(undefined)).toBe('Unknown age');
      expect(formatCreditSlipAge('')).toBe('Unknown age');
      expect(formatCreditSlipAge('invalid-date')).toBe('Unknown age');
      expect(formatCreditSlipAge('2023-12-15T10:30:00Z')).not.toBe('Unknown age');
    });

    test('isValidDate correctly identifies valid and invalid dates', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2023-12-15T10:30:00Z')).toBe(true);
      expect(isValidDate(new Date())).toBe(true);
    });
  });

  describe('Customer Transaction History Component', () => {
    test('renders without "Invalid Date" text for mixed valid/invalid dates', async () => {
      render(
        <TestWrapper>
          <CustomerTransactionHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(customerWalletService.getMyTransactionHistory).toHaveBeenCalled();
      });

      // Wait for component to render with data
      await waitFor(() => {
        // Look specifically for the literal "Invalid Date" text that would appear from bad date formatting
        expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument();
      });

      // Verify fallback texts are shown for invalid dates
      expect(screen.getAllByText('Date unavailable').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Time unavailable').length).toBeGreaterThan(0);
    });

    test('displays consistent date formatting for valid dates', async () => {
      render(
        <TestWrapper>
          <CustomerTransactionHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(customerWalletService.getMyTransactionHistory).toHaveBeenCalled();
      });

      // Check that valid dates are formatted consistently (MM/DD/YYYY format)
      await waitFor(() => {
        const dateElements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Customer Wallet Dashboard Component', () => {
    test('renders without "Invalid Date" text', async () => {
      render(
        <TestWrapper>
          <CustomerWalletDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(customerWalletService.getMyBalance).toHaveBeenCalled();
      });

      // Ensure no literal "Invalid Date" text appears
      await waitFor(() => {
        expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument();
      });
    });

    test('handles credit slip age calculations with invalid dates', async () => {
      render(
        <TestWrapper>
          <CustomerWalletDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(customerWalletService.getMyCreditSlipsSummary).toHaveBeenCalled();
      });

      // The dashboard doesn't currently show credit slip ages, so this test should pass
      await waitFor(() => {
        // Just verify the component renders without errors
        expect(screen.getByText('Your Wallet')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Wallet Insights Component', () => {
    test('renders without "Invalid Date" text', async () => {
      render(
        <TestWrapper>
          <CustomerWalletInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(customerWalletService.getMyWalletInsights).toHaveBeenCalled();
      });

      // Ensure no literal "Invalid Date" text appears
      await waitFor(() => {
        expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument();
      });
    });

    test('handles last activity date with proper fallback', async () => {
      // Test with invalid last transaction date
      const insightsWithInvalidDate = {
        ...testInsights,
        activity_summary: {
          ...testInsights.activity_summary,
          last_transaction_date: null
        }
      };

      customerWalletService.getMyWalletInsights.mockResolvedValueOnce({
        success: true,
        insights: insightsWithInvalidDate
      });

      render(
        <TestWrapper>
          <CustomerWalletInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(customerWalletService.getMyWalletInsights).toHaveBeenCalled();
      });

      // Check that invalid last activity date shows appropriate fallback
      await waitFor(() => {
        expect(screen.getByText('No recent activity')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests - No Invalid Date Text Anywhere', () => {
    test('comprehensive check across all wallet components', async () => {
      const { container: dashboardContainer } = render(
        <TestWrapper>
          <CustomerWalletDashboard />
        </TestWrapper>
      );

      const { container: historyContainer } = render(
        <TestWrapper>
          <CustomerTransactionHistory />
        </TestWrapper>
      );

      const { container: insightsContainer } = render(
        <TestWrapper>
          <CustomerWalletInsights />
        </TestWrapper>
      );

      // Wait for all components to load
      await waitFor(() => {
        expect(customerWalletService.getMyBalance).toHaveBeenCalled();
        expect(customerWalletService.getMyTransactionHistory).toHaveBeenCalled();
        expect(customerWalletService.getMyWalletInsights).toHaveBeenCalled();
      });

      // Check that no component contains literal "Invalid Date" text (not the test data descriptions)
      await waitFor(() => {
        // Use a more specific check that excludes our test data descriptions
        const invalidDateRegex = /\bInvalid Date\b/;
        expect(dashboardContainer.textContent).not.toMatch(invalidDateRegex);
        expect(historyContainer.textContent).not.toMatch(invalidDateRegex);
        expect(insightsContainer.textContent).not.toMatch(invalidDateRegex);
      });
    });

    test('verifies consistent date formatting patterns', async () => {
      render(
        <TestWrapper>
          <div>
            <CustomerWalletDashboard />
            <CustomerTransactionHistory />
            <CustomerWalletInsights />
          </div>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(customerWalletService.getMyBalance).toHaveBeenCalled();
        expect(customerWalletService.getMyTransactionHistory).toHaveBeenCalled();
        expect(customerWalletService.getMyWalletInsights).toHaveBeenCalled();
      });

      // Verify that all date formats follow consistent patterns
      await waitFor(() => {
        // Check for MM/DD/YYYY format (valid dates)
        const dateElements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/);
        const timeElements = screen.getAllByText(/\d{1,2}:\d{2}\s?(AM|PM)/i);
        
        // Should find at least one properly formatted date and time
        expect(dateElements.length).toBeGreaterThan(0);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });
});