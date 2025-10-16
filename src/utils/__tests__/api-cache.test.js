/**
 * @fileoverview Tests for API cache utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import apiCache from '../api-cache.js';

// Mock sessionStorage
const mockSessionStorage = {
  data: {},
  getItem: vi.fn((key) => mockSessionStorage.data[key] || null),
  setItem: vi.fn((key, value) => {
    mockSessionStorage.data[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete mockSessionStorage.data[key];
  }),
  clear: vi.fn(() => {
    mockSessionStorage.data = {};
  }),
  get length() {
    return Object.keys(mockSessionStorage.data).length;
  },
  key: vi.fn((index) => Object.keys(mockSessionStorage.data)[index] || null)
};

// Mock window.sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('ApiCache', () => {
  beforeEach(() => {
    // Clear cache and reset mocks
    apiCache.clear();
    mockSessionStorage.clear();
    mockSessionStorage.data = {};
    vi.clearAllMocks();
    
    // Reset cache stats
    apiCache.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  });

  describe('generateKey', () => {
    it('should generate consistent keys for same parameters', () => {
      const key1 = apiCache.generateKey('/test', { a: 1, b: 2 });
      const key2 = apiCache.generateKey('/test', { b: 2, a: 1 });
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const key1 = apiCache.generateKey('/test', { a: 1 });
      const key2 = apiCache.generateKey('/test', { a: 2 });
      expect(key1).not.toBe(key2);
    });

    it('should include endpoint in key', () => {
      const key1 = apiCache.generateKey('/test1', { a: 1 });
      const key2 = apiCache.generateKey('/test2', { a: 1 });
      expect(key1).not.toBe(key2);
    });
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      
      apiCache.set(key, data);
      const retrieved = apiCache.get(key);
      
      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const retrieved = apiCache.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should respect TTL and return null for expired data', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      const shortTtl = 10; // 10ms
      
      apiCache.set(key, data, shortTtl);
      
      // Should be available immediately
      expect(apiCache.get(key)).toEqual(data);
      
      // Wait for expiration
      return new Promise(resolve => {
        setTimeout(() => {
          expect(apiCache.get(key)).toBeNull();
          resolve();
        }, shortTtl + 5);
      });
    });

    it('should store data in both memory and session storage', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      
      apiCache.set(key, data);
      
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      expect(apiCache.get(key)).toEqual(data);
    });
  });

  describe('delete', () => {
    it('should remove data from cache', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      
      apiCache.set(key, data);
      expect(apiCache.get(key)).toEqual(data);
      
      apiCache.delete(key);
      expect(apiCache.get(key)).toBeNull();
    });

    it('should remove data from both memory and session storage', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      
      apiCache.set(key, data);
      apiCache.delete(key);
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(key);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      const key1 = apiCache.generateKey('/test1', {});
      const key2 = apiCache.generateKey('/test2', {});
      
      apiCache.set(key1, { data: 1 });
      apiCache.set(key2, { data: 2 });
      
      expect(apiCache.get(key1)).toBeTruthy();
      expect(apiCache.get(key2)).toBeTruthy();
      
      apiCache.clear();
      
      expect(apiCache.get(key1)).toBeNull();
      expect(apiCache.get(key2)).toBeNull();
    });
  });

  describe('clearExpiredEntries', () => {
    it('should remove only expired entries', () => {
      const shortTtl = 10;
      const longTtl = 10000;
      
      apiCache.set('expired-key', { data: 'expired' }, shortTtl);
      apiCache.set('valid-key', { data: 'valid' }, longTtl);
      
      return new Promise(resolve => {
        setTimeout(() => {
          apiCache.clearExpiredEntries();
          
          expect(apiCache.get('expired-key')).toBeNull();
          expect(apiCache.get('valid-key')).toEqual({ data: 'valid' });
          resolve();
        }, shortTtl + 5);
      });
    });
  });

  describe('invalidateByPattern', () => {
    it('should invalidate entries matching string pattern', () => {
      apiCache.set('api_cache_test1', { data: 1 });
      apiCache.set('api_cache_test2', { data: 2 });
      apiCache.set('api_cache_other', { data: 3 });
      
      apiCache.invalidateByPattern('test');
      
      expect(apiCache.get('api_cache_test1')).toBeNull();
      expect(apiCache.get('api_cache_test2')).toBeNull();
      expect(apiCache.get('api_cache_other')).toEqual({ data: 3 });
    });

    it('should invalidate entries matching regex pattern', () => {
      apiCache.set('api_cache_user123', { data: 1 });
      apiCache.set('api_cache_user456', { data: 2 });
      apiCache.set('api_cache_order789', { data: 3 });
      
      apiCache.invalidateByPattern(/user\d+/);
      
      expect(apiCache.get('api_cache_user123')).toBeNull();
      expect(apiCache.get('api_cache_user456')).toBeNull();
      expect(apiCache.get('api_cache_order789')).toEqual({ data: 3 });
    });
  });

  describe('getStats', () => {
    it('should track cache hits and misses', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      
      // Initial stats
      const initialStats = apiCache.getStats();
      expect(initialStats.hits).toBe(0);
      expect(initialStats.misses).toBe(0);
      
      // Miss
      apiCache.get('non-existent');
      let stats = apiCache.getStats();
      expect(stats.misses).toBe(1);
      
      // Set and hit
      apiCache.set(key, data);
      apiCache.get(key);
      stats = apiCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.sets).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      
      apiCache.set(key, data);
      
      // 2 hits, 1 miss = 66.7% hit rate
      apiCache.get(key);
      apiCache.get(key);
      apiCache.get('non-existent');
      
      const stats = apiCache.getStats();
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', () => {
      // Mock storage error
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const key = 'test-key';
      const data = { test: 'data' };
      
      // Should not throw
      expect(() => apiCache.set(key, data)).not.toThrow();
      
      // Should still work with memory cache
      expect(apiCache.get(key)).toEqual(data);
    });

    it('should handle quota exceeded error', () => {
      // Mock quota exceeded error
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'QuotaExceededError';
      mockSessionStorage.setItem.mockImplementation(() => {
        throw quotaError;
      });
      
      const key = 'test-key';
      const data = { test: 'data' };
      
      // Should not throw
      expect(() => apiCache.set(key, data)).not.toThrow();
    });

    it('should handle invalid JSON in storage', () => {
      // Mock invalid JSON
      mockSessionStorage.getItem.mockReturnValue('invalid json');
      
      const result = apiCache.get('test-key');
      expect(result).toBeNull();
    });
  });
});