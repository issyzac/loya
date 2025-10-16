import { useState, useEffect, useCallback, useRef } from 'react';
import customerWalletService from '../api/customer-wallet-service';
import { LoadingSkeleton } from '../components/loading-skeleton';
import { ErrorDisplay } from '../components/error-display';
import { Button } from '../components/button';
import { Text } from '../components/text';
import { Input } from '../components/input';
import { Select } from '../components/select';
import { formatTZS } from '../utils/currency';

/**
 * Customer Transaction History Component
 * Displays paginated transaction history with filtering capabilities
 * 
 * Features:
 * - Paginated transaction list display
 * - Date filtering and transaction type display
 * - Proper TZS currency formatting
 * - Mobile-responsive design
 */
export default function CustomerTransactionHistory({
  className = '',
  showHeader = true,
  maxHeight = null,
  onTransactionClick = null
}) {
  // State management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total_entries: 0,
    has_more: false
  });

  // Filter state
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    transactionType: 'all',
    direction: 'all'
  });

  const [isComponentMounted, setIsComponentMounted] = useState(true);
  const abortControllerRef = useRef(null);

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
   * Load transaction history with current filters and pagination
   */
  const loadTransactions = useCallback(async (page = 1, resetData = false) => {
    if (!isComponentMounted) return;

    // Cancel any existing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      if (resetData) {
        setError(null);
        setTransactions([]);
      }

      const response = await customerWalletService.getMyTransactionHistory('TZS', page, pagination.per_page);

      if (!isComponentMounted) return;

      if (response.success) {
        const filteredEntries = applyFilters(response.entries || []);

        if (resetData || page === 1) {
          setTransactions(filteredEntries);
        } else {
          setTransactions(prev => [...prev, ...filteredEntries]);
        }

        setPagination({
          current_page: page,
          per_page: pagination.per_page,
          total_entries: response.summary?.total_entries || filteredEntries.length,
          has_more: response.summary?.has_more || false
        });

        setError(null);
      } else {
        throw new Error(response.error?.message || 'Failed to load transaction history');
      }
    } catch (err) {
      if (!isComponentMounted || err.name === 'AbortError') return;

      console.error('Failed to load transactions:', err);
      setError({
        message: err.message || 'Failed to load transaction history',
        code: err.code || 'TRANSACTION_LOAD_ERROR',
        severity: 'error',
        isRetryable: true
      });
    } finally {
      if (isComponentMounted) {
        setLoading(false);
      }
    }
  }, [isComponentMounted, pagination.per_page, filters]);

  /**
   * Apply client-side filters to transaction entries
   */
  const applyFilters = useCallback((entries) => {
    return entries.filter(entry => {
      // Date filtering
      if (filters.dateFrom) {
        const entryDate = new Date(entry.occurred_at);
        const fromDate = new Date(filters.dateFrom);
        if (entryDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const entryDate = new Date(entry.occurred_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire day
        if (entryDate > toDate) return false;
      }

      // Transaction type filtering
      if (filters.transactionType !== 'all') {
        const entryType = entry.entry_type?.toLowerCase() || '';
        if (entryType !== filters.transactionType.toLowerCase()) return false;
      }

      // Direction filtering
      if (filters.direction !== 'all') {
        const entryDirection = entry.direction?.toLowerCase() || '';
        if (entryDirection !== filters.direction.toLowerCase()) return false;
      }

      return true;
    });
  }, [filters]);

  // Initial load
  useEffect(() => {
    if (isComponentMounted) {
      loadTransactions(1, true);
    }
  }, [loadTransactions]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  /**
   * Apply filters and reload data
   */
  const applyFiltersAndReload = useCallback(() => {
    loadTransactions(1, true);
  }, [loadTransactions]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      transactionType: 'all',
      direction: 'all'
    });
  }, []);

  /**
   * Load more transactions (pagination)
   */
  const loadMore = useCallback(() => {
    if (pagination.has_more && !loading) {
      loadTransactions(pagination.current_page + 1, false);
    }
  }, [loadTransactions, pagination.has_more, pagination.current_page, loading]);

  /**
   * Handle retry action
   */
  const handleRetry = useCallback(() => {
    loadTransactions(1, true);
  }, [loadTransactions]);

  /**
   * Handle transaction click
   */
  const handleTransactionClick = useCallback((transaction) => {
    if (onTransactionClick) {
      onTransactionClick(transaction);
    }
  }, [onTransactionClick]);

  /**
   * Get transaction type display name
   */
  const getTransactionTypeDisplay = (entry) => {
    const type = entry.entry_type?.toLowerCase() || 'transaction';
    const typeMap = {
      'payment': 'Payment',
      'credit_slip': 'Credit Slip',
      'wallet_application': 'Wallet Applied',
      'change_storage': 'Change Stored',
      'refund': 'Refund'
    };
    return typeMap[type] || 'Transaction';
  };

  /**
   * Get transaction icon based on type and direction
   */
  const getTransactionIcon = (entry) => {
    const type = entry.entry_type?.toLowerCase() || '';
    const direction = entry.direction?.toLowerCase() || '';

    if (type === 'payment' && direction === 'credit') return '<i class="fa-regular fa-circle text-green-600"></i>';
    if (type === 'payment' && direction === 'debit') return '<i class="fa-regular fa-circle text-red-600"></i>';
    if (type === 'credit_slip') return '<i class="fa-regular fa-file text-blue-600"></i>';
    if (type === 'wallet_application') return '<i class="fa-regular fa-circle text-purple-600"></i>';
    if (type === 'change_storage') return '<i class="fa-regular fa-building text-orange-600"></i>';
    if (type === 'refund') return '<i class="fa-regular fa-circle text-indigo-600"></i>';

    return direction === 'credit' ? '<i class="fa-regular fa-circle text-green-600"></i>' : '<i class="fa-regular fa-circle text-gray-600"></i>';
  };

  // Loading state
  if (loading && transactions.length === 0) {
    return (
      <div className={`space-y-4 ${className}`} style={maxHeight ? { maxHeight, overflowY: 'auto' } : {}}>
        {showHeader && (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        )}

        {/* Filter skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>

        {/* Transaction list skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && transactions.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div>
            <h3 className="roboto-serif-heading text-lg font-semibold text-gray-900 mb-2">
              Transaction History
            </h3>
            <Text className="text-gray-600">
              View your wallet transaction history
            </Text>
          </div>
        )}

        <ErrorDisplay
          error={error}
          onRetry={error?.isRetryable ? handleRetry : null}
          isRetrying={loading}
          className="mt-4"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} style={maxHeight ? { maxHeight, overflowY: 'auto' } : {}}>
      {/* Header */}
      {showHeader && (
        <div>
          <h3 className="roboto-serif-heading text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <i class="fa-regular fa-file mr-2 text-blue-600"></i>
            Transaction History
          </h3>
          <Text className="text-gray-600">
            View and filter your wallet transaction history
          </Text>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <Select
              value={filters.transactionType}
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
              className="w-full"
            >
              <option value="all">All Types</option>
              <option value="payment">Payment</option>
              <option value="credit_slip">Credit Slip</option>
              <option value="wallet_application">Wallet Applied</option>
              <option value="change_storage">Change Stored</option>
              <option value="refund">Refund</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction
            </label>
            <Select
              value={filters.direction}
              onChange={(e) => handleFilterChange('direction', e.target.value)}
              className="w-full"
            >
              <option value="all">All Directions</option>
              <option value="credit">Money In</option>
              <option value="debit">Money Out</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={applyFiltersAndReload}
            size="sm"
            className="flex items-center space-x-1"
          >
            <span>Apply Filters</span>
          </Button>
          <Button
            onClick={clearFilters}
            outline
            size="sm"
            className="flex items-center space-x-1"
          >
            <span>Clear Filters</span>
          </Button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {transactions.length > 0 ? (
          <>
            {transactions.map((transaction, index) => (
              <div
                key={transaction.entry_id || index}
                className={`bg-white  border-b border-gray-200 p-4 transition-colors ${onTransactionClick ? 'hover:bg-gray-50 cursor-pointer' : ''
                  }`}
                onClick={() => handleTransactionClick(transaction)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl" role="img" aria-label="transaction type">
                      <span dangerouslySetInnerHTML={{ __html: getTransactionIcon(transaction) }}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Text className="font-medium text-gray-900">
                          {transaction.display_description || transaction.description || 'Transaction'}
                        </Text>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${transaction.direction === 'CREDIT'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {getTransactionTypeDisplay(transaction)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span>{transaction.formatted_date}</span>
                        <span>•</span>
                        <span>{transaction.formatted_time}</span>
                        {transaction.reference && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">
                              Ref: {transaction.reference}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <Text className={`text-lg font-bold ${transaction.direction === 'CREDIT' ? 'text-green-600' : 'text-gray-700'
                      }`}>
                      {transaction.direction === 'CREDIT' ? '+' : ''}{transaction.formatted_amount}
                    </Text>
                    <Text className="text-xs text-gray-500 capitalize">
                      {transaction.direction?.toLowerCase() || 'N/A'}
                    </Text>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {pagination.has_more && (
              <div className="text-center pt-4">
                <Button
                  onClick={loadMore}
                  outline
                  disabled={loading}
                  className="flex items-center space-x-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Transactions</span>
                      <span className="text-sm text-gray-500">
                        ({transactions.length} of {pagination.total_entries})
                      </span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Summary */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <Text className="text-blue-800 text-sm flex items-center">
                <i class="fa-regular fa-file mr-2"></i>
                Showing {transactions.length} of {pagination.total_entries} transactions
                {(filters.dateFrom || filters.dateTo || filters.transactionType !== 'all' || filters.direction !== 'all') && (
                  <span className="ml-1">(filtered)</span>
                )}
              </Text>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <i className="fa-regular fa-inbox text-6xl mb-4 text-gray-400"></i>
            <Text className="text-gray-600 mb-2 text-lg">
              No transactions found
            </Text>
            <Text className="text-gray-500 text-sm">
              {(filters.dateFrom || filters.dateTo || filters.transactionType !== 'all' || filters.direction !== 'all')
                ? 'Try adjusting your filters to see more transactions'
                : 'Your transaction history will appear here when you make payments or receive credits'
              }
            </Text>
            {(filters.dateFrom || filters.dateTo || filters.transactionType !== 'all' || filters.direction !== 'all') && (
              <Button
                onClick={clearFilters}
                outline
                size="sm"
                className="mt-3"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error display for partial failures */}
      {error && transactions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <Text className="text-yellow-800 text-sm flex items-center">
            <i class="fa-regular fa-circle mr-2"></i>
            Some transactions couldn't be loaded. Showing available data.
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