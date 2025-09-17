import axiosInstance from './axios.jsx';

/**
 * Wallet API Service
 * Provides all wallet-related API calls with proper error handling
 */

class WalletService {
  /**
   * Create a new credit slip for items taken but not fully paid
   * @param {Object} creditSlipData - Credit slip data
   * @returns {Promise} API response
   */
  async createCreditSlip(creditSlipData) {
    try {
      const response = await axiosInstance.post('/api/wallet/credit-slips', creditSlipData);
      return {
        success: true,
        data: response.data,
        slip_id: response.data.slip_id,
        slip_number: response.data.slip_number,
        grand_total_cents: response.data.grand_total_cents
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create credit slip');
    }
  }

  /**
   * Process a payment and allocate it to credit slips and/or wallet
   * @param {Object} paymentData - Payment data
   * @returns {Promise} API response
   */
  async processPayment(paymentData) {
    try {
      const response = await axiosInstance.post('/api/wallet/payments', paymentData);
      return {
        success: true,
        data: response.data,
        payment_id: response.data.payment_id,
        applied_total: response.data.applied_total,
        wallet_topup: response.data.wallet_topup
      };
    } catch (error) {
      return this.handleError(error, 'Failed to process payment');
    }
  }

  /**
   * Apply wallet balance to pay down a credit slip
   * @param {Object} walletApplicationData - Wallet application data
   * @returns {Promise} API response
   */
  async applyWalletToSlip(walletApplicationData) {
    try {
      const response = await axiosInstance.post('/api/wallet/apply-wallet', walletApplicationData);
      return {
        success: true,
        data: response.data,
        applied_cents: response.data.applied_cents,
        slip_status: response.data.slip_status,
        remaining_slip_balance: response.data.remaining_slip_balance
      };
    } catch (error) {
      return this.handleError(error, 'Failed to apply wallet to slip');
    }
  }

  /**
   * Store customer change as wallet balance
   * @param {Object} changeData - Change data
   * @returns {Promise} API response
   */
  async storeChange(changeData) {
    try {
      const response = await axiosInstance.post('/api/wallet/store-change', changeData);
      return {
        success: true,
        data: response.data,
        wallet_added: response.data.wallet_added
      };
    } catch (error) {
      return this.handleError(error, 'Failed to store change');
    }
  }

  /**
   * Get customer balance information
   * @param {string} customerId - Customer ID
   * @param {string} currency - Currency code (optional, defaults to TZS)
   * @returns {Promise} API response
   */
  async getCustomerBalance(customerId, currency = 'TZS') {
    try {
      const params = currency ? { currency } : {};
      const response = await axiosInstance.get(`/api/wallet/balance/${customerId}`, { params });
      return {
        success: true,
        data: response.data,
        balance: response.data.balance
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get customer balance');
    }
  }

  /**
   * Get customer's open credit slips
   * @param {string} customerId - Customer ID
   * @param {string} currency - Currency code (optional)
   * @returns {Promise} API response
   */
  async getOpenCreditSlips(customerId, currency = 'TZS') {
    try {
      const params = currency ? { currency } : {};
      const response = await axiosInstance.get(`/api/wallet/slips/${customerId}`, { params });
      return {
        success: true,
        data: response.data,
        slips: response.data.slips,
        slips_count: response.data.slips_count
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get open credit slips');
    }
  }

  /**
   * Get customer transaction history
   * @param {string} customerId - Customer ID
   * @param {string} currency - Currency code
   * @param {number} page - Page number (default: 1)
   * @param {number} perPage - Items per page (default: 20)
   * @returns {Promise} API response
   */
  async getTransactionHistory(customerId, currency = 'TZS', page = 1, perPage = 20) {
    try {
      const params = { currency, page, per_page: perPage };
      const response = await axiosInstance.get(`/api/wallet/history/${customerId}`, { params });
      return {
        success: true,
        data: response.data,
        entries: response.data.entries,
        pagination: response.data.pagination
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get transaction history');
    }
  }

  /**
   * Get audit trail (staff only)
   * @param {Object} filters - Filter options
   * @returns {Promise} API response
   */
  async getAuditTrail(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        per_page: filters.perPage || 50,
        ...(filters.customerId && { customer_id: filters.customerId }),
        ...(filters.operationType && { operation_type: filters.operationType }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate })
      };

      const response = await axiosInstance.get('/api/wallet/audit-trail', { params });
      return {
        success: true,
        data: response.data,
        entries: response.data.entries,
        pagination: response.data.pagination
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get audit trail');
    }
  }

  /**
   * Search for customers by name or ID
   * @param {string} searchTerm - Customer name or ID
   * @param {boolean} isId - Whether the search term is an ID
   * @returns {Promise} API response
   */
  async searchCustomer(searchTerm, isId = false) {
    try {
      // If searching by ID, use the getCustomerById method instead
      if (isId) {
        return this.getCustomerById(searchTerm);
      }
      
      const response = await axiosInstance.get(`/api/customers/search?name=${searchTerm}`);
      
      // Check if the response contains customers array with results
      if (response.data && response.data.customers && response.data.customers.length > 0) {
        return {
          success: true,
          data: response.data,
          customers: response.data.customers, // Return all customers
          totalFound: response.data.customers.length
        };
      } else {
        return {
          success: false,
          error: {
            message: 'No customers found',
            code: 'CUSTOMER_NOT_FOUND',
            severity: 'warning'
          }
        };
      }
    } catch (error) {
      console.error('Customer search error:', error);
      return this.handleError(error, 'Failed to search customer');
    }
  }
  
  /**
   * Get a customer by ID
   * @param {string} customerId - Customer ID
   * @returns {Promise} API response
   */
  async getCustomerById(customerId) {
    try {
      // Use the receipts search endpoint with customer_id parameter
      const response = await axiosInstance.get(`/api/receipts/search?customer_id=${customerId}`);
      
      // Extract customer data from the first receipt if available
      if (response.data && response.data.receipts && response.data.receipts.length > 0) {
        const firstReceipt = response.data.receipts[0];
        const customer = {
          customer_id: firstReceipt.customer_id,
          name: firstReceipt.customer_name,
          phone_number: firstReceipt.customer_phone,
          email: firstReceipt.customer_email || null
        };
        
        return {
          success: true,
          data: { customer },
          customers: [customer],  
          totalFound: 1
        };
      } else {
        return {
          success: false,
          error: {
            message: 'Customer not found',
            code: 'CUSTOMER_NOT_FOUND',
            severity: 'warning'
          }
        };
      }
    } catch (error) {
      console.error('Get customer by ID error:', error);
      return this.handleError(error, 'Failed to get customer details');
    }
  }

  /**
   * Get all products for credit slip creation
   * @returns {Promise} API response
   */
  async getAllProducts() {
    try {
      const response = await axiosInstance.get('/api/products/all');
      return {
        success: true,
        data: response.data,
        items: response.data.respBody?.items || []
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get products');
    }
  }

  /**
   * Get wallet dashboard statistics
   * @returns {Promise} API response with dashboard stats
   */
  async getWalletStats() {
    try {
      const response = await axiosInstance.get('/api/wallet/dashboard/stats');
      return {
        success: true,
        data: response.data,
        stats: response.data.stats
      };
    } catch (error) {
      return this.handleError(error, 'Failed to load wallet statistics');
    }
  }

  /**
   * Get customers with positive wallet balances
   * @param {number} limit - Number of customers to return (optional)
   * @returns {Promise} API response with customers
   */
  async getCustomersWithBalance(limit = null) {
    try {
      const params = limit ? { limit } : {};
      const response = await axiosInstance.get('/api/wallet/customers-with-balance', { params });
      return {
        success: true,
        data: response.data,
        customers: response.data.customers
      };
    } catch (error) {
      return this.handleError(error, 'Failed to load customers with balance');
    }
  }

  /**
   * Get recent wallet transactions
   * @param {number} limit - Number of transactions to return (optional)
   * @returns {Promise} API response with transactions
   */
  async getRecentTransactions(limit = null) {
    try {
      const params = limit ? { limit } : {};
      const response = await axiosInstance.get('/api/wallet/transactions/recent', { params });
      return {
        success: true,
        data: response.data,
        transactions: response.data.transactions
      };
    } catch (error) {
      return this.handleError(error, 'Failed to load recent transactions');
    }
  }

  /**
   * Handle API errors and return standardized error response
   * @param {Error} error - The error object
   * @param {string} defaultMessage - Default error message
   * @returns {Object} Standardized error response
   */
  handleError(error, defaultMessage) {
    console.error('Wallet API Error:', error);

    let errorMessage = defaultMessage;
    let errorCode = 'UNKNOWN_ERROR';
    let isRetryable = false;
    let severity = 'error';

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      errorMessage = data?.message || data?.details || defaultMessage;
      errorCode = data?.respCode || status;

      // Handle specific error codes
      switch (status) {
        case 400:
          if (data?.message?.includes('INSUFFICIENT_WALLET_BALANCE')) {
            errorMessage = 'Insufficient wallet balance for this operation';
            errorCode = 'INSUFFICIENT_BALANCE';
            severity = 'warning';
          } else if (data?.message?.includes('VALIDATION_ERROR')) {
            errorMessage = 'Please check your input and try again';
            errorCode = 'VALIDATION_ERROR';
            severity = 'warning';
          } else if (data?.message?.includes('INVALID_SLIP_STATUS')) {
            errorMessage = 'Cannot modify this credit slip (already closed or void)';
            errorCode = 'INVALID_SLIP_STATUS';
            severity = 'warning';
          }
          break;
        case 401:
          errorMessage = 'Your session has expired. Please log in again';
          errorCode = 'SESSION_EXPIRED';
          severity = 'error';
          break;
        case 404:
          if (data?.message?.includes('CUSTOMER_ACCOUNT_NOT_FOUND')) {
            errorMessage = 'Customer not found';
            errorCode = 'CUSTOMER_NOT_FOUND';
            severity = 'warning';
          } else if (data?.message?.includes('CREDIT_SLIP_NOT_FOUND')) {
            errorMessage = 'Credit slip not found';
            errorCode = 'SLIP_NOT_FOUND';
            severity = 'warning';
          }
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action';
          errorCode = 'UNAUTHORIZED';
          severity = 'error';
          break;
        case 409:
          errorMessage = 'This transaction has already been processed';
          errorCode = 'DUPLICATE_TRANSACTION';
          severity = 'warning';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait a moment and try again';
          errorCode = 'RATE_LIMITED';
          isRetryable = true;
          severity = 'warning';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'Server error. Please try again later';
          errorCode = 'SERVER_ERROR';
          isRetryable = true;
          severity = 'error';
          break;
      }
    } else if (error.request) {
      // Network error
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection and try again';
        errorCode = 'TIMEOUT_ERROR';
      } else {
        errorMessage = 'Network error. Please check your connection';
        errorCode = 'NETWORK_ERROR';
      }
      isRetryable = true;
      severity = 'error';
    } else if (error.message) {
      // JavaScript error
      errorMessage = error.message;
      errorCode = 'CLIENT_ERROR';
      severity = 'error';
    }

    return {
      success: false,
      error: {
        message: errorMessage,
        code: errorCode,
        severity,
        isRetryable,
        timestamp: new Date().toISOString(),
        originalError: error
      }
    };
  }

  /**
   * Execute API call with retry logic
   * @param {Function} apiCall - The API call function
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay between retries in ms
   * @returns {Promise} API response
   */
  async executeWithRetry(apiCall, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;

        // Don't retry on non-retryable errors
        const errorResponse = this.handleError(error, 'Operation failed');
        if (!errorResponse.error.isRetryable || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log(`Retrying API call (attempt ${attempt + 2}/${maxRetries + 1}) after ${delay}ms`);
      }
    }

    throw lastError;
  }
}

// Export singleton instance
export default new WalletService();