# Promotional Messages Performance Optimizations

This document outlines the performance optimizations implemented for the promotional messages system.

## Overview

The promotional messages system has been optimized for performance using several techniques:

1. **Client-side Caching with TTL**
2. **Lazy Loading for Images**
3. **React Component Optimizations**
4. **Performance Monitoring**

## 1. Client-side Caching (`promotional-messages-cache.js`)

### Features
- **TTL (Time To Live)**: Cached data expires after 5 minutes by default
- **LRU Eviction**: Least Recently Used entries are removed when cache is full
- **localStorage Persistence**: Cache survives page reloads
- **Pattern-based Invalidation**: Invalidate cache entries by regex patterns
- **Memory Management**: Automatic cleanup of expired entries

### Usage
```javascript
// Cache is automatically used by the promotional messages service
const response = await promotionalMessagesService.getActiveMessages({
  limit: 5,
  useCache: true, // Default: true
  cacheTTL: 300000 // Optional: 5 minutes
});

// Manual cache operations
promotionalMessagesService.clearCache();
promotionalMessagesService.invalidateCache('user123');
```

### Benefits
- **Reduced API Calls**: Subsequent requests use cached data
- **Faster Load Times**: Instant display of cached messages
- **Bandwidth Savings**: Less network traffic
- **Better UX**: No loading states for cached content

## 2. Lazy Loading (`lazy-image.jsx`)

### Features
- **Intersection Observer**: Images load only when entering viewport
- **Configurable Thresholds**: Customize when images start loading
- **Error Handling**: Graceful fallback for failed image loads
- **Performance Monitoring**: Track image load times
- **Test Environment Support**: Immediate loading in tests

### Configuration
```javascript
<LazyImage
  src="image.jpg"
  threshold={0.1}        // Load when 10% visible
  rootMargin="100px"     // Start loading 100px before visible
  className="w-full h-40"
/>
```

### Benefits
- **Faster Initial Page Load**: Images load on-demand
- **Reduced Bandwidth**: Only visible images are loaded
- **Better Performance**: Fewer simultaneous network requests
- **Improved UX**: Smooth loading with placeholders

## 3. React Component Optimizations

### React.memo
Both `PromotionalMessageCard` and `PromotionalMessagesContainer` use `React.memo` to prevent unnecessary re-renders.

```javascript
const PromotionalMessageCard = React.memo(({ message, onDismiss }) => {
  // Component implementation
});
```

### useMemo and useCallback
- **useMemo**: Memoize expensive calculations (styling, filtering)
- **useCallback**: Memoize event handlers to prevent child re-renders

```javascript
// Memoized styling calculation
const styles = useMemo(() => {
  return getCardTypeStyles(message.type);
}, [message.type]);

// Memoized event handler
const handleDismiss = useCallback(() => {
  // Dismiss logic
}, [message.id, onDismiss]);
```

### Benefits
- **Reduced Re-renders**: Components only update when props change
- **Better Performance**: Less work during React reconciliation
- **Smoother Animations**: Consistent frame rates
- **Memory Efficiency**: Reduced garbage collection

## 4. Performance Monitoring (`promotional-messages-performance.js`)

### Metrics Tracked
- **Cache Hit Rate**: Percentage of requests served from cache
- **API Call Count**: Number of network requests made
- **Render Times**: Component rendering performance
- **Image Load Times**: Time to load promotional images
- **Component Lifecycle**: Mount/unmount tracking

### Usage
```javascript
// Automatic tracking in development mode
// View metrics in browser console:
performanceMonitor.logSummary();

// Get programmatic access to metrics:
const stats = performanceMonitor.getSummary();
console.log(`Cache hit rate: ${stats.cachePerformance.hitRate}%`);
```

### Benefits
- **Performance Insights**: Identify bottlenecks and optimization opportunities
- **Cache Effectiveness**: Monitor cache hit rates
- **Regression Detection**: Track performance over time
- **Development Aid**: Debug performance issues

## CSS Optimizations

### Shimmer Animation
Efficient CSS-only loading animation:

```css
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.animate-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
```

### Hardware Acceleration
Components use CSS properties that trigger hardware acceleration:

```css
.promotional-message-card {
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
}
```

### Reduced Motion Support
Respects user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-shimmer,
  .animate-pulse,
  .animate-bounce {
    animation: none;
  }
}
```

## Performance Best Practices

### 1. Cache Strategy
- Use appropriate TTL values (5 minutes for promotional content)
- Invalidate cache when data changes (dismissals, new messages)
- Monitor cache hit rates to optimize effectiveness

### 2. Image Optimization
- Use appropriate image formats (WebP when supported)
- Implement responsive images with srcset
- Compress images for web delivery
- Use CDN for image hosting

### 3. Component Design
- Minimize prop drilling with React.memo
- Use useCallback for event handlers passed to children
- Implement proper loading and error states
- Avoid inline object/function creation in render

### 4. Bundle Optimization
- Code splitting for promotional messages module
- Tree shaking to remove unused code
- Minimize bundle size with proper imports

## Monitoring and Debugging

### Development Mode
Performance monitoring is automatically enabled in development:

```javascript
// View performance summary
performanceMonitor.logSummary();

// Check cache statistics
console.log(promotionalMessagesService.getCacheStats());
```

### Production Monitoring
Consider implementing:
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- Error boundary reporting
- Performance budgets

## Future Optimizations

### Potential Improvements
1. **Service Worker Caching**: Offline support and background sync
2. **Image Preloading**: Preload critical promotional images
3. **Virtual Scrolling**: For large numbers of messages
4. **Progressive Enhancement**: Graceful degradation for older browsers
5. **A/B Testing**: Performance impact of different optimization strategies

### Metrics to Track
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)
- Cache hit rates by user segment