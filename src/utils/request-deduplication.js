/**
 * @fileoverview Request deduplication utility to prevent duplicate API calls
 * and manage concurrent requests efficiently.
 */

/**
 * Request deduplication manager
 */
class RequestDeduplicator {
  constructor() {
    // Map to store pending requests by key
    this.pendingRequests = new Map();
    // Map to store request metadata
    this.requestMetadata = new Map();
    // Statistics for monitoring
    this.stats = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      completedRequests: 0,
      failedRequests: 0
    };
  }

  /**
   * Generate a unique key for request deduplication
   * @param {string} endpoint - The API endpoint
   * @param {Object} params - Request parameters
   * @param {string} method - HTTP method
   * @returns {string} Unique request key
   */
  generateRequestKey(endpoint, params = {}, method = 'GET') {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        // Only include serializable parameters
        if (params[key] !== undefined && params[key] !== null) {
          result[key] = params[key];
        }
        return result;
      }, {});
    
    const keyData = {
      method: method.toUpperCase(),
      endpoint,
      params: sortedParams
    };
    
    return `req_${btoa(JSON.stringify(keyData))}`;
  }

  /**
   * Execute a request with deduplication
   * @param {string} key - Request key for deduplication
   * @param {Function} requestFunction - Function that returns a Promise for the actual request
   * @param {Object} options - Options for request handling
   * @param {number} options.timeout - Request timeout in milliseconds
   * @param {AbortSignal} options.signal - Abort signal for cancellation
   * @returns {Promise} Promise that resolves with the request result
   */
  async executeRequest(key, requestFunction, options = {}) {
    const { timeout = 30000, signal } = options;
    
    this.stats.totalRequests++;
    
    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      this.stats.deduplicatedRequests++;
      console.log(`🔄 Request deduplicated: ${key}`);
      
      // Return the existing promise
      const existingRequest = this.pendingRequests.get(key);
      
      // If the existing request has an abort signal and the new request also has one,
      // we need to handle cancellation properly
      if (signal) {
        return this.handleSignalForExistingRequest(existingRequest, signal);
      }
      
      return existingRequest.promise;
    }

    // Create a new request with metadata
    const requestMetadata = {
      key,
      startTime: Date.now(),
      timeout,
      abortController: new AbortController(),
      subscribers: []
    };

    // If a signal is provided, forward cancellation
    if (signal) {
      const forwardCancellation = () => {
        requestMetadata.abortController.abort();
      };
      
      if (signal.aborted) {
        // Signal is already aborted
        requestMetadata.abortController.abort();
      } else {
        signal.addEventListener('abort', forwardCancellation, { once: true });
      }
    }

    // Create the actual request promise
    const requestPromise = this.createRequestPromise(
      requestFunction,
      requestMetadata,
      timeout
    );

    // Store the request
    const requestInfo = {
      promise: requestPromise,
      metadata: requestMetadata
    };
    
    this.pendingRequests.set(key, requestInfo);
    this.requestMetadata.set(key, requestMetadata);

    // Clean up when request completes (success or failure)
    requestPromise
      .then(() => {
        this.stats.completedRequests++;
        console.log(`✅ Request completed: ${key}`);
      })
      .catch((error) => {
        this.stats.failedRequests++;
        console.log(`❌ Request failed: ${key}`, error.message);
      })
      .finally(() => {
        this.cleanupRequest(key);
      });

    return requestPromise;
  }

  /**
   * Create a request promise with timeout and cancellation handling
   * @param {Function} requestFunction - The actual request function
   * @param {Object} metadata - Request metadata
   * @param {number} timeout - Request timeout
   * @returns {Promise} The request promise
   */
  async createRequestPromise(requestFunction, metadata, timeout) {
    const { abortController } = metadata;
    
    return new Promise(async (resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        abortController.abort();
        const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        timeoutError.name = 'TimeoutError';
        timeoutError.code = 'REQUEST_TIMEOUT';
        reject(timeoutError);
      }, timeout);

      // Set up abort handling
      const abortHandler = () => {
        clearTimeout(timeoutId);
        const abortError = new Error('Request was cancelled');
        abortError.name = 'AbortError';
        abortError.code = 'REQUEST_CANCELLED';
        reject(abortError);
      };

      if (abortController.signal.aborted) {
        abortHandler();
        return;
      }

      abortController.signal.addEventListener('abort', abortHandler, { once: true });

      try {
        // Execute the actual request
        const result = await requestFunction(abortController.signal);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Handle signal forwarding for existing requests
   * @param {Object} existingRequest - The existing request info
   * @param {AbortSignal} newSignal - The new abort signal
   * @returns {Promise} Promise that handles the signal properly
   */
  async handleSignalForExistingRequest(existingRequest, newSignal) {
    return new Promise((resolve, reject) => {
      // If the new signal is already aborted, reject immediately
      if (newSignal.aborted) {
        const abortError = new Error('Request was cancelled');
        abortError.name = 'AbortError';
        abortError.code = 'REQUEST_CANCELLED';
        reject(abortError);
        return;
      }

      // Set up cancellation for the new signal
      const cancelHandler = () => {
        const abortError = new Error('Request was cancelled');
        abortError.name = 'AbortError';
        abortError.code = 'REQUEST_CANCELLED';
        reject(abortError);
      };

      newSignal.addEventListener('abort', cancelHandler, { once: true });

      // Forward the existing request result
      existingRequest.promise
        .then(resolve)
        .catch(reject)
        .finally(() => {
          newSignal.removeEventListener('abort', cancelHandler);
        });
    });
  }

  /**
   * Clean up completed request
   * @param {string} key - Request key
   */
  cleanupRequest(key) {
    this.pendingRequests.delete(key);
    this.requestMetadata.delete(key);
  }

  /**
   * Cancel a specific request
   * @param {string} key - Request key to cancel
   */
  cancelRequest(key) {
    const requestInfo = this.pendingRequests.get(key);
    if (requestInfo) {
      requestInfo.metadata.abortController.abort();
      console.log(`🚫 Request cancelled: ${key}`);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    const keys = Array.from(this.pendingRequests.keys());
    keys.forEach(key => this.cancelRequest(key));
    console.log(`🚫 Cancelled ${keys.length} pending requests`);
  }

  /**
   * Get information about pending requests
   * @returns {Array} Array of pending request information
   */
  getPendingRequests() {
    return Array.from(this.pendingRequests.entries()).map(([key, requestInfo]) => ({
      key,
      startTime: requestInfo.metadata.startTime,
      duration: Date.now() - requestInfo.metadata.startTime,
      timeout: requestInfo.metadata.timeout
    }));
  }

  /**
   * Get deduplication statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      pendingCount: this.pendingRequests.size,
      deduplicationRate: this.stats.totalRequests > 0 
        ? this.stats.deduplicatedRequests / this.stats.totalRequests 
        : 0
    };
  }

  /**
   * Clear all pending requests and reset state
   */
  reset() {
    this.cancelAllRequests();
    this.pendingRequests.clear();
    this.requestMetadata.clear();
    this.stats = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      completedRequests: 0,
      failedRequests: 0
    };
    console.log('🔄 Request deduplicator reset');
  }
}

// Create and export singleton instance
const requestDeduplicator = new RequestDeduplicator();

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    requestDeduplicator.cancelAllRequests();
  });
}

export default requestDeduplicator;