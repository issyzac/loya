import axiosInstance from './axios.jsx';
import { 
  processError, 
  trackOperationPerformance, 
  handleGracefulDegradation,
  ERROR_CATEGORIES 
} from '../utils/error-logger.js';
import apiCache from '../utils/api-cache.js';
import requestDeduplicator from '../utils/request-deduplication.js';
import performanceMonitor from '../utils/performance-monitor.js';

/**
 * @class OrdersService
 * @description Provides all orders-related API calls with comprehensive error handling and logging.
 * This class is a singleton, and an instance is exported by default.
 */
class OrdersService {
  /**
   * Get customer's open orders/pending bills with caching and deduplication.
   * @param {string} customerId - The ID of the customer.
   * @param {string} [currency='TZS'] - The currency code.
   * @param {number} [page=1] - The page number.
   * @param {number} [perPage=20] - The number of items per page.
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation.
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.useCache=true] - Whether to use caching
   * @param {number} [options.cacheTtl] - Custom cache TTL in milliseconds
   * @param {boolean} [options.forceRefresh=false] - Force refresh bypassing cache
   * @returns {Promise<object>} A promise that resolves with the API response.
   * @property {boolean} success - Indicates if the request was successful.
   * @property {object} data - The response data.
   * @property {Array<object>} orders - The list of open orders.
   * @property {object} pagination - The pagination information.
   * @property {boolean} fromCache - Whether the data came from cache.
   */
  async getCustomerOpenOrders(customerId, currency = 'TZS', page = 1, perPage = 20, signal = null, options = {}) {
    const { 
      useCache = true, 
      cacheTtl = 5 * 60 * 1000, // 5 minutes default
      forceRefresh = false 
    } = options;
    
    const startTime = performance.now();
    const operationContext = {
      operation: 'getCustomerOpenOrders',
      customerId: customerId ? '[REDACTED]' : null,
      currency,
      page,
      perPage,
      hasSignal: !!signal,
      useCache,
      forceRefresh
    };

    try {
      console.log(`Fetching open orders for customer: ${customerId ? '[REDACTED]' : 'null'}`);
      
      if (!customerId) {
        const error = new Error('Customer ID is required');
        error.code = 'MISSING_CUSTOMER_ID';
        throw error;
      }

      const endpoint = `/api/customers/${customerId}/open-orders`;
      const params = { 
        currency, 
        page, 
        per_page: perPage 
      };

      // Generate cache key
      const cacheKey = apiCache.generateKey(endpoint, params);
      
      // Check cache first (unless force refresh is requested)
      if (useCache && !forceRefresh) {
        const cacheStartTime = performance.now();
        const cachedData = apiCache.get(cacheKey);
        if (cachedData) {
          const cacheTime = performance.now() - cacheStartTime;
          console.log('📦 Using cached data for open orders');
          
          // Record cache hit performance
          performanceMonitor.recordCacheHit(cacheKey, cacheTime);
          performanceMonitor.recordApiCall(endpoint, performance.now() - startTime, true, true);
          
          trackOperationPerformance('getCustomerOpenOrders', startTime, true);
          return {
            ...cachedData,
            fromCache: true
          };
        } else {
          // Record cache miss
          performanceMonitor.recordCacheMiss(cacheKey);
        }
      }

      // Generate request key for deduplication
      const requestKey = requestDeduplicator.generateRequestKey(endpoint, params, 'GET');
      
      // Execute request with deduplication
      const result = await requestDeduplicator.executeRequest(
        requestKey,
        async (requestSignal) => {
          const config = { params };
          
          // Combine signals if both are provided
          if (signal || requestSignal) {
            const combinedController = new AbortController();
            
            const abortHandler = () => combinedController.abort();
            
            if (signal) {
              if (signal.aborted) {
                combinedController.abort();
              } else {
                signal.addEventListener('abort', abortHandler);
              }
            }
            
            if (requestSignal) {
              if (requestSignal.aborted) {
                combinedController.abort();
              } else {
                requestSignal.addEventListener('abort', abortHandler);
              }
            }
            
            config.signal = combinedController.signal;
          }

          const response = await axiosInstance.get(endpoint, config);
          
          console.log('Open orders API response:', {
            status: response.status,
            ordersCount: response.data?.orders?.length || 0,
            pagination: response.data?.pagination
          });

          const result = {
            success: true,
            data: response.data,
            orders: response.data.orders || [],
            pagination: response.data.pagination || {
              current_page: page,
              per_page: perPage,
              total_orders: 0,
              total_pages: 0
            },
            fromCache: false
          };

          // Cache successful response
          if (useCache && result.success) {
            apiCache.set(cacheKey, result, cacheTtl, {
              endpoint,
              customerId: '[REDACTED]',
              timestamp: Date.now(),
              ordersCount: result.orders.length
            });
          }

          // Record API call performance
          const totalTime = performance.now() - startTime;
          performanceMonitor.recordApiCall(endpoint, totalTime, true, false);

          return result;
        },
        {
          timeout: 30000,
          signal
        }
      );
      
      // Track successful operation
      trackOperationPerformance('getCustomerOpenOrders', startTime, true);
      
      return result;
    } catch (error) {
      // Track failed operation
      trackOperationPerformance('getCustomerOpenOrders', startTime, false, error);
      
      // Process error with comprehensive logging and categorization
      const processedError = processError(error, operationContext, 'Failed to load pending bills');
      
      return {
        success: false,
        error: processedError,
        fromCache: false
      };
    }
  }

  /**
   * Get customer's open orders with retry logic and caching.
   * @param {string} customerId - The ID of the customer.
   * @param {string} [currency='TZS'] - The currency code.
   * @param {number} [page=1] - The page number.
   * @param {number} [perPage=20] - The number of items per page.
   * @param {number} [maxRetries=3] - The maximum number of retries.
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation.
   * @param {Object} [options] - Additional options for caching and performance
   * @returns {Promise<object>} A promise that resolves with the API response.
   */
  async getCustomerOpenOrdersWithRetry(customerId, currency = 'TZS', page = 1, perPage = 20, maxRetries = 3, signal = null, options = {}) {
    const startTime = performance.now();
    const operationContext = {
      operation: 'getCustomerOpenOrdersWithRetry',
      customerId: customerId ? '[REDACTED]' : null,
      currency,
      page,
      perPage,
      maxRetries,
      hasSignal: !!signal
    };

    try {
      const result = await this.executeWithRetry(
        () => this.getCustomerOpenOrders(customerId, currency, page, perPage, signal, options),
        maxRetries,
        1000,
        signal
      );
      
      // Track successful retry operation
      trackOperationPerformance('getCustomerOpenOrdersWithRetry', startTime, true);
      return result;
    } catch (error) {
      // Track failed retry operation
      trackOperationPerformance('getCustomerOpenOrdersWithRetry', startTime, false, error);
      
      // Process error with comprehensive logging
      const processedError = processError(error, operationContext, 'Failed to load pending bills after retries');
      
      return {
        success: false,
        error: processedError,
        fromCache: false
      };
    }
  }

  /**
   * Handle API errors and return a standardized error response.
   * @deprecated Use processError from error-logger instead for comprehensive error handling
   * @param {Error} error - The error object.
   * @param {string} defaultMessage - The default error message.
   * @returns {object} A standardized error response.
   */
  handleError(error, defaultMessage) {
    // Use the new comprehensive error processing
    const processedError = processError(error, { 
      service: 'OrdersService',
      method: 'handleError' 
    }, defaultMessage);
    
    return {
      success: false,
      error: processedError
    };
  }

  /**
   * Execute an API call with retry logic.
   * @param {Function} apiCall - The API call function to execute.
   * @param {number} [maxRetries=3] - The maximum number of retries.
   * @param {number} [baseDelay=1000] - The base delay between retries in milliseconds.
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation.
   * @returns {Promise<object>} A promise that resolves with the API response.
   */
  async executeWithRetry(apiCall, maxRetries = 3, baseDelay = 1000, signal = null) {
    let lastError;
    const retryContext = {
      operation: 'executeWithRetry',
      maxRetries,
      baseDelay,
      hasSignal: !!signal
    };

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check if request was cancelled before making the call
        if (signal && signal.aborted) {
          const cancelError = new Error('Request was cancelled');
          cancelError.name = 'AbortError';
          throw cancelError;
        }

        const result = await apiCall();
        
        // Log successful retry if this wasn't the first attempt
        if (attempt > 0) {
          console.log(`✅ Retry successful on attempt ${attempt + 1}/${maxRetries + 1}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;

        // Don't retry if request was cancelled
        if (signal && signal.aborted) {
          const cancelError = new Error('Request was cancelled');
          cancelError.name = 'AbortError';
          throw cancelError;
        }

        // Process error to determine if it's retryable
        const processedError = processError(error, {
          ...retryContext,
          attempt: attempt + 1,
          isRetry: attempt > 0
        }, 'Operation failed');

        // Don't retry on non-retryable errors or if we've exhausted retries
        if (!processedError.isRetryable || attempt === maxRetries) {
          console.log(`❌ Not retrying: ${processedError.isRetryable ? 'Max retries reached' : 'Non-retryable error'}`);
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000;
        const delay = exponentialDelay + jitter;
        
        console.log(`🔄 Retrying orders API call (attempt ${attempt + 2}/${maxRetries + 1}) after ${Math.round(delay)}ms. Error: ${processedError.message}`);
        
        // Create a cancellable delay
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(resolve, delay);
          
          if (signal) {
            const abortHandler = () => {
              clearTimeout(timeoutId);
              const cancelError = new Error('Request was cancelled during retry delay');
              cancelError.name = 'AbortError';
              reject(cancelError);
            };
            
            if (signal.aborted) {
              clearTimeout(timeoutId);
              const cancelError = new Error('Request was cancelled during retry delay');
              cancelError.name = 'AbortError';
              reject(cancelError);
              return;
            }
            
            signal.addEventListener('abort', abortHandler, { once: true });
          }
        });
      }
    }

    throw lastError;
  }

  /**
   * Invalidate cache for a specific customer's orders
   * @param {string} customerId - The customer ID
   */
  invalidateCustomerCache(customerId) {
    if (!customerId) return;
    
    try {
      // Create pattern to match all cache entries for this customer
      const pattern = new RegExp(`api/customers/${customerId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/open-orders`);
      apiCache.invalidateByPattern(pattern);
      console.log(`📦 Invalidated cache for customer: ${customerId ? '[REDACTED]' : 'null'}`);
    } catch (error) {
      console.warn('Error invalidating customer cache:', error);
    }
  }

  /**
   * Invalidate all orders cache
   */
  invalidateAllOrdersCache() {
    try {
      const pattern = /open-orders/;
      apiCache.invalidateByPattern(pattern);
      console.log('📦 Invalidated all orders cache');
    } catch (error) {
      console.warn('Error invalidating all orders cache:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache and request statistics
   */
  getCacheStats() {
    return {
      cache: apiCache.getStats(),
      requests: requestDeduplicator.getStats()
    };
  }

  /**
   * Clear all cache and pending requests
   */
  clearCache() {
    try {
      apiCache.clear();
      requestDeduplicator.cancelAllRequests();
      console.log('📦 Cleared all cache and cancelled pending requests');
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  /**
   * Smart cache invalidation based on data freshness
   * @param {string} customerId - The customer ID
   * @param {Object} [options] - Invalidation options
   */
  smartInvalidateCustomerCache(customerId, options = {}) {
    if (!customerId) return;
    
    const { maxAge = 5 * 60 * 1000 } = options; // 5 minutes default
    
    try {
      const endpoint = `/api/customers/${customerId}/open-orders`;
      const params = { currency: 'TZS', page: 1, per_page: 20 };
      const cacheKey = apiCache.generateKey(endpoint, params);
      
      // Check if cached data exists and its age
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        // Only invalidate if data is older than maxAge
        const cacheStats = apiCache.getStats();
        console.log(`🧠 Smart invalidation: Cache exists, evaluating freshness`);
        this.invalidateCustomerCache(customerId, { immediate: false });
      } else {
        console.log(`🧠 Smart invalidation: No cached data found`);
      }
    } catch (error) {
      console.warn('Error in smart cache invalidation:', error);
      // Fallback to regular invalidation
      this.invalidateCustomerCache(customerId);
    }
  }

  /**
   * Preload customer orders (for performance optimization)
   * @param {string} customerId - The customer ID
   * @param {Object} [options] - Preload options
   * @returns {Promise<void>}
   */
  async preloadCustomerOrders(customerId, options = {}) {
    if (!customerId) return;
    
    try {
      console.log(`🚀 Preloading orders for customer: ${customerId ? '[REDACTED]' : 'null'}`);
      
      // Check if data is already cached and fresh
      const endpoint = `/api/customers/${customerId}/open-orders`;
      const params = { currency: 'TZS', page: 1, per_page: 20 };
      const cacheKey = apiCache.generateKey(endpoint, params);
      const cachedData = apiCache.get(cacheKey);
      
      if (cachedData) {
        console.log('📦 Preload skipped - data already cached');
        return;
      }
      
      // Preload with longer cache TTL for better performance
      await this.getCustomerOpenOrders(customerId, 'TZS', 1, 20, null, {
        useCache: true,
        cacheTtl: 10 * 60 * 1000, // 10 minutes for preloaded data
        ...options
      });
      
      console.log('✅ Preload completed');
    } catch (error) {
      console.warn('Preload failed:', error.message);
      // Don't throw - preloading is optional
    }
  }

  /**
   * Warm cache for multiple customers (batch preloading)
   * @param {string[]} customerIds - Array of customer IDs
   * @param {Object} [options] - Preload options
   * @returns {Promise<void>}
   */
  async warmCache(customerIds, options = {}) {
    if (!Array.isArray(customerIds) || customerIds.length === 0) return;
    
    console.log(`🔥 Warming cache for ${customerIds.length} customers`);
    
    // Limit concurrent requests to prevent overwhelming the server
    const concurrencyLimit = 3;
    const chunks = [];
    
    for (let i = 0; i < customerIds.length; i += concurrencyLimit) {
      chunks.push(customerIds.slice(i, i + concurrencyLimit));
    }
    
    for (const chunk of chunks) {
      const preloadPromises = chunk.map(customerId => 
        this.preloadCustomerOrders(customerId, options).catch(error => {
          console.warn(`Cache warming failed for customer ${customerId ? '[REDACTED]' : 'null'}:`, error.message);
        })
      );
      
      await Promise.all(preloadPromises);
      
      // Small delay between chunks to be respectful to the server
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('✅ Cache warming completed');
  }
}

// Export a singleton instance of the OrdersService
export default new OrdersService();