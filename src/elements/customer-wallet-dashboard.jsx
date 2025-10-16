import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../providers/UserProvider';
import { useCurrentPage } from '../providers/AppProvider';

import CustomerTransactionHistory from './customer-transaction-history';
import CustomerWalletInsights from './customer-wallet-insights';
import WalletNotificationSystem from '../components/wallet-notification-system';
import customerWalletService from '../api/customer-wallet-service';
import { ErrorDisplay } from '../components/error-display';
import { Button } from '../components/button';
import { Text } from '../components/text';
import { formatTZS } from '../utils/currency';

/**
 * Customer Wallet Dashboard Component
 * Main interface component for customer wallet with balance overview and quick navigation
 * 
 * Features:
 * - Balance status card with color-coded visual indicators
 * - Summary of outstanding credit slips
 * - Recent transaction highlights
 * - Mobile-first responsive design with touch-friendly elements
 */
export default function CustomerWalletDashboard({
  onNavigateToTransactionHistory,
  showTransactionHistory = true,
  showInsights = true,
  className = ''
}) {
  // State management
  const [walletData, setWalletData] = useState(null);
  const [creditSlipsSummary, setCreditSlipsSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isComponentMounted, setIsComponentMounted] = useState(true);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'transactions'

  // Refs for cleanup
  const abortControllerRef = useRef(null);

  // Context hooks
  const user = useUser();
  const currentPage = useCurrentPage();

  // Set user context in wallet service
  useEffect(() => {
    if (user) {
      customerWalletService.setUser(user);
    }
  }, [user]);

  // Component lifecycle management
  useEffect(() => {
    setIsComponentMounted(true);
    return () => {
      setIsComponentMounted(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Load wallet data including balance, credit slips summary, and recent transactions
   */
  const loadWalletData = useCallback(async (isRetry = false) => {
    if (!isComponentMounted) return;

    // Cancel any existing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      if (!isRetry) {
        setError(null);
      }

      // Load wallet data in parallel for better performance
      const [balanceResponse, creditSlipsResponse, transactionsResponse] = await Promise.all([
        customerWalletService.getMyBalance('TZS'),
        customerWalletService.getMyCreditSlipsSummary('TZS'),
        customerWalletService.getMyTransactionHistory('TZS', 1, 5) // Get 5 recent transactions
      ]);

      if (!isComponentMounted) return;

      // Handle balance data
      if (balanceResponse.success) {
        setWalletData(balanceResponse.balance);
      } else {
        throw new Error(balanceResponse.error?.message || 'Failed to load wallet balance');
      }

      // Handle credit slips data (non-critical, can fail gracefully)
      if (creditSlipsResponse.success) {
        setCreditSlipsSummary(creditSlipsResponse.summary);
      } else {
        console.warn('Failed to load credit slips summary:', creditSlipsResponse.error);
        setCreditSlipsSummary({
          count: 0,
          total_amount_cents: 0,
          formatted_total_amount: formatTZS(0),
          has_outstanding_bills: false
        });
      }

      // Handle transactions data (non-critical, can fail gracefully)
      if (transactionsResponse.success) {
        setRecentTransactions(transactionsResponse.entries || []);
      } else {
        console.warn('Failed to load recent transactions:', transactionsResponse.error);
        setRecentTransactions([]);
      }

      setRetryCount(0);
    } catch (err) {
      if (!isComponentMounted || err.name === 'AbortError') return;

      console.error('Failed to load wallet data:', err);
      setError({
        message: err.message || 'Failed to load wallet information',
        code: err.code || 'WALLET_LOAD_ERROR',
        severity: 'error',
        isRetryable: true,
        requiresAuth: err.code === 'CUSTOMER_ID_MISSING'
      });
    } finally {
      if (isComponentMounted) {
        setLoading(false);
      }
    }
  }, [isComponentMounted]);

  // Initial load effect
  useEffect(() => {
    if (isComponentMounted && user !== undefined) {
      loadWalletData();
    }
  }, [loadWalletData, user]);

  // Refresh data when returning to wallet page
  useEffect(() => {
    if (isComponentMounted && currentPage === 'Wallet' && user !== undefined) {
      loadWalletData();
    }
  }, [currentPage, loadWalletData, user]);

  /**
   * Handle retry action
   */
  const handleRetry = useCallback(() => {
    if (!isComponentMounted) return;

    const maxRetries = 3;
    if (retryCount >= maxRetries) {
      setError(prev => ({
        ...prev,
        isRetryable: false,
        message: 'Maximum retry attempts exceeded. Please refresh the page.'
      }));
      return;
    }

    setRetryCount(prev => prev + 1);
    loadWalletData(true);
  }, [loadWalletData, isComponentMounted, retryCount]);



  /**
   * Handle navigation to transaction history
   */
  const handleViewTransactionHistory = useCallback(() => {
    if (onNavigateToTransactionHistory) {
      onNavigateToTransactionHistory();
    } else {
      // Switch to transaction history view within the dashboard
      setActiveView('transactions');
    }
  }, [onNavigateToTransactionHistory]);

  /**
   * Handle view details action
   */
  const handleViewDetails = useCallback(() => {
    // For now, just navigate to transaction history
    handleViewTransactionHistory();
  }, [handleViewTransactionHistory]);

  /**
   * Handle navigation back to dashboard overview
   */
  const handleBackToDashboard = useCallback(() => {
    setActiveView('dashboard');
  }, []);

  /**
   * Handle navigation to add credit functionality
   */
  const handleNavigateToAddCredit = useCallback(() => {
    // Could navigate to add credit functionality
    console.log('Navigate to add credit');
  }, []);

  /**
   * Handle navigation to apply wallet functionality
   */
  const handleNavigateToApplyWallet = useCallback(() => {
    // Could navigate to apply wallet functionality
    console.log('Navigate to apply wallet');
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>

        {/* Balance card skeleton */}
        <div className="animate-pulse">
          <div className="rounded-lg border bg-gray-50 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>

        {/* Summary sections skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="bg-white rounded-lg border p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="bg-white rounded-lg border p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !walletData) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div>
          <h2 className="roboto-serif-heading text-2xl font-bold text-gray-900 mb-2">
            Your Wallet
          </h2>
          <Text className="text-gray-600">
            Manage your wallet balance and view your financial activity
          </Text>
        </div>

        <ErrorDisplay 
          error={error} 
          onRetry={error?.isRetryable ? handleRetry : null}
          isRetrying={loading}
          className="mt-6"
        />
      </div>
    );
  }

  // Render transaction history view
  if (activeView === 'transactions') {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header with back navigation */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleBackToDashboard}
            outline
            size="sm"
            className="flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back to Wallet</span>
          </Button>
          <div className="flex-1">
            <h2 className="roboto-serif-heading text-2xl font-bold text-gray-900 mb-2">
              Transaction History
            </h2>
            <Text className="text-gray-600">
              View and filter your complete transaction history
            </Text>
          </div>
        </div>

        {/* Transaction History Component */}
        <CustomerTransactionHistory
          showHeader={false}
          className="bg-white rounded-lg border shadow-sm p-6"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="roboto-serif-heading text-2xl font-bold text-gray-900 mb-2">
          Your Wallet
        </h2>
        <Text className="text-gray-600">
          Manage your wallet balance and view your financial activity
        </Text>
      </div>

      {/* Notification System */}
      <WalletNotificationSystem
        walletData={walletData}
        creditSlipsSummary={creditSlipsSummary}
        onNavigateToAddCredit={handleNavigateToAddCredit}
        onNavigateToApplyWallet={handleNavigateToApplyWallet}
        className="mb-6"
      />



      {/* Summary Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credit Slips Summary */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-300">
            <h3 className="roboto-serif-heading text-lg font-semibold text-gray-900 flex items-center">
              <i class="fa-regular fa-file mr-2 text-blue-600"></i>
              Outstanding Bills
            </h3>
          </div>
          <div className="p-4">
            {creditSlipsSummary?.has_outstanding_bills ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Text className="text-gray-600">Outstanding Bills:</Text>
                  <Text className="font-semibold text-lg">
                    {creditSlipsSummary.count}
                  </Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text className="text-gray-600">Total Amount:</Text>
                  <Text className="font-bold text-xl text-yellow-700">
                    {creditSlipsSummary.formatted_total_amount}
                  </Text>
                </div>

              </div>
            ) : (
              <div className="text-center py-4">
                <i class="fa-regular fa-check-circle text-4xl mb-2 text-green-600"></i>
                <Text className="text-gray-600 mb-3">
                  No outstanding bills
                </Text>
                <Text className="text-sm text-gray-500">
                  You're all caught up!
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Summary */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-300">
            <h3 className="roboto-serif-heading text-lg font-semibold text-gray-900 flex items-center">
              <i class="fa-regular fa-chart-bar mr-2 text-blue-600"></i>
              Recent Activity
            </h3>
          </div>
          <div className="p-4">
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.slice(0, 3).map((transaction, index) => (
                  <div key={transaction.entry_id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <Text className="text-sm font-medium text-gray-900">
                        {transaction.display_description || transaction.description || 'Transaction'}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {transaction.formatted_date}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text className={`text-sm font-semibold ${
                        transaction.direction === 'CREDIT' ? 'text-green-600' : 'text-gray-700'
                      }`}>
                        {transaction.direction === 'CREDIT' ? '+' : ''}{transaction.formatted_amount}
                      </Text>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={handleViewTransactionHistory}
                  outline
                  className="w-full mt-3"
                >
                  View All Transactions
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="fa-regular fa-inbox text-4xl mb-2 text-gray-400"></i>
                <Text className="text-gray-600 mb-3">
                  No recent activity
                </Text>
                <Text className="text-sm text-gray-500">
                  Your transactions will appear here
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History Preview Section - Only show if showTransactionHistory is true */}
      {showTransactionHistory && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="roboto-serif-heading text-lg font-semibold text-gray-900 flex items-center">
              <i class="fa-regular fa-chart-bar mr-2 text-blue-600"></i>
              Transaction History
            </h3>
            <Button
              onClick={handleViewTransactionHistory}
              outline
              size="sm"
              className="flex items-center space-x-1"
            >
              <span>View All</span>
              <span>→</span>
            </Button>
          </div>
          <div className="p-4">
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((transaction, index) => (
                  <div key={transaction.entry_id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-lg" role="img" aria-label="transaction type">
                        <span dangerouslySetInnerHTML={{ __html: 
                          transaction.entry_type?.toLowerCase() === 'payment' && transaction.direction === 'CREDIT' ? '<i class="fa-regular fa-money-bill text-green-600"></i>' :
                          transaction.entry_type?.toLowerCase() === 'payment' && transaction.direction === 'DEBIT' ? '<i class="fa-regular fa-credit-card text-red-600"></i>' :
                          transaction.entry_type?.toLowerCase() === 'credit_slip' ? '<i class="fa-regular fa-file text-blue-600"></i>' :
                          transaction.entry_type?.toLowerCase() === 'wallet_application' ? '<i class="fa-regular fa-sync text-purple-600"></i>' :
                          transaction.entry_type?.toLowerCase() === 'change_storage' ? '<i class="fa-regular fa-building text-orange-600"></i>' :
                          transaction.entry_type?.toLowerCase() === 'refund' ? '<i class="fa-regular fa-undo text-indigo-600"></i>' :
                          transaction.direction === 'CREDIT' ? '<i class="fa-regular fa-arrow-up text-green-600"></i>' : '<i class="fa-regular fa-arrow-down text-gray-600"></i>'
                        }}></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text className="font-medium text-gray-900">
                          {transaction.display_description || transaction.description || 'Transaction'}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {transaction.formatted_date} • {transaction.formatted_time}
                        </Text>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <Text className={`text-sm font-semibold ${
                        transaction.direction === 'CREDIT' ? 'text-green-600' : 'text-gray-700'
                      }`}>
                        {transaction.direction === 'CREDIT' ? '+' : ''}{transaction.formatted_amount}
                      </Text>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={handleViewTransactionHistory}
                  outline
                  className="w-full mt-3"
                >
                  View Complete History
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <i className="fa-regular fa-inbox text-4xl mb-2 text-gray-400"></i>
                <Text className="text-gray-600 mb-3">
                  No recent transactions
                </Text>
                <Text className="text-sm text-gray-500">
                  Your transaction history will appear here
                </Text>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wallet Insights Component - Only show if showInsights is true */}
      {showInsights && (
        <CustomerWalletInsights
          onNavigateToAddCredit={() => {
            // Could navigate to add credit functionality
            console.log('Navigate to add credit');
          }}
          onNavigateToApplyWallet={() => {
            // Could navigate to apply wallet functionality
            console.log('Navigate to apply wallet');
          }}
          className="bg-white rounded-lg border shadow-sm"
        />
      )}

      {/* Error display for partial failures */}
      {error && walletData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <Text className="text-yellow-800 text-sm flex items-center">
            <i class="fa-regular fa-exclamation-triangle mr-2"></i>
            Some wallet information couldn't be loaded. Core balance information is available.
          </Text>
          {error.isRetryable && (
            <Button
              onClick={handleRetry}
              size="sm"
              outline
              className="mt-2"
            >
              Retry Loading
            </Button>
          )}
        </div>
      )}
    </div>
  );
}