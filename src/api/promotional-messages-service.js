import axiosInstance from './axios.jsx';
import promotionalMessagesCache from '../utils/promotional-messages-cache.js';
import performanceMonitor from '../utils/promotional-messages-performance.js';

/**
 * @typedef {Object} PromotionalMessage
 * @property {string} id - Unique identifier
 * @property {string} title - Message headline
 * @property {string} content - Message body text
 * @property {'promotion'|'announcement'|'info'} type - Message type
 * @property {number} priority - Display priority (1-10)
 * @property {string} [ctaText] - Call-to-action button text
 * @property {string} [ctaUrl] - Call-to-action URL
 * @property {string} [imageUrl] - Optional promotional image
 * @property {Date} startDate - When message becomes active
 * @property {Date} [endDate] - When message expires
 * @property {string[]} [targetAudience] - User segments to target
 * @property {boolean} dismissible - Whether user can dismiss
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} PromotionalMessagesResponse
 * @property {boolean} success - Indicates if the request was successful
 * @property {Object} data - The response data
 * @property {PromotionalMessage[]} data.messages - Array of promotional messages
 * @property {number} data.totalCount - Total number of messages
 * @property {boolean} data.hasMore - Whether more messages are available
 * @property {string} [error] - Error message if request failed
 */

/**
 * @typedef {Object} DismissResponse
 * @property {boolean} success - Indicates if the request was successful
 * @property {Object} data - The response data
 * @property {string} data.messageId - ID of the dismissed message
 * @property {Date} data.dismissedAt - Timestamp when message was dismissed
 * @property {string} [error] - Error message if request failed
 */

/**
 * @typedef {Object} TrackingResponse
 * @property {boolean} success - Indicates if the request was successful
 * @property {Object} data - The response data
 * @property {string} data.messageId - ID of the tracked message
 * @property {string} data.action - Action that was tracked
 * @property {Date} data.trackedAt - Timestamp when action was tracked
 * @property {string} [error] - Error message if request failed
 */

/**
 * @class PromotionalMessagesService
 * @description Provides all promotional messages-related API calls with proper error handling and retry logic.
 * This class is a singleton, and an instance is exported by default.
 */
class PromotionalMessagesService {
  /**
   * Get active promotional messages for the current user.
   * @param {Object} [options={}] - Query options
   * @param {number} [options.limit=5] - Maximum number of messages to return
   * @param {string} [options.type] - Filter by message type ('promotion', 'announcement', 'info')
   * @param {string} [options.userId] - User ID for personalized messages
   * @param {boolean} [options.useCache=true] - Whether to use cached data if available
   * @param {number} [options.cacheTTL] - Cache TTL in milliseconds (optional)
   * @returns {Promise<PromotionalMessagesResponse>} A promise that resolves with the API response
   */
  async getActiveMessages(options = {}) {
    const { limit = 5, type, userId, useCache = true, cacheTTL } = options;
    
    // Generate cache key
    const cacheKey = promotionalMessagesCache.generateKey({ limit, type, userId });
    
    // Try to get from cache first if caching is enabled
    if (useCache) {
      const cachedData = promotionalMessagesCache.get(cacheKey);
      if (cachedData) {
        performanceMonitor.recordCacheHit();
        return {
          success: true,
          data: cachedData,
          fromCache: true
        };
      } else {
        performanceMonitor.recordCacheMiss();
      }
    }
    
    try {
      const params = {
        limit,
        active: true,
        ...(type && { type }),
        ...(userId && { user_id: userId })
      };

      performanceMonitor.recordApiCall();
      const response = await this.executeWithRetry(async () => {
        return await axiosInstance.get('/api/promotional-messages', { params });
      });

      const responseData = {
        messages: response.data.messages || [],
        totalCount: response.data.totalCount || 0,
        hasMore: response.data.hasMore || false
      };

      // Cache the response if caching is enabled
      if (useCache) {
        promotionalMessagesCache.set(cacheKey, responseData, cacheTTL);
      }

      return {
        success: true,
        data: responseData,
        fromCache: false
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch promotional messages');
    }
  }

  /**
   * Dismiss a promotional message for the current user.
   * @param {string} messageId - The ID of the message to dismiss
   * @param {string} [userId] - The ID of the user dismissing the message
   * @returns {Promise<DismissResponse>} A promise that resolves with the API response
   */
  async dismissMessage(messageId, userId = null) {
    if (!messageId) {
      return {
        success: false,
        error: {
          message: 'Message ID is required',
          code: 'VALIDATION_ERROR',
          severity: 'warning'
        }
      };
    }

    try {
      const requestData = {
        message_id: messageId,
        ...(userId && { user_id: userId })
      };

      const response = await this.executeWithRetry(async () => {
        return await axiosInstance.post('/api/promotional-messages/dismiss', requestData);
      });

      // Invalidate cache entries for this user since dismissal affects active messages
      const pattern = userId ? `messages_.*_.*_${userId}` : 'messages_.*_.*_anonymous';
      promotionalMessagesCache.invalidatePattern(pattern);

      return {
        success: true,
        data: {
          messageId: response.data.messageId || messageId,
          dismissedAt: new Date(response.data.dismissedAt || Date.now())
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to dismiss promotional message');
    }
  }

  /**
   * Track user interaction with a promotional message.
   * @param {string} messageId - The ID of the message
   * @param {string} action - The action performed ('view', 'click', 'cta_click', 'dismiss')
   * @param {Object} [metadata={}] - Additional tracking metadata
   * @param {string} [metadata.userId] - User ID for tracking
   * @param {string} [metadata.ctaUrl] - URL clicked if action is 'cta_click'
   * @param {number} [metadata.viewDuration] - Time spent viewing in seconds
   * @returns {Promise<TrackingResponse>} A promise that resolves with the API response
   */
  async trackInteraction(messageId, action, metadata = {}) {
    if (!messageId || !action) {
      return {
        success: false,
        error: {
          message: 'Message ID and action are required',
          code: 'VALIDATION_ERROR',
          severity: 'warning'
        }
      };
    }

    const validActions = ['view', 'click', 'cta_click', 'dismiss'];
    if (!validActions.includes(action)) {
      return {
        success: false,
        error: {
          message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
          code: 'VALIDATION_ERROR',
          severity: 'warning'
        }
      };
    }

    try {
      const requestData = {
        message_id: messageId,
        action,
        metadata: {
          timestamp: new Date().toISOString(),
          ...metadata
        }
      };

      // Use fire-and-forget for tracking to avoid blocking UI
      const response = await axiosInstance.post('/api/promotional-messages/track', requestData);

      return {
        success: true,
        data: {
          messageId: response.data.messageId || messageId,
          action: response.data.action || action,
          trackedAt: new Date(response.data.trackedAt || Date.now())
        }
      };
    } catch (error) {
      // Log tracking errors but don't fail the user experience
      console.warn('Promotional message tracking failed:', error);
      return {
        success: false,
        error: {
          message: 'Tracking failed but user experience continues',
          code: 'TRACKING_ERROR',
          severity: 'info'
        }
      };
    }
  }

  /**
   * Get dismissed messages for the current user (for debugging/admin purposes).
   * @param {string} [userId] - User ID to get dismissed messages for
   * @param {number} [limit=20] - Maximum number of dismissed messages to return
   * @returns {Promise<PromotionalMessagesResponse>} A promise that resolves with the API response
   */
  async getDismissedMessages(userId = null, limit = 20) {
    try {
      const params = {
        dismissed: true,
        limit,
        ...(userId && { user_id: userId })
      };

      const response = await this.executeWithRetry(async () => {
        return await axiosInstance.get('/api/promotional-messages', { params });
      });

      return {
        success: true,
        data: {
          messages: response.data.messages || [],
          totalCount: response.data.totalCount || 0,
          hasMore: response.data.hasMore || false
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch dismissed messages');
    }
  }

  /**
   * Handle API errors and return a standardized error response.
   * @param {Error} error - The error object
   * @param {string} defaultMessage - The default error message
   * @returns {Object} A standardized error response
   */
  handleError(error, defaultMessage) {
    console.error('Promotional Messages API Error:', error);

    let errorMessage = defaultMessage;
    let errorCode = 'UNKNOWN_ERROR';
    let isRetryable = false;
    let severity = 'error';

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      errorMessage = data?.message || data?.details || defaultMessage;
      errorCode = data?.code || data?.respCode || status;

      // Handle specific error codes
      switch (status) {
        case 400:
          if (data?.message?.includes('VALIDATION_ERROR')) {
            errorMessage = 'Please check your input and try again';
            errorCode = 'VALIDATION_ERROR';
            severity = 'warning';
          } else if (data?.message?.includes('MESSAGE_NOT_FOUND')) {
            errorMessage = 'Promotional message not found';
            errorCode = 'MESSAGE_NOT_FOUND';
            severity = 'warning';
          } else if (data?.message?.includes('ALREADY_DISMISSED')) {
            errorMessage = 'Message has already been dismissed';
            errorCode = 'ALREADY_DISMISSED';
            severity = 'info';
          }
          break;
        case 401:
          errorMessage = 'Your session has expired. Please log in again';
          errorCode = 'SESSION_EXPIRED';
          severity = 'error';
          break;
        case 403:
          errorMessage = 'You do not have permission to access promotional messages';
          errorCode = 'UNAUTHORIZED';
          severity = 'error';
          break;
        case 404:
          errorMessage = 'Promotional messages service not found';
          errorCode = 'SERVICE_NOT_FOUND';
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
   * Execute an API call with retry logic and exponential backoff.
   * @param {Function} apiCall - The API call function to execute
   * @param {number} [maxRetries=3] - The maximum number of retries
   * @param {number} [baseDelay=1000] - The base delay between retries in milliseconds
   * @returns {Promise<Object>} A promise that resolves with the API response
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

        // Exponential backoff with jitter to prevent thundering herd
        const jitter = Math.random() * 500; // 0-500ms jitter
        const delay = baseDelay * Math.pow(2, attempt) + jitter;
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log(`Retrying promotional messages API call (attempt ${attempt + 2}/${maxRetries + 1}) after ${Math.round(delay)}ms`);
      }
    }

    throw lastError;
  }

  /**
   * Batch dismiss multiple messages at once.
   * @param {string[]} messageIds - Array of message IDs to dismiss
   * @param {string} [userId] - User ID for the dismissals
   * @returns {Promise<Object>} A promise that resolves with batch operation results
   */
  async batchDismissMessages(messageIds, userId = null) {
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return {
        success: false,
        error: {
          message: 'Message IDs array is required and cannot be empty',
          code: 'VALIDATION_ERROR',
          severity: 'warning'
        }
      };
    }

    try {
      const requestData = {
        message_ids: messageIds,
        ...(userId && { user_id: userId })
      };

      const response = await this.executeWithRetry(async () => {
        return await axiosInstance.post('/api/promotional-messages/batch-dismiss', requestData);
      });

      return {
        success: true,
        data: {
          dismissedCount: response.data.dismissedCount || 0,
          failedIds: response.data.failedIds || [],
          dismissedAt: new Date(response.data.dismissedAt || Date.now())
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to batch dismiss promotional messages');
    }
  }

  /**
   * Check if a message has been dismissed by the user.
   * @param {string} messageId - The ID of the message to check
   * @param {string} [userId] - User ID to check dismissal for
   * @returns {Promise<Object>} A promise that resolves with dismissal status
   */
  async isMessageDismissed(messageId, userId = null) {
    if (!messageId) {
      return {
        success: false,
        error: {
          message: 'Message ID is required',
          code: 'VALIDATION_ERROR',
          severity: 'warning'
        }
      };
    }

    try {
      const params = {
        message_id: messageId,
        ...(userId && { user_id: userId })
      };

      const response = await axiosInstance.get('/api/promotional-messages/dismissal-status', { params });

      return {
        success: true,
        data: {
          messageId,
          isDismissed: response.data.isDismissed || false,
          dismissedAt: response.data.dismissedAt ? new Date(response.data.dismissedAt) : null
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to check message dismissal status');
    }
  }

  /**
   * Cache management methods
   */

  /**
   * Clear all cached promotional messages data
   */
  clearCache() {
    promotionalMessagesCache.clear();
  }

  /**
   * Get cache statistics for debugging/monitoring
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return promotionalMessagesCache.getStats();
  }

  /**
   * Preload messages into cache
   * @param {Object} options - Same options as getActiveMessages
   * @returns {Promise<Object>} Preloaded data
   */
  async preloadMessages(options = {}) {
    const cacheKey = promotionalMessagesCache.generateKey(options);
    
    return await promotionalMessagesCache.preload(
      cacheKey,
      () => this.getActiveMessages({ ...options, useCache: false }).then(response => response.data),
      options.cacheTTL
    );
  }

  /**
   * Invalidate cache for specific user or all users
   * @param {string} [userId] - User ID to invalidate cache for (optional)
   */
  invalidateCache(userId = null) {
    if (userId) {
      const pattern = `messages_.*_.*_${userId}`;
      promotionalMessagesCache.invalidatePattern(pattern);
    } else {
      promotionalMessagesCache.clear();
    }
  }
}

// Export a singleton instance of the PromotionalMessagesService
export default new PromotionalMessagesService();