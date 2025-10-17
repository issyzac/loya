import walletService from './wallet-service.js';
import { formatTZS } from '../utils/currency.js';
import { 
  formatTransactionDate, 
  formatTransactionTime, 
  formatDateTime,
  formatLastActivity,
  formatCreditSlipAge,
  enhanceTransactionWithDates,
  isValidDate 
} from '../utils/date-formatter.js';

/**
 * Validates customer ID format and content
 * @param {any} customerId - The customer ID to validate
 * @returns {object} Validation result with isValid boolean and error message
 */
const validateCustomerId = (customerId) => {
  if (!customerId) {
    return { isValid: false, error: 'Customer ID is missing' };
  }
  
  if (typeof customerId !== 'string') {
    return { isValid: false, error: 'Customer ID must be a string' };
  }
  
  const trimmedId = customerId.trim();
  if (trimmedId === '') {
    return { isValid: false, error: 'Customer ID cannot be empty' };
  }
  
  // Basic MongoDB ObjectId format validation (24 hex characters)
  if (trimmedId.length === 24 && /^[0-9a-fA-F]{24}$/.test(trimmedId)) {
    return { isValid: true, error: null };
  }
  
  // Reject IDs that are too short (likely invalid)
  if (trimmedId.length < 12) {
    return { isValid: false, error: 'Customer ID appears to be too short' };
  }
  
  // Allow other ID formats for flexibility
  return { isValid: true, error: null };
};

/**
 * @class CustomerWalletService
 * @description Customer-specific wallet service that wraps the existing wallet service
 * and provides customer-facing methods with proper authentication and data formatting.
 * Uses consistent customer ID resolution logic.
 */
class CustomerWalletService {
  constructor() {
    this.currentUser = null;
  }

  /**
   * Set the current user context for customer ID resolution
   * @param {object} user - The user object from UserProvider
   */
  setUser(user) {
    this.currentUser = user;
  }

  /**
   * Resolve customer ID using consistent logic
   * @returns {object} Object with customerId and error information
   */
  resolveCustomerId() {
    if (!this.currentUser || typeof this.currentUser !== 'object') {
      return { customerId: null, error: 'User not logged in' };
    }

    const potentialIds = [
      this.currentUser._id, 
      this.currentUser.customer_id, 
      this.currentUser.id, 
      this.currentUser.user_id
    ];
    
    let customerId = null;
    
    for (const id of potentialIds) {
      if (id) {
        const validation = validateCustomerId(id);
        if (validation.isValid) {
          customerId = id.trim();
          break;
        }
      }
    }
    
    if (!customerId) {
      return { customerId: null, error: 'Customer identification not available' };
    }

    return { customerId, error: null };
  }

  /**
   * Get current customer's wallet balance with formatted display
   * @param {string} [currency='TZS'] - The currency code
   * @returns {Promise<object>} Promise that resolves with balance information
   */
  async getMyBalance(currency = 'TZS') {
    try {
      const { customerId, error } = this.resolveCustomerId();
      
      if (!customerId) {
        return {
          success: false,
          error: {
            message: error || 'Customer identification required',
            code: 'CUSTOMER_ID_MISSING',
            severity: 'error',
            requiresAuth: true
          }
        };
      }

      const response = await walletService.getCustomerBalance(customerId, currency);
      
      if (response.success && response.balance) {
        const balance = response.balance;
        
        return {
          success: true,
          data: response.data,
          balance: {
            ...balance,
            // Add formatted currency displays
            formatted_wallet_balance: formatTZS(balance.wallet_cents || 0),
            formatted_outstanding_balance: formatTZS(balance.outstanding_cents || 0),
            formatted_net_balance: formatTZS((balance.wallet_cents || 0) - (balance.outstanding_cents || 0)),
            // Calculate net balance for color coding
            net_balance_cents: (balance.wallet_cents || 0) - (balance.outstanding_cents || 0),
            has_available_credit: (balance.wallet_cents || 0) > 0,
            has_outstanding_bills: (balance.outstanding_cents || 0) > 0
          }
        };
      }
      
      return response;
    } catch (error) {
      return walletService.handleError(error, 'Failed to get wallet balance');
    }
  }

  /**
   * Get current customer's transaction history with pagination
   * @param {string} [currency='TZS'] - The currency code
   * @param {number} [page=1] - The page number
   * @param {number} [perPage=20] - The number of items per page
   * @returns {Promise<object>} Promise that resolves with transaction history
   */
  async getMyTransactionHistory(currency = 'TZS', page = 1, perPage = 20) {
    try {
      const { customerId, error } = this.resolveCustomerId();
      
      if (!customerId) {
        return {
          success: false,
          error: {
            message: error || 'Customer identification required',
            code: 'CUSTOMER_ID_MISSING',
            severity: 'error',
            requiresAuth: true
          }
        };
      }

      const response = await walletService.getTransactionHistory(customerId, currency, page, perPage);
      
      if (response.success && response.entries) {
        // Format transaction entries for customer display with date validation
        const formattedEntries = response.entries.map(entry => {
          const enhancedEntry = enhanceTransactionWithDates(entry);
          return {
            ...enhancedEntry,
            formatted_amount: formatTZS(entry.amount_cents || 0),
            display_description: this.formatTransactionDescription(entry)
          };
        });

        return {
          success: true,
          data: response.data,
          entries: formattedEntries,
          pagination: response.pagination,
          summary: {
            total_entries: response.pagination?.total || formattedEntries.length,
            current_page: page,
            per_page: perPage,
            has_more: response.pagination?.has_next || false
          }
        };
      }
      
      return response;
    } catch (error) {
      return walletService.handleError(error, 'Failed to get transaction history');
    }
  }

  /**
   * Get current customer's credit slips summary
   * @param {string} [currency='TZS'] - The currency code
   * @returns {Promise<object>} Promise that resolves with credit slips summary
   */
  async getMyCreditSlipsSummary(currency = 'TZS') {
    try {
      const { customerId, error } = this.resolveCustomerId();
      
      if (!customerId) {
        return {
          success: false,
          error: {
            message: error || 'Customer identification required',
            code: 'CUSTOMER_ID_MISSING',
            severity: 'error',
            requiresAuth: true
          }
        };
      }

      const response = await walletService.getOpenCreditSlips(customerId, currency);
      
      if (response.success) {
        const slips = response.slips || [];
        const totalAmountCents = slips.reduce((sum, slip) => 
          sum + (slip.totals?.remaining_cents || 0), 0
        );

        // Calculate oldest slip date safely with date validation
        let oldestSlipDate = null;
        let oldestSlipDays = 0;
        
        if (slips.length > 0) {
          const validDates = slips
            .filter(slip => isValidDate(slip.created_at))
            .map(slip => new Date(slip.created_at).getTime());
          
          if (validDates.length > 0) {
            oldestSlipDate = Math.min(...validDates);
            oldestSlipDays = Math.max(...validDates.map(dateTime => 
              Math.floor((Date.now() - dateTime) / (1000 * 60 * 60 * 24))
            ));
          }
        }

        return {
          success: true,
          data: response.data,
          summary: {
            count: response.slips_count || slips.length,
            total_amount_cents: totalAmountCents,
            formatted_total_amount: formatTZS(totalAmountCents),
            has_outstanding_bills: totalAmountCents > 0,
            oldest_slip_date: oldestSlipDate
          },
          slips: slips.map(slip => ({
            ...slip,
            formatted_remaining_amount: formatTZS(slip.totals?.remaining_cents || 0),
            formatted_created_date: formatTransactionDate(slip.created_at),
            formatted_age: formatCreditSlipAge(slip.created_at),
            days_old: isValidDate(slip.created_at) ? 
              Math.floor((Date.now() - new Date(slip.created_at).getTime()) / (1000 * 60 * 60 * 24)) : null,
            is_date_valid: isValidDate(slip.created_at)
          })),
          oldest_slip_days: oldestSlipDays
        };
      }
      
      return response;
    } catch (error) {
      return walletService.handleError(error, 'Failed to get credit slips summary');
    }
  }

  /**
   * Get wallet insights and spending patterns for the current customer
   * @param {string} [currency='TZS'] - The currency code
   * @returns {Promise<object>} Promise that resolves with wallet insights
   */
  async getMyWalletInsights(currency = 'TZS') {
    try {
      const { customerId, error } = this.resolveCustomerId();
      
      if (!customerId) {
        return {
          success: false,
          error: {
            message: error || 'Customer identification required',
            code: 'CUSTOMER_ID_MISSING',
            severity: 'error',
            requiresAuth: true
          }
        };
      }

      // Get balance and recent transaction history in parallel
      const [balanceResponse, historyResponse] = await Promise.all([
        walletService.getCustomerBalance(customerId, currency),
        walletService.getTransactionHistory(customerId, currency, 1, 10)
      ]);
      
      if (balanceResponse.success && historyResponse.success) {
        const balance = balanceResponse.balance;
        const recentTransactions = historyResponse.entries || [];
        
        // Calculate insights from transaction data
        const insights = this.calculateWalletInsights(balance, recentTransactions, currency);
        
        return {
          success: true,
          insights: {
            current_balance: {
              ...balance,
              formatted_wallet_balance: formatTZS(balance.wallet_cents || 0),
              formatted_outstanding_balance: formatTZS(balance.outstanding_cents || 0),
              formatted_net_balance: formatTZS((balance.wallet_cents || 0) - (balance.outstanding_cents || 0))
            },
            activity_summary: {
              recent_transaction_count: recentTransactions.length,
              last_transaction_date: recentTransactions[0]?.occurred_at || null,
              formatted_last_transaction_date: recentTransactions[0] ? 
                formatLastActivity(recentTransactions[0].occurred_at) : 'No recent activity',
              formatted_last_transaction_full_date: recentTransactions[0] ? 
                formatDateTime(recentTransactions[0].occurred_at) : null,
              has_recent_activity: recentTransactions.length > 0 && 
                isValidDate(recentTransactions[0]?.occurred_at)
            },
            spending_patterns: insights.patterns,
            notifications: insights.notifications,
            recommendations: insights.recommendations
          }
        };
      }
      
      // Return partial success if only one call succeeded
      if (balanceResponse.success) {
        return {
          success: true,
          insights: {
            current_balance: {
              ...balanceResponse.balance,
              formatted_wallet_balance: formatTZS(balanceResponse.balance.wallet_cents || 0),
              formatted_outstanding_balance: formatTZS(balanceResponse.balance.outstanding_cents || 0)
            },
            activity_summary: {
              recent_transaction_count: 0,
              last_transaction_date: null,
              formatted_last_transaction_date: 'No recent activity',
              formatted_last_transaction_full_date: null,
              has_recent_activity: false
            },
            spending_patterns: {},
            notifications: [],
            recommendations: []
          }
        };
      }
      
      return {
        success: false,
        error: {
          message: 'Failed to load wallet insights',
          code: 'INSIGHTS_LOAD_ERROR',
          severity: 'error'
        }
      };
    } catch (error) {
      return walletService.handleError(error, 'Failed to get wallet insights');
    }
  }

  /**
   * Calculate wallet insights from balance and transaction data
   * @param {object} balance - The customer's balance information
   * @param {Array} transactions - Recent transaction history
   * @param {string} currency - The currency code
   * @returns {object} Calculated insights, patterns, and recommendations
   */
  calculateWalletInsights(balance, transactions, currency) {
    const patterns = {};
    const notifications = [];
    const recommendations = [];

    // Calculate spending patterns if we have transaction data
    if (transactions.length > 0) {
      const totalSpent = transactions
        .filter(t => t.direction === 'DEBIT')
        .reduce((sum, t) => sum + (t.amount_cents || 0), 0);
      
      const avgTransaction = transactions.length > 0 ? totalSpent / transactions.length : 0;
      
      patterns.avg_transaction_amount = formatTZS(avgTransaction);
      patterns.recent_spending_total = formatTZS(totalSpent);
      
      // Analyze transaction frequency - only use transactions with valid dates
      const validTransactions = transactions.filter(t => isValidDate(t.occurred_at));
      
      if (validTransactions.length > 0) {
        const transactionDates = validTransactions.map(t => new Date(t.occurred_at).getDay());
        const dayFrequency = transactionDates.reduce((acc, day) => {
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {});
        
        const mostActiveDay = Object.keys(dayFrequency).reduce((a, b) => 
          dayFrequency[a] > dayFrequency[b] ? a : b
        );
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        patterns.most_active_day = dayNames[mostActiveDay] || 'Unknown';
        patterns.valid_transactions_count = validTransactions.length;
        patterns.invalid_transactions_count = transactions.length - validTransactions.length;
      } else {
        patterns.most_active_day = 'No valid transaction dates';
        patterns.valid_transactions_count = 0;
        patterns.invalid_transactions_count = transactions.length;
      }
    }

    // Generate notifications based on balance status
    if (balance.outstanding_cents > 0) {
      notifications.push({
        type: 'reminder',
        priority: 'medium',
        message: `You have outstanding bills totaling ${formatTZS(balance.outstanding_cents)}`,
        action: 'view_bills',
        actionText: 'View Bills'
      });
    }

    if (balance.wallet_cents > 50000) { // More than 500 TZS
      notifications.push({
        type: 'info',
        priority: 'low',
        message: `You have ${formatTZS(balance.wallet_cents)} available credit`,
        action: 'use_credit',
        actionText: 'Use Credit'
      });
    }

    // Generate recommendations
    if (balance.outstanding_cents > 0 && balance.wallet_cents > 0) {
      const canPayAmount = Math.min(balance.outstanding_cents, balance.wallet_cents);
      recommendations.push({
        type: 'payment',
        message: `You can pay ${formatTZS(canPayAmount)} of your outstanding bills using your wallet credit`,
        action: 'apply_wallet',
        actionText: 'Apply Wallet Credit'
      });
    }

    if (balance.wallet_cents === 0 && balance.outstanding_cents === 0) {
      recommendations.push({
        type: 'topup',
        message: 'Consider adding credit to your wallet for faster checkout',
        action: 'add_credit',
        actionText: 'Add Credit'
      });
    }

    return { patterns, notifications, recommendations };
  }

  /**
   * Format transaction description for customer-friendly display
   * @param {object} entry - The transaction entry
   * @returns {string} Formatted description
   */
  formatTransactionDescription(entry) {
    const type = entry.entry_type?.toLowerCase() || 'transaction';
    const direction = entry.direction?.toLowerCase() || '';
    
    switch (type) {
      case 'payment':
        return direction === 'credit' ? 'Payment received' : 'Payment made';
      case 'credit_slip':
        return 'Credit slip created';
      case 'wallet_application':
        return 'Wallet credit applied to bill';
      case 'change_storage':
        return 'Change stored to wallet';
      case 'refund':
        return 'Refund processed';
      default:
        return entry.description || 'Wallet transaction';
    }
  }

  /**
   * Get balance status for color coding in UI components
   * @param {object} balance - The balance object
   * @returns {object} Status information for UI styling
   */
  getBalanceStatus(balance) {
    if (!balance) {
      return {
        status: 'neutral',
        color: 'gray',
        message: 'No balance information available'
      };
    }

    const netBalance = (balance.wallet_cents || 0) - (balance.outstanding_cents || 0);
    
    if (balance.outstanding_cents > 0 && netBalance <= 0) {
      return {
        status: 'owed',
        color: 'yellow',
        message: 'You have outstanding bills to pay',
        priority: 'medium'
      };
    } else if (balance.wallet_cents > 0 && netBalance > 0) {
      return {
        status: 'credit',
        color: 'green',
        message: 'You have available wallet credit',
        priority: 'low'
      };
    } else {
      return {
        status: 'neutral',
        color: 'gray',
        message: 'Your account is balanced',
        priority: 'low'
      };
    }
  }

  /**
   * Check if customer has sufficient permissions to access wallet features
   * @returns {boolean} True if customer can access wallet features
   */
  canAccessWallet() {
    const { customerId } = this.resolveCustomerId();
    return !!customerId;
  }

  /**
   * Get customer information for display purposes
   * @returns {object} Customer display information
   */
  getCustomerInfo() {
    if (!this.currentUser) {
      return {
        name: 'Guest',
        isAuthenticated: false
      };
    }

    return {
      name: this.currentUser.name || this.currentUser.customer_name || 'Customer',
      email: this.currentUser.email || this.currentUser.customer_email || null,
      phone: this.currentUser.phone || this.currentUser.customer_phone || null,
      isAuthenticated: true,
      customerId: this.resolveCustomerId().customerId
    };
  }
}

// Export a singleton instance
export default new CustomerWalletService();