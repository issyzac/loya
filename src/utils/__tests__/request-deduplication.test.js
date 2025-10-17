/**
 * @fileoverview Tests for request deduplication utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import requestDeduplicator from '../request-deduplication.js';

describe('RequestDeduplicator', () => {
  beforeEach(() => {
    // Reset the deduplicator state
    requestDeduplicator.reset();
  });

  afterEach(() => {
    // Clean up any pending requests
    requestDeduplicator.cancelAllRequests();
  });

  describe('generateRequestKey', () => {
    it('should generate consistent keys for same parameters', () => {
      const key1 = requestDeduplicator.generateRequestKey('/test', { a: 1, b: 2 }, 'GET');
      const key2 = requestDeduplicator.generateRequestKey('/test', { b: 2, a: 1 }, 'GET');
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different methods', () => {
      const key1 = requestDeduplicator.generateRequestKey('/test', { a: 1 }, 'GET');
      const key2 = requestDeduplicator.generateRequestKey('/test', { a: 1 }, 'POST');
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different endpoints', () => {
      const key1 = requestDeduplicator.generateRequestKey('/test1', { a: 1 });
      const key2 = requestDeduplicator.generateRequestKey('/test2', { a: 1 });
      expect(key1).not.toBe(key2);
    });

    it('should handle undefined and null parameters', () => {
      const key1 = requestDeduplicator.generateRequestKey('/test', { a: 1, b: undefined, c: null });
      const key2 = requestDeduplicator.generateRequestKey('/test', { a: 1 });
      expect(key1).toBe(key2);
    });
  });

  describe('executeRequest', () => {
    it('should execute request and return result', async () => {
      const mockResult = { data: 'test' };
      const mockRequest = vi.fn().mockResolvedValue(mockResult);
      const key = 'test-key';

      const result = await requestDeduplicator.executeRequest(key, mockRequest);

      expect(result).toEqual(mockResult);
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    it('should deduplicate identical requests', async () => {
      const mockResult = { data: 'test' };
      const mockRequest = vi.fn().mockResolvedValue(mockResult);
      const key = 'test-key';

      // Start two identical requests
      const promise1 = requestDeduplicator.executeRequest(key, mockRequest);
      const promise2 = requestDeduplicator.executeRequest(key, mockRequest);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual(mockResult);
      expect(result2).toEqual(mockResult);
      expect(mockRequest).toHaveBeenCalledTimes(1); // Should only be called once
    });

    it('should handle request failures', async () => {
      const mockError = new Error('Request failed');
      const mockRequest = vi.fn().mockRejectedValue(mockError);
      const key = 'test-key';

      await expect(requestDeduplicator.executeRequest(key, mockRequest)).rejects.toThrow('Request failed');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle request timeout', async () => {
      const mockRequest = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      const key = 'test-key';

      await expect(
        requestDeduplicator.executeRequest(key, mockRequest, { timeout: 100 })
      ).rejects.toThrow('Request timeout');
    });

    it('should handle request cancellation', async () => {
      const mockRequest = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      const key = 'test-key';
      const abortController = new AbortController();

      const requestPromise = requestDeduplicator.executeRequest(key, mockRequest, { 
        signal: abortController.signal 
      });

      // Cancel the request
      setTimeout(() => abortController.abort(), 50);

      await expect(requestPromise).rejects.toThrow('Request was cancelled');
    });

    it('should handle pre-cancelled signals', async () => {
      const mockRequest = vi.fn();
      const key = 'test-key';
      const abortController = new AbortController();
      abortController.abort(); // Pre-cancel

      await expect(
        requestDeduplicator.executeRequest(key, mockRequest, { 
          signal: abortController.signal 
        })
      ).rejects.toThrow('Request was cancelled');

      expect(mockRequest).not.toHaveBeenCalled();
    });

    it('should clean up completed requests', async () => {
      const mockResult = { data: 'test' };
      const mockRequest = vi.fn().mockResolvedValue(mockResult);
      const key = 'test-key';

      await requestDeduplicator.executeRequest(key, mockRequest);

      // Request should be cleaned up
      const pendingRequests = requestDeduplicator.getPendingRequests();
      expect(pendingRequests).toHaveLength(0);
    });
  });

  describe('cancelRequest', () => {
    it('should cancel specific request', async () => {
      const mockRequest = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      const key = 'test-key';

      const requestPromise = requestDeduplicator.executeRequest(key, mockRequest);

      // Cancel the specific request
      requestDeduplicator.cancelRequest(key);

      await expect(requestPromise).rejects.toThrow('Request was cancelled');
    });

    it('should not affect other requests when cancelling specific request', async () => {
      const mockResult1 = { data: 'test1' };
      const mockResult2 = { data: 'test2' };
      const mockRequest1 = vi.fn().mockResolvedValue(mockResult1);
      const mockRequest2 = vi.fn().mockResolvedValue(mockResult2);

      const promise1 = requestDeduplicator.executeRequest('key1', mockRequest1);
      const promise2 = requestDeduplicator.executeRequest('key2', mockRequest2);

      // Cancel only the first request
      requestDeduplicator.cancelRequest('key1');

      await expect(promise1).rejects.toThrow('Request was cancelled');
      await expect(promise2).resolves.toEqual(mockResult2);
    });
  });

  describe('cancelAllRequests', () => {
    it('should cancel all pending requests', async () => {
      const mockRequest1 = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      const mockRequest2 = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const promise1 = requestDeduplicator.executeRequest('key1', mockRequest1);
      const promise2 = requestDeduplicator.executeRequest('key2', mockRequest2);

      // Cancel all requests
      requestDeduplicator.cancelAllRequests();

      await expect(promise1).rejects.toThrow('Request was cancelled');
      await expect(promise2).rejects.toThrow('Request was cancelled');
    });
  });

  describe('getPendingRequests', () => {
    it('should return information about pending requests', async () => {
      const mockRequest = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      requestDeduplicator.executeRequest('key1', mockRequest);
      requestDeduplicator.executeRequest('key2', mockRequest);

      const pendingRequests = requestDeduplicator.getPendingRequests();

      expect(pendingRequests).toHaveLength(2);
      expect(pendingRequests[0]).toHaveProperty('key');
      expect(pendingRequests[0]).toHaveProperty('startTime');
      expect(pendingRequests[0]).toHaveProperty('duration');
      expect(pendingRequests[0]).toHaveProperty('timeout');

      // Clean up
      requestDeduplicator.cancelAllRequests();
    });
  });

  describe('getStats', () => {
    it('should track request statistics', async () => {
      const mockResult = { data: 'test' };
      const mockRequest = vi.fn().mockResolvedValue(mockResult);

      // Initial stats
      let stats = requestDeduplicator.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.deduplicatedRequests).toBe(0);

      // Execute requests
      const key = 'test-key';
      await requestDeduplicator.executeRequest(key, mockRequest);
      await requestDeduplicator.executeRequest(key, mockRequest); // Should be deduplicated

      stats = requestDeduplicator.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.deduplicatedRequests).toBe(1);
      expect(stats.completedRequests).toBe(2);
      expect(stats.deduplicationRate).toBe(0.5);
    });

    it('should track failed requests', async () => {
      const mockError = new Error('Request failed');
      const mockRequest = vi.fn().mockRejectedValue(mockError);

      try {
        await requestDeduplicator.executeRequest('key', mockRequest);
      } catch (error) {
        // Expected to fail
      }

      const stats = requestDeduplicator.getStats();
      expect(stats.failedRequests).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset all state and cancel pending requests', async () => {
      const mockRequest = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const promise = requestDeduplicator.executeRequest('key', mockRequest);

      // Reset should cancel the request
      requestDeduplicator.reset();

      await expect(promise).rejects.toThrow('Request was cancelled');

      // Stats should be reset
      const stats = requestDeduplicator.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.pendingCount).toBe(0);
    });
  });
});