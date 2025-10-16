/**
 * @fileoverview Performance monitoring utility for tracking cache effectiveness,
 * request timing, and component render performance.
 */

/**
 * Performance metrics collector
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      requestTimes: [],
      renderTimes: [],
      componentMounts: 0,
      apiCalls: 0,
      deduplicatedRequests: 0
    };
    
    this.thresholds = {
      slowRequest: 2000, // 2 seconds
      slowRender: 100,   // 100ms
      lowCacheHitRate: 0.5 // 50%
    };
    
    this.observers = [];
  }

  /**
   * Record cache hit
   * @param {string} key - Cache key
   * @param {number} [responseTime] - Time to retrieve from cache
   */
  recordCacheHit(key, responseTime = 0) {
    this.metrics.cacheHits++;
    
    if (responseTime > 0) {
      this.metrics.requestTimes.push({
        type: 'cache_hit',
        time: responseTime,
        timestamp: Date.now(),
        key: key.substring(0, 50) // Truncate for privacy
      });
    }
    
    this.notifyObservers('cache_hit', { key, responseTime });
  }

  /**
   * Record cache miss
   * @param {string} key - Cache key
   * @param {number} [responseTime] - Time for API request
   */
  recordCacheMiss(key, responseTime = 0) {
    this.metrics.cacheMisses++;
    
    if (responseTime > 0) {
      this.metrics.requestTimes.push({
        type: 'cache_miss',
        time: responseTime,
        timestamp: Date.now(),
        key: key.substring(0, 50)
      });
    }
    
    this.notifyObservers('cache_miss', { key, responseTime });
  }

  /**
   * Record API call timing
   * @param {string} endpoint - API endpoint
   * @param {number} responseTime - Response time in milliseconds
   * @param {boolean} success - Whether the request was successful
   * @param {boolean} fromCache - Whether the response came from cache
   */
  recordApiCall(endpoint, responseTime, success = true, fromCache = false) {
    this.metrics.apiCalls++;
    
    const callData = {
      type: fromCache ? 'cached_api' : 'live_api',
      endpoint: endpoint.substring(0, 50),
      time: responseTime,
      success,
      timestamp: Date.now()
    };
    
    this.metrics.requestTimes.push(callData);
    
    // Check for slow requests
    if (responseTime > this.thresholds.slowRequest && !fromCache) {
      console.warn(`🐌 Slow API request detected: ${endpoint} took ${responseTime}ms`);
      this.notifyObservers('slow_request', callData);
    }
    
    this.notifyObservers('api_call', callData);
  }

  /**
   * Record component render timing
   * @param {string} componentName - Name of the component
   * @param {number} renderTime - Render time in milliseconds
   */
  recordRenderTime(componentName, renderTime) {
    const renderData = {
      component: componentName,
      time: renderTime,
      timestamp: Date.now()
    };
    
    this.metrics.renderTimes.push(renderData);
    
    // Check for slow renders
    if (renderTime > this.thresholds.slowRender) {
      console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime}ms`);
      this.notifyObservers('slow_render', renderData);
    }
    
    this.notifyObservers('render', renderData);
  }

  /**
   * Record component mount
   * @param {string} componentName - Name of the component
   */
  recordComponentMount(componentName) {
    this.metrics.componentMounts++;
    this.notifyObservers('component_mount', { component: componentName });
  }

  /**
   * Record request deduplication
   * @param {string} key - Request key
   */
  recordDeduplication(key) {
    this.metrics.deduplicatedRequests++;
    this.notifyObservers('request_deduplicated', { key });
  }

  /**
   * Get current performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    const now = Date.now();
    const recentRequests = this.metrics.requestTimes.filter(
      req => (now - req.timestamp) < 5 * 60 * 1000 // Last 5 minutes
    );
    
    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0
      ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
      : 0;
    
    const avgResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((sum, req) => sum + req.time, 0) / recentRequests.length
      : 0;
    
    const avgRenderTime = this.metrics.renderTimes.length > 0
      ? this.metrics.renderTimes.reduce((sum, render) => sum + render.time, 0) / this.metrics.renderTimes.length
      : 0;
    
    return {
      ...this.metrics,
      cacheHitRate,
      avgResponseTime: Math.round(avgResponseTime),
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      recentRequestCount: recentRequests.length,
      deduplicationRate: this.metrics.apiCalls > 0 
        ? this.metrics.deduplicatedRequests / this.metrics.apiCalls 
        : 0
    };
  }

  /**
   * Get performance insights and recommendations
   * @returns {Object} Performance insights
   */
  getInsights() {
    const metrics = this.getMetrics();
    const insights = {
      warnings: [],
      recommendations: [],
      score: 100 // Start with perfect score
    };
    
    // Cache performance analysis
    if (metrics.cacheHitRate < this.thresholds.lowCacheHitRate) {
      insights.warnings.push(`Low cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
      insights.recommendations.push('Consider increasing cache TTL or improving cache key strategy');
      insights.score -= 20;
    }
    
    // Response time analysis
    if (metrics.avgResponseTime > this.thresholds.slowRequest) {
      insights.warnings.push(`Slow average response time: ${metrics.avgResponseTime}ms`);
      insights.recommendations.push('Consider optimizing API calls or increasing cache usage');
      insights.score -= 15;
    }
    
    // Render performance analysis
    if (metrics.avgRenderTime > this.thresholds.slowRender) {
      insights.warnings.push(`Slow average render time: ${metrics.avgRenderTime}ms`);
      insights.recommendations.push('Consider memoizing components or optimizing render logic');
      insights.score -= 10;
    }
    
    // Deduplication effectiveness
    if (metrics.deduplicationRate < 0.1 && metrics.apiCalls > 10) {
      insights.recommendations.push('Request deduplication is working well');
    } else if (metrics.deduplicationRate > 0.3) {
      insights.warnings.push(`High request deduplication rate: ${(metrics.deduplicationRate * 100).toFixed(1)}%`);
      insights.recommendations.push('Consider reviewing request patterns to reduce duplicate calls');
    }
    
    // Positive feedback
    if (metrics.cacheHitRate > 0.8) {
      insights.recommendations.push('Excellent cache performance! 🎉');
    }
    
    if (metrics.avgResponseTime < 500) {
      insights.recommendations.push('Great response times! 🚀');
    }
    
    return {
      ...insights,
      score: Math.max(0, insights.score)
    };
  }

  /**
   * Add performance observer
   * @param {Function} callback - Observer callback
   */
  addObserver(callback) {
    this.observers.push(callback);
  }

  /**
   * Remove performance observer
   * @param {Function} callback - Observer callback to remove
   */
  removeObserver(callback) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  /**
   * Notify all observers of a performance event
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.warn('Performance observer error:', error);
      }
    });
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      requestTimes: [],
      renderTimes: [],
      componentMounts: 0,
      apiCalls: 0,
      deduplicatedRequests: 0
    };
    
    console.log('📊 Performance metrics reset');
  }

  /**
   * Export metrics for analysis
   * @returns {string} JSON string of metrics
   */
  exportMetrics() {
    const exportData = {
      metrics: this.getMetrics(),
      insights: this.getInsights(),
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Start automatic performance monitoring
   */
  startMonitoring() {
    if (typeof window === 'undefined') return;
    
    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📊 Page hidden - pausing performance monitoring');
      } else {
        console.log('📊 Page visible - resuming performance monitoring');
      }
    });
    
    // Periodic performance reporting (development only)
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const insights = this.getInsights();
        if (insights.warnings.length > 0) {
          console.group('📊 Performance Insights');
          insights.warnings.forEach(warning => console.warn(warning));
          insights.recommendations.forEach(rec => console.info(rec));
          console.groupEnd();
        }
      }, 60000); // Every minute
    }
    
    console.log('📊 Performance monitoring started');
  }
}

// Create and export singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  performanceMonitor.startMonitoring();
}

export default performanceMonitor;