/**
 * @fileoverview API Cache utility for managing session-based caching, request deduplication,
 * and cache invalidation strategies for API responses.
 */

/**
 * Cache configuration constants
 */
const CACHE_CONFIG = {
  // Default cache TTL in milliseconds (5 minutes)
  DEFAULT_TTL: 5 * 60 * 1000,
  // Maximum cache size (number of entries)
  MAX_CACHE_SIZE: 100,
  // Cache key prefix
  KEY_PREFIX: 'api_cache_',
  // Storage type
  STORAGE_TYPE: 'sessionStorage'
};

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {any} data - The cached data
 * @property {number} timestamp - When the data was cached
 * @property {number} ttl - Time to live in milliseconds
 * @property {string} key - The cache key
 * @property {Object} metadata - Additional metadata about the cached data
 */

/**
 * API Cache class for managing cached API responses
 */
class ApiCache {
  constructor() {
    this.memoryCache = new Map();
    this.pendingRequests = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  /**
   * Generate a cache key from parameters
   * @param {string} endpoint - The API endpoint
   * @param {Object} params - Request parameters
   * @returns {string} The cache key
   */
  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    const paramString = JSON.stringify(sortedParams);
    return `${CACHE_CONFIG.KEY_PREFIX}${endpoint}_${btoa(paramString)}`;
  }

  /**
   * Get data from cache
   * @param {string} key - The cache key
   * @returns {any|null} The cached data or null if not found/expired
   */
  get(key) {
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValidEntry(memoryEntry)) {
        this.cacheStats.hits++;
        console.log(`📦 Cache HIT (memory): ${key}`);
        return memoryEntry.data;
      }

      // Check session storage
      const storage = this.getStorage();
      if (!storage) {
        this.cacheStats.misses++;
        return null;
      }

      const storedData = storage.getItem(key);
      if (!storedData) {
        this.cacheStats.misses++;
        return null;
      }

      const entry = JSON.parse(storedData);
      if (!this.isValidEntry(entry)) {
        // Remove expired entry
        this.delete(key);
        this.cacheStats.misses++;
        return null;
      }

      // Update memory cache with valid entry
      this.memoryCache.set(key, entry);
      this.cacheStats.hits++;
      console.log(`📦 Cache HIT (storage): ${key}`);
      return entry.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Set data in cache
   * @param {string} key - The cache key
   * @param {any} data - The data to cache
   * @param {number} [ttl] - Time to live in milliseconds
   * @param {Object} [metadata] - Additional metadata
   */
  set(key, data, ttl = CACHE_CONFIG.DEFAULT_TTL, metadata = {}) {
    try {
      const entry = {
        data,
        timestamp: Date.now(),
        ttl,
        key,
        metadata: {
          ...metadata,
          size: this.estimateSize(data)
        }
      };

      // Set in memory cache
      this.memoryCache.set(key, entry);

      // Set in session storage
      const storage = this.getStorage();
      if (storage) {
        try {
          storage.setItem(key, JSON.stringify(entry));
        } catch (storageError) {
          // Handle storage quota exceeded
          if (storageError.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded, clearing old cache entries');
            this.clearExpiredEntries();
            // Try again after clearing
            try {
              storage.setItem(key, JSON.stringify(entry));
            } catch (retryError) {
              console.warn('Still unable to store in session storage after cleanup');
            }
          }
        }
      }

      // Enforce memory cache size limit
      if (this.memoryCache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
        this.evictOldestEntries();
      }

      this.cacheStats.sets++;
      console.log(`📦 Cache SET: ${key} (TTL: ${ttl}ms)`);
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  /**
   * Delete data from cache
   * @param {string} key - The cache key
   */
  delete(key) {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);

      // Remove from session storage
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(key);
      }

      this.cacheStats.deletes++;
      console.log(`📦 Cache DELETE: ${key}`);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear session storage entries
      const storage = this.getStorage();
      if (storage) {
        const keysToRemove = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => storage.removeItem(key));
      }

      console.log('📦 Cache CLEARED');
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredEntries() {
    try {
      const now = Date.now();
      
      // Clear expired memory cache entries
      for (const [key, entry] of this.memoryCache.entries()) {
        if (!this.isValidEntry(entry, now)) {
          this.memoryCache.delete(key);
          this.cacheStats.evictions++;
        }
      }

      // Clear expired session storage entries
      const storage = this.getStorage();
      if (storage) {
        const keysToRemove = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
            try {
              const storedData = storage.getItem(key);
              if (storedData) {
                const entry = JSON.parse(storedData);
                if (!this.isValidEntry(entry, now)) {
                  keysToRemove.push(key);
                }
              }
            } catch (parseError) {
              // Remove invalid entries
              keysToRemove.push(key);
            }
          }
        }
        keysToRemove.forEach(key => {
          storage.removeItem(key);
          this.cacheStats.evictions++;
        });
      }

      console.log(`📦 Cache CLEANUP: Removed ${this.cacheStats.evictions} expired entries`);
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Evict oldest entries to maintain cache size limit
   */
  evictOldestEntries() {
    try {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const entriesToRemove = entries.slice(0, Math.floor(CACHE_CONFIG.MAX_CACHE_SIZE * 0.2));
      entriesToRemove.forEach(([key]) => {
        this.memoryCache.delete(key);
        this.cacheStats.evictions++;
      });

      console.log(`📦 Cache EVICTION: Removed ${entriesToRemove.length} oldest entries`);
    } catch (error) {
      console.warn('Cache eviction error:', error);
    }
  }

  /**
   * Check if a cache entry is valid (not expired)
   * @param {CacheEntry} entry - The cache entry
   * @param {number} [now] - Current timestamp
   * @returns {boolean} True if valid, false if expired
   */
  isValidEntry(entry, now = Date.now()) {
    if (!entry || typeof entry !== 'object') {
      return false;
    }
    
    if (!entry.timestamp || !entry.ttl) {
      return false;
    }
    
    return (now - entry.timestamp) < entry.ttl;
  }

  /**
   * Get the appropriate storage mechanism
   * @returns {Storage|null} The storage object or null if not available
   */
  getStorage() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage;
      }
    } catch (error) {
      console.warn('Session storage not available:', error);
    }
    return null;
  }

  /**
   * Estimate the size of data for cache management
   * @param {any} data - The data to estimate
   * @returns {number} Estimated size in bytes
   */
  estimateSize(data) {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      ...this.cacheStats,
      memorySize: this.memoryCache.size,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0
    };
  }

  /**
   * Invalidate cache entries by pattern
   * @param {string|RegExp} pattern - Pattern to match cache keys
   */
  invalidateByPattern(pattern) {
    try {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      
      // Invalidate memory cache
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          this.cacheStats.deletes++;
        }
      }

      // Invalidate session storage
      const storage = this.getStorage();
      if (storage) {
        const keysToRemove = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(CACHE_CONFIG.KEY_PREFIX) && regex.test(key)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          storage.removeItem(key);
          this.cacheStats.deletes++;
        });
      }

      console.log(`📦 Cache INVALIDATION: Pattern ${pattern} removed ${this.cacheStats.deletes} entries`);
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }
}

// Create and export singleton instance
const apiCache = new ApiCache();

// Auto-cleanup expired entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.clearExpiredEntries();
  }, 60000); // Every minute
}

export default apiCache;