/**
 * Performance monitoring utility for promotional messages system
 * Tracks cache hit rates, load times, and component render performance
 */

class PromotionalMessagesPerformance {
  constructor() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      renderTimes: [],
      imageLoadTimes: [],
      componentMounts: 0,
      componentUnmounts: 0
    };
    
    this.startTimes = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Record a cache hit
   */
  recordCacheHit() {
    if (!this.isEnabled) return;
    this.metrics.cacheHits++;
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss() {
    if (!this.isEnabled) return;
    this.metrics.cacheMisses++;
  }

  /**
   * Record an API call
   */
  recordApiCall() {
    if (!this.isEnabled) return;
    this.metrics.apiCalls++;
  }

  /**
   * Start timing an operation
   * @param {string} operationId - Unique identifier for the operation
   */
  startTiming(operationId) {
    if (!this.isEnabled) return;
    this.startTimes.set(operationId, performance.now());
  }

  /**
   * End timing an operation and record the duration
   * @param {string} operationId - Unique identifier for the operation
   * @param {string} type - Type of operation ('render', 'imageLoad', etc.)
   */
  endTiming(operationId, type = 'render') {
    if (!this.isEnabled) return;
    
    const startTime = this.startTimes.get(operationId);
    if (!startTime) return;

    const duration = performance.now() - startTime;
    this.startTimes.delete(operationId);

    switch (type) {
      case 'render':
        this.metrics.renderTimes.push(duration);
        // Keep only last 100 measurements
        if (this.metrics.renderTimes.length > 100) {
          this.metrics.renderTimes.shift();
        }
        break;
      case 'imageLoad':
        this.metrics.imageLoadTimes.push(duration);
        // Keep only last 50 measurements
        if (this.metrics.imageLoadTimes.length > 50) {
          this.metrics.imageLoadTimes.shift();
        }
        break;
    }
  }

  /**
   * Record component mount
   */
  recordComponentMount() {
    if (!this.isEnabled) return;
    this.metrics.componentMounts++;
  }

  /**
   * Record component unmount
   */
  recordComponentUnmount() {
    if (!this.isEnabled) return;
    this.metrics.componentUnmounts++;
  }

  /**
   * Calculate cache hit rate
   * @returns {number} Cache hit rate as percentage
   */
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;
  }

  /**
   * Calculate average render time
   * @returns {number} Average render time in milliseconds
   */
  getAverageRenderTime() {
    const times = this.metrics.renderTimes;
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  /**
   * Calculate average image load time
   * @returns {number} Average image load time in milliseconds
   */
  getAverageImageLoadTime() {
    const times = this.metrics.imageLoadTimes;
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  /**
   * Get performance summary
   * @returns {Object} Performance metrics summary
   */
  getSummary() {
    return {
      cachePerformance: {
        hitRate: this.getCacheHitRate(),
        totalHits: this.metrics.cacheHits,
        totalMisses: this.metrics.cacheMisses,
        totalApiCalls: this.metrics.apiCalls
      },
      renderPerformance: {
        averageRenderTime: this.getAverageRenderTime(),
        totalRenders: this.metrics.renderTimes.length,
        p95RenderTime: this.getPercentile(this.metrics.renderTimes, 95),
        p99RenderTime: this.getPercentile(this.metrics.renderTimes, 99)
      },
      imagePerformance: {
        averageLoadTime: this.getAverageImageLoadTime(),
        totalLoads: this.metrics.imageLoadTimes.length,
        p95LoadTime: this.getPercentile(this.metrics.imageLoadTimes, 95),
        p99LoadTime: this.getPercentile(this.metrics.imageLoadTimes, 99)
      },
      componentLifecycle: {
        totalMounts: this.metrics.componentMounts,
        totalUnmounts: this.metrics.componentUnmounts,
        activeComponents: this.metrics.componentMounts - this.metrics.componentUnmounts
      }
    };
  }

  /**
   * Calculate percentile from array of numbers
   * @param {number[]} arr - Array of numbers
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  getPercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Log performance summary to console (development only)
   */
  logSummary() {
    if (!this.isEnabled) return;
    
    const summary = this.getSummary();
    console.group('🚀 Promotional Messages Performance Summary');
    
    console.log('📊 Cache Performance:');
    console.table(summary.cachePerformance);
    
    console.log('⚡ Render Performance:');
    console.table(summary.renderPerformance);
    
    console.log('🖼️ Image Performance:');
    console.table(summary.imagePerformance);
    
    console.log('🔄 Component Lifecycle:');
    console.table(summary.componentLifecycle);
    
    console.groupEnd();
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      renderTimes: [],
      imageLoadTimes: [],
      componentMounts: 0,
      componentUnmounts: 0
    };
    this.startTimes.clear();
  }

  /**
   * Enable or disable performance monitoring
   * @param {boolean} enabled - Whether to enable monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Check if performance monitoring is enabled
   * @returns {boolean} True if enabled
   */
  isMonitoringEnabled() {
    return this.isEnabled;
  }
}

// Export singleton instance
export default new PromotionalMessagesPerformance();