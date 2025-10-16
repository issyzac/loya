import { describe, it, expect, beforeEach, vi } from 'vitest';
import promotionalMessagesCache from '../promotional-messages-cache';

describe('PromotionalMessagesCache', () => {
  beforeEach(() => {
    // Clear cache before each test
    promotionalMessagesCache.clear();
    vi.clearAllMocks();
  });

  it('should store and retrieve cached data', () => {
    const testData = { messages: [{ id: '1', title: 'Test' }] };
    const key = 'test-key';

    promotionalMessagesCache.set(key, testData);
    const retrieved = promotionalMessagesCache.get(key);

    expect(retrieved).toEqual(testData);
  });

  it('should return null for non-existent keys', () => {
    const result = promotionalMessagesCache.get('non-existent-key');
    expect(result).toBeNull();
  });

  it('should generate consistent cache keys', () => {
    const params1 = { limit: 5, type: 'promotion', userId: 'user1' };
    const params2 = { limit: 5, type: 'promotion', userId: 'user1' };
    
    const key1 = promotionalMessagesCache.generateKey(params1);
    const key2 = promotionalMessagesCache.generateKey(params2);
    
    expect(key1).toBe(key2);
  });

  it('should generate different keys for different parameters', () => {
    const params1 = { limit: 5, type: 'promotion', userId: 'user1' };
    const params2 = { limit: 10, type: 'announcement', userId: 'user2' };
    
    const key1 = promotionalMessagesCache.generateKey(params1);
    const key2 = promotionalMessagesCache.generateKey(params2);
    
    expect(key1).not.toBe(key2);
  });

  it('should handle expired entries', () => {
    const testData = { messages: [] };
    const key = 'test-key';
    const shortTTL = 1; // 1ms TTL

    promotionalMessagesCache.set(key, testData, shortTTL);
    
    // Wait for expiration
    setTimeout(() => {
      const result = promotionalMessagesCache.get(key);
      expect(result).toBeNull();
    }, 10);
  });

  it('should check if key exists', () => {
    const testData = { messages: [] };
    const key = 'test-key';

    expect(promotionalMessagesCache.has(key)).toBe(false);
    
    promotionalMessagesCache.set(key, testData);
    expect(promotionalMessagesCache.has(key)).toBe(true);
  });

  it('should delete specific keys', () => {
    const testData = { messages: [] };
    const key = 'test-key';

    promotionalMessagesCache.set(key, testData);
    expect(promotionalMessagesCache.has(key)).toBe(true);
    
    promotionalMessagesCache.delete(key);
    expect(promotionalMessagesCache.has(key)).toBe(false);
  });

  it('should clear all cache', () => {
    promotionalMessagesCache.set('key1', { data: 1 });
    promotionalMessagesCache.set('key2', { data: 2 });
    
    expect(promotionalMessagesCache.has('key1')).toBe(true);
    expect(promotionalMessagesCache.has('key2')).toBe(true);
    
    promotionalMessagesCache.clear();
    
    expect(promotionalMessagesCache.has('key1')).toBe(false);
    expect(promotionalMessagesCache.has('key2')).toBe(false);
  });

  it('should provide cache statistics', () => {
    promotionalMessagesCache.set('key1', { data: 1 });
    promotionalMessagesCache.set('key2', { data: 2 });
    
    const stats = promotionalMessagesCache.getStats();
    
    expect(stats.totalEntries).toBe(2);
    expect(stats.validEntries).toBe(2);
    expect(stats.expiredEntries).toBe(0);
    expect(typeof stats.totalSize).toBe('number');
  });

  it('should invalidate cache entries by pattern', () => {
    promotionalMessagesCache.set('messages_5_promotion_user1', { data: 1 });
    promotionalMessagesCache.set('messages_10_announcement_user1', { data: 2 });
    promotionalMessagesCache.set('messages_5_promotion_user2', { data: 3 });
    
    // Invalidate all entries for user1
    promotionalMessagesCache.invalidatePattern(/user1$/);
    
    expect(promotionalMessagesCache.has('messages_5_promotion_user1')).toBe(false);
    expect(promotionalMessagesCache.has('messages_10_announcement_user1')).toBe(false);
    expect(promotionalMessagesCache.has('messages_5_promotion_user2')).toBe(true);
  });

  it('should handle preload functionality', async () => {
    const key = 'preload-key';
    const testData = { messages: [{ id: '1', title: 'Preloaded' }] };
    
    // Mock data loader function
    const dataLoader = vi.fn().mockResolvedValue(testData);
    
    // Preload data
    const result = await promotionalMessagesCache.preload(key, dataLoader);
    
    expect(result).toEqual(testData);
    expect(dataLoader).toHaveBeenCalledOnce();
    expect(promotionalMessagesCache.has(key)).toBe(true);
    
    // Second call should use cached data
    const result2 = await promotionalMessagesCache.preload(key, dataLoader);
    expect(result2).toEqual(testData);
    expect(dataLoader).toHaveBeenCalledOnce(); // Should not be called again
  });
});