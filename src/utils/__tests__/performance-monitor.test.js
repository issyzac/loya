/**
 * @fileoverview Tests for performance monitoring utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import performanceMonitor from '../performance-monitor.js';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset performance monitor state
    performanceMonitor.reset();
  });

  describe('cache performance tracking', () => {
    it('should record cache hits and misses', () => {
      performanceMonitor.recordCacheHit('test-key', 5);
      performanceMonitor.recordCacheMiss('test-key-2', 100);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.cacheHitRate).toBe(0.5);
    });

    it('should track API call performance', () => {
      performanceMonitor.recordApiCall('/test', 150, true, false);
      performanceMonitor.recordApiCall('/test-cached', 5, true, true);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.apiCalls).toBe(2);
      expect(metrics.avgResponseTime).toBeGreaterThan(0);
    });
  });

  describe('component performance tracking', () => {
    it('should record render times', () => {
      performanceMonitor.recordRenderTime('TestComponent', 25);
      performanceMonitor.recordRenderTime('TestComponent', 35);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.renderTimes).toHaveLength(2);
      expect(metrics.avgRenderTime).toBe(30);
    });

    it('should record component mounts', () => {
      performanceMonitor.recordComponentMount('TestComponent');
      performanceMonitor.recordComponentMount('AnotherComponent');

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.componentMounts).toBe(2);
    });
  });

  describe('performance insights', () => {
    it('should provide performance insights and recommendations', () => {
      // Simulate good performance
      performanceMonitor.recordCacheHit('test-1', 5);
      performanceMonitor.recordCacheHit('test-2', 3);
      performanceMonitor.recordCacheMiss('test-3', 100);
      performanceMonitor.recordApiCall('/test', 200, true, false);

      const insights = performanceMonitor.getInsights();
      expect(insights.score).toBeGreaterThan(50);
      expect(insights.recommendations).toContain('Great response times! 🚀');
    });

    it('should warn about poor cache performance', () => {
      // Simulate poor cache performance
      performanceMonitor.recordCacheMiss('test-1', 500);
      performanceMonitor.recordCacheMiss('test-2', 600);
      performanceMonitor.recordCacheHit('test-3', 5);

      const insights = performanceMonitor.getInsights();
      expect(insights.warnings.some(w => w.includes('Low cache hit rate'))).toBe(true);
    });
  });

  describe('observers', () => {
    it('should notify observers of performance events', () => {
      const observer = vi.fn();
      performanceMonitor.addObserver(observer);

      performanceMonitor.recordCacheHit('test-key', 5);

      expect(observer).toHaveBeenCalledWith('cache_hit', expect.any(Object));

      performanceMonitor.removeObserver(observer);
    });
  });

  describe('metrics export', () => {
    it('should export metrics as JSON', () => {
      performanceMonitor.recordCacheHit('test-key', 5);
      performanceMonitor.recordApiCall('/test', 100, true, false);

      const exported = performanceMonitor.exportMetrics();
      const data = JSON.parse(exported);

      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('insights');
      expect(data).toHaveProperty('timestamp');
      expect(data.metrics.cacheHits).toBe(1);
      expect(data.metrics.apiCalls).toBe(1);
    });
  });
});