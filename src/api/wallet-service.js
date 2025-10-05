import axiosInstance from './axios.jsx';

/**
 * @class WalletService
 * @description Provides all wallet-related API calls with proper error handling.
 * This class is a singleton, and an instance is exported by default.
 */
class WalletService {
  /**
   * Create a new credit slip for items taken but not fully paid.
   * @param {object} creditSlipData - The data for the credit slip.
   * @param {string} creditSlipData.customer_id - The ID of the customer.
   * @param {Array<object>} creditSlipData.items - The items on the credit slip.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {string} slip_id - The ID of the created slip.
   * @property {string} slip_number - The number of the created slip.
   * @property {number} grand_total_cents - The total amount in cents.
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
   * Process a payment and allocate it to credit slips and/or wallet.
   * @param {object} paymentData - The payment data.
   * @param {string} paymentData.customer_id - The ID of the customer.
   * @param {number} paymentData.amount_cents - The payment amount in cents.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {string} payment_id - The ID of the created payment.
   * @property {number} applied_total - The total amount applied to slips.
   * @property {number} wallet_topup - The amount added to the wallet.
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
   * Apply wallet balance to pay down a credit slip.
   * @param {object} walletApplicationData - The wallet application data.
   * @param {string} walletApplicationData.customer_id - The ID of the customer.
   * @param {string} walletApplicationData.slip_id - The ID of the credit slip.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {number} applied_cents - The amount applied from the wallet.
   * @property {string} slip_status - The new status of the slip.
   * @property {number} remaining_slip_balance - The remaining balance of the slip.
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
   * Store customer change as wallet balance.
   * @param {object} changeData - The change data.
   * @param {string} changeData.customer_id - The ID of the customer.
   * @param {number} changeData.change_cents - The change amount in cents.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {number} wallet_added - The amount added to the wallet.
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
   * Get customer balance information.
   * @param {string} customerId - The ID of the customer.
   * @param {string} [currency='TZS'] - The currency code.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {number} balance - The customer's wallet balance.
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
   * Get customer's open credit slips.
   * @param {string} customerId - The ID of the customer.
   * @param {string} [currency='TZS'] - The currency code.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {Array<object>} slips - The list of open credit slips.
   * @property {number} slips_count - The number of open credit slips.
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
   * Get customer transaction history.
   * @param {string} customerId - The ID of the customer.
   * @param {string} [currency='TZS'] - The currency code.
   * @param {number} [page=1] - The page number.
   * @param {number} [perPage=20] - The number of items per page.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {Array<object>} entries - The list of transaction entries.
   * @property {object} pagination - The pagination information.
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
   * Get audit trail (staff only).
   * @param {object} [filters={}] - The filter options.
   * @param {number} [filters.page=1] - The page number.
   * @param {number} [filters.perPage=50] - The number of items per page.
   * @param {string} [filters.customerId] - The ID of the customer.
   * @param {string} [filters.operationType] - The type of operation.
   * @param {string} [filters.startDate] - The start date.
   * @param {string} [filters.endDate] - The end date.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {Array<object>} entries - The list of audit trail entries.
   * @property {object} pagination - The pagination information.
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
   * Search for customers by name or ID.
   * @param {string} searchTerm - The customer name or ID.
   * @param {boolean} [isId=false] - Whether the search term is an ID.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {Array<object>} customers - The list of found customers.
   * @property {number} totalFound - The total number of found customers.
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
   * Get a customer by ID.
   * @param {string} customerId - The ID of the customer.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {Array<object>} customers - The list containing the found customer.
   * @property {number} totalFound - The total number of found customers (1 if found).
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
   * Get all products for credit slip creation.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {Array<object>} items - The list of products.
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
   * Get wallet dashboard statistics.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {object} stats - The dashboard statistics.
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
   * Get customers with positive wallet balances.
   * @param {number|null} [limit=null] - The number of customers to return.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {Array<object>} customers - The list of customers with positive balance.
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
   * Get recent wallet transactions.
   * @param {number|null} [limit=null] - The number of transactions to return.
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {Array<object>} transactions - The list of recent transactions.
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
   * Handle API errors and return a standardized error response.
   * @param {Error} error - The error object.
   * @param {string} defaultMessage - The default error message.
   * @returns {object} A standardized error response.
   * @property {boolean} success - Always false for an error.
   * @property {object} error - The error details.
   * @property {string} error.message - The error message.
   * @property {string} error.code - The error code.
   * @property {string} error.severity - The severity of the error.
   * @property {boolean} error.isRetryable - Indicates if the request can be retried.
   * @property {string} error.timestamp - The timestamp of the error.
   * @property {Error} error.originalError - The original error object.
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
   * Execute an API call with retry logic.
   * @param {Function} apiCall - The API call function to execute.
   * @param {number} [maxRetries=3] - The maximum number of retries.
   * @param {number} [baseDelay=1000] - The base delay between retries in milliseconds.
   * @returns {Promise<object>} A promise that resolves with the API response.
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

// Export a singleton instance of the WalletService
export default new WalletService();