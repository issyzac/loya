import React, { useState, useRef, useEffect, useCallback } from 'react';
import performanceMonitor from '../../utils/promotional-messages-performance';

/**
 * LazyImage component with intersection observer for performance optimization
 * Loads images only when they're about to enter the viewport
 */
const LazyImage = React.memo(({ 
  src, 
  alt = '', 
  className = '',
  placeholderClassName = '',
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(process.env.NODE_ENV === 'test'); // Immediately show in test environment
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const loadStartTime = useRef(null);

  // Set up intersection observer
  useEffect(() => {
    const currentRef = imgRef.current;
    
    if (!currentRef || isInView) {
      return;
    }

    // Check if IntersectionObserver is available (not in test environment)
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for test environment - immediately show image
      setIsInView(true);
      loadStartTime.current = performance.now();
      return;
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            loadStartTime.current = performance.now();
            // Disconnect observer once image is in view
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    // Start observing
    observerRef.current.observe(currentRef);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isInView, threshold, rootMargin]);

  // Handle image load
  const handleLoad = useCallback((event) => {
    setIsLoaded(true);
    setHasError(false);
    
    // Record image load time for performance monitoring
    if (loadStartTime.current) {
      const loadTime = performance.now() - loadStartTime.current;
      performanceMonitor.endTiming(`image-${src}`, 'imageLoad');
      loadStartTime.current = null;
    }
    
    onLoad?.(event);
  }, [onLoad, src]);

  // Handle image error
  const handleError = useCallback((event) => {
    setHasError(true);
    setIsLoaded(false);
    onError?.(event);
  }, [onError]);

  // Placeholder component
  const Placeholder = () => (
    <div 
      className={`
        bg-gradient-to-br from-gray-100 to-gray-200 
        animate-pulse flex items-center justify-center
        ${placeholderClassName || className}
      `}
      aria-label="Loading image..."
    >
      <svg 
        className="w-8 h-8 text-gray-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      </svg>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div 
      className={`
        bg-gradient-to-br from-red-50 to-red-100 
        border border-red-200 flex items-center justify-center
        ${placeholderClassName || className}
      `}
      aria-label="Failed to load image"
    >
      <svg 
        className="w-8 h-8 text-red-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
        />
      </svg>
    </div>
  );

  return (
    <div ref={imgRef} className="relative overflow-hidden">
      {/* Show placeholder while not in view or loading */}
      {(!isInView || (!isLoaded && !hasError)) && <Placeholder />}
      
      {/* Show error state if image failed to load */}
      {hasError && <ErrorState />}
      
      {/* Actual image - only render when in view */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`
            ${className}
            transition-opacity duration-300 ease-in-out
            ${isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}
          `}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;