/**
 * Client-side caching utility for promotional messages with TTL (Time To Live)
 * Provides memory-based caching with automatic expiration and localStorage fallback
 */

class PromotionalMessagesCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.maxCacheSize = 50; // Maximum number of cached entries
    this.storageKey = 'promotional_messages_cache';
    
    // Load cache from localStorage on initialization
    this.loadFromStorage();
    
    // Set up periodic cleanup
    this.setupCleanup();
  }

  /**
   * Generate a cache key from request parameters
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  generateKey(params = {}) {
    const { limit = 5, type, userId } = params;
    return `messages_${limit}_${type || 'all'}_${userId || 'anonymous'}`;
  }

  /**
   * Get cached data if it exists and hasn't expired
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    // Update access time for LRU behavior
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  /**
   * Store data in cache with TTL
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, data, ttl = this.defaultTTL) {
    // Ensure cache doesn't exceed max size
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    const entry = {
      data,
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
      createdAt: Date.now()
    };

    this.cache.set(key, entry);
    this.saveToStorage();
  }

  /**
   * Remove expired entries and least recently used entries if cache is full
   */
  evictLRU() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // First, remove expired entries
    entries.forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    });

    // If still over limit, remove least recently used
    if (this.cache.size >= this.maxCacheSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      // Remove oldest entries
      const toRemove = sortedEntries.slice(0, this.cache.size - this.maxCacheSize + 1);
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
      });
    }
  }

  /**
   * Clear all cached data
   */
  clear() {
    this.cache.clear();
    this.clearStorage();
  }

  /**
   * Remove specific cache entry
   * @param {string} key - Cache key to remove
   */
  delete(key) {
    this.cache.delete(key);
    this.saveToStorage();
  }

  /**
   * Check if a key exists in cache and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is valid
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.saveToStorage();
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    return {
      totalEntries: this.cache.size,
      expiredEntries: entries.filter(entry => now > entry.expiresAt).length,
      validEntries: entries.filter(entry => now <= entry.expiresAt).length,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.createdAt)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.createdAt)) : null,
      totalSize: this.calculateSize()
    };
  }

  /**
   * Calculate approximate cache size in bytes
   * @returns {number} Approximate size in bytes
   */
  calculateSize() {
    let size = 0;
    this.cache.forEach((entry, key) => {
      size += key.length * 2; // Approximate string size
      size += JSON.stringify(entry.data).length * 2; // Approximate data size
      size += 64; // Approximate overhead for timestamps and structure
    });
    return size;
  }

  /**
   * Save cache to localStorage for persistence
   */
  saveToStorage() {
    try {
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save promotional messages cache to localStorage:', error);
      // If storage is full, try clearing old data
      if (error.name === 'QuotaExceededError') {
        this.clearStorage();
      }
    }
  }

  /**
   * Load cache from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return;
      }

      const cacheData = JSON.parse(stored);
      const now = Date.now();
      
      // Only load if data is less than 1 hour old
      if (now - cacheData.timestamp > 60 * 60 * 1000) {
        this.clearStorage();
        return;
      }

      // Restore cache entries, filtering out expired ones
      cacheData.entries.forEach(([key, entry]) => {
        if (now <= entry.expiresAt) {
          this.cache.set(key, entry);
        }
      });
    } catch (error) {
      console.warn('Failed to load promotional messages cache from localStorage:', error);
      this.clearStorage();
    }
  }

  /**
   * Clear cache from localStorage
   */
  clearStorage() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear promotional messages cache from localStorage:', error);
    }
  }

  /**
   * Set up periodic cleanup of expired entries
   */
  setupCleanup() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    if (keysToDelete.length > 0) {
      this.saveToStorage();
    }
  }

  /**
   * Invalidate cache entries that match a pattern
   * @param {RegExp|string} pattern - Pattern to match against cache keys
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete = [];

    this.cache.forEach((entry, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    if (keysToDelete.length > 0) {
      this.saveToStorage();
    }
  }

  /**
   * Preload data into cache
   * @param {string} key - Cache key
   * @param {Function} dataLoader - Function that returns a promise with data
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  async preload(key, dataLoader, ttl = this.defaultTTL) {
    if (this.has(key)) {
      return this.get(key);
    }

    try {
      const data = await dataLoader();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.warn('Failed to preload data for key:', key, error);
      throw error;
    }
  }
}

// Export singleton instance
export default new PromotionalMessagesCache();