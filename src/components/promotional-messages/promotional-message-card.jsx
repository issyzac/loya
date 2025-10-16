import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LazyImage from './lazy-image';

/**
 * PromotionalMessageCard component displays individual promotional messages
 * with dismiss functionality and call-to-action buttons
 * Optimized with React.memo for performance
 */
const PromotionalMessageCard = React.memo(({ 
  message, 
  onDismiss, 
  className = '' 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!message) {
    return null;
  }

  const handleDismiss = useCallback(() => {
    if (!message.dismissible || isAnimating) return;
    
    setIsAnimating(true);
    // Add a small delay for animation before calling onDismiss
    setTimeout(() => {
      onDismiss?.(message.id);
    }, 200);
  }, [message.dismissible, message.id, isAnimating, onDismiss]);

  const handleCtaClick = useCallback(() => {
    if (message.ctaUrl) {
      // Track interaction if needed
      window.open(message.ctaUrl, '_blank', 'noopener,noreferrer');
    }
  }, [message.ctaUrl]);

  // Memoized card styling based on message type for performance
  const styles = useMemo(() => {
    const baseStyles = {
      container: 'rounded-lg border shadow-sm transition-all duration-300 ease-in-out',
      hoverEffect: 'hover:shadow-md hover:-translate-y-0.5',
    };

    switch (message.type) {
      case 'promotion':
        return {
          ...baseStyles,
          background: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200',
          accent: 'text-blue-700',
          accentLight: 'text-blue-600',
          titleColor: 'text-blue-900',
          contentColor: 'text-blue-800',
          dismissHover: 'hover:bg-blue-100/80',
          ctaColor: 'blue'
        };
      case 'announcement':
        return {
          ...baseStyles,
          background: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200',
          accent: 'text-amber-700',
          accentLight: 'text-amber-600',
          titleColor: 'text-amber-900',
          contentColor: 'text-amber-800',
          dismissHover: 'hover:bg-amber-100/80',
          ctaColor: 'amber'
        };
      case 'info':
        return {
          ...baseStyles,
          background: 'bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200',
          accent: 'text-slate-700',
          accentLight: 'text-slate-600',
          titleColor: 'text-slate-900',
          contentColor: 'text-slate-800',
          dismissHover: 'hover:bg-slate-100/80',
          ctaColor: 'zinc'
        };
      default:
        return {
          ...baseStyles,
          background: 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200',
          accent: 'text-gray-700',
          accentLight: 'text-gray-600',
          titleColor: 'text-gray-900',
          contentColor: 'text-gray-800',
          dismissHover: 'hover:bg-gray-100/80',
          ctaColor: 'zinc'
        };
    }
  }, [message.type]);

  return (
    <div 
      className={`
        ${styles.container}
        ${styles.background}
        ${styles.hoverEffect}
        p-4 sm:p-6
        ${isAnimating ? 'opacity-0 scale-95 transform' : 'opacity-100 scale-100'}
        ${isHovered ? 'ring-2 ring-offset-2 ring-blue-200' : ''}
        ${className}
      `}
      role="article"
      aria-labelledby={`promo-title-${message.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with title and dismiss button */}
      <div className="flex items-start justify-between mb-4">
        <h3 
          id={`promo-title-${message.id}`}
          className={`roboto-serif-heading text-lg font-semibold pr-2 leading-tight ${styles.titleColor}`}
        >
          {message.title}
        </h3>
        
        {message.dismissible && (
          <button
            onClick={handleDismiss}
            className={`
              flex-shrink-0 p-1.5 rounded-full
              ${styles.accentLight} ${styles.dismissHover}
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              hover:scale-110 active:scale-95
            `}
            aria-label={`Dismiss ${message.title}`}
            disabled={isAnimating}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Optional promotional image with lazy loading */}
      {message.imageUrl && (
        <div className="mb-5 overflow-hidden rounded-lg">
          <LazyImage
            src={message.imageUrl}
            alt={`Promotional image for ${message.title}`}
            className="w-full h-32 sm:h-40 object-cover transition-transform duration-300 ease-in-out hover:scale-105"
            placeholderClassName="w-full h-32 sm:h-40"
            threshold={0.1}
            rootMargin="100px"
          />
        </div>
      )}

      {/* Message content */}
      <div className="mb-5">
        <p className={`roboto-serif-body text-sm sm:text-base leading-relaxed ${styles.contentColor}`}>
          {message.content}
        </p>
      </div>

      {/* Call-to-action button */}
      {message.ctaText && (
        <div className="flex justify-start">
          <Button
            color={styles.ctaColor}
            onClick={handleCtaClick}
            aria-label={`${message.ctaText} - opens in new tab`}
            className="transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          >
            {message.ctaText}
          </Button>
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
PromotionalMessageCard.displayName = 'PromotionalMessageCard';

export default PromotionalMessageCard;