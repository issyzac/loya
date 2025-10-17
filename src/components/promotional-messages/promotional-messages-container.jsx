import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PromotionalMessageCard from './promotional-message-card';
import promotionalMessagesService from '../../api/promotional-messages-service';
import performanceMonitor from '../../utils/promotional-messages-performance';

/**
 * PromotionalMessagesContainer component manages the display of promotional messages
 * with state management, loading states, and dismiss functionality
 * Optimized with React.memo for performance
 */
const PromotionalMessagesContainer = React.memo(({ 
  className = '',
  maxMessages = 5,
  refreshInterval = 300000 // 5 minutes default
}) => {
  // Component state
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissedMessages, setDismissedMessages] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Performance monitoring
  useEffect(() => {
    const componentId = `container-${Date.now()}`;
    performanceMonitor.recordComponentMount();
    performanceMonitor.startTiming(componentId);

    return () => {
      performanceMonitor.recordComponentUnmount();
      performanceMonitor.endTiming(componentId, 'render');
    };
  }, []);

  // Load dismissed messages from localStorage on component mount
  useEffect(() => {
    const loadDismissedMessages = () => {
      try {
        const stored = localStorage.getItem('dismissedPromotionalMessages');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Ensure we have an array and convert to Set
          if (Array.isArray(parsed)) {
            setDismissedMessages(new Set(parsed));
          }
        }
      } catch (error) {
        console.warn('Failed to load dismissed messages from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('dismissedPromotionalMessages');
      }
    };

    loadDismissedMessages();
  }, []);

  // Save dismissed messages to localStorage whenever the set changes
  useEffect(() => {
    try {
      const dismissedArray = Array.from(dismissedMessages);
      localStorage.setItem('dismissedPromotionalMessages', JSON.stringify(dismissedArray));
    } catch (error) {
      console.warn('Failed to save dismissed messages to localStorage:', error);
    }
  }, [dismissedMessages]);

  // Fetch messages from API
  const fetchMessages = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await promotionalMessagesService.getActiveMessages({
        limit: maxMessages * 2 // Fetch more to account for dismissed messages
      });

      if (response.success) {
        // Process messages to ensure proper date parsing
        const processedMessages = response.data.messages.map(message => ({
          ...message,
          startDate: new Date(message.startDate),
          endDate: message.endDate ? new Date(message.endDate) : null,
          createdAt: new Date(message.createdAt),
          updatedAt: new Date(message.updatedAt)
        }));

        setMessages(processedMessages);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch promotional messages');
      }
    } catch (err) {
      console.error('Error fetching promotional messages:', err);
      setError({
        message: err.message || 'Failed to load promotional messages',
        isRetryable: true
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [maxMessages]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchMessages(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [fetchMessages, refreshInterval]);

  // Filter active, non-dismissed messages
  const activeMessages = useMemo(() => {
    const now = new Date();
    
    return messages
      .filter(message => {
        // Check if message is not dismissed
        if (dismissedMessages.has(message.id)) {
          return false;
        }

        // Check if message is currently active (within date range)
        const isAfterStart = message.startDate <= now;
        const isBeforeEnd = !message.endDate || message.endDate >= now;
        
        return isAfterStart && isBeforeEnd;
      })
      .sort((a, b) => {
        // Sort by priority (higher priority first), then by creation date (newer first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.createdAt - a.createdAt;
      })
      .slice(0, maxMessages); // Limit to maxMessages
  }, [messages, dismissedMessages, maxMessages]);

  // Handle message dismissal with optimistic updates
  const handleDismiss = useCallback(async (messageId) => {
    // Optimistic update - immediately add to dismissed set
    setDismissedMessages(prev => new Set([...prev, messageId]));

    try {
      // Attempt to dismiss on server
      const response = await promotionalMessagesService.dismissMessage(messageId);
      
      if (!response.success) {
        // Rollback on failure
        setDismissedMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
        
        // Show error but don't block UI
        console.error('Failed to dismiss message on server:', response.error);
        setError({
          message: 'Failed to save dismissal preference. Message may reappear.',
          isRetryable: false
        });
      }
    } catch (err) {
      // Rollback on error
      setDismissedMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
      
      console.error('Error dismissing message:', err);
      setError({
        message: 'Failed to save dismissal preference. Message may reappear.',
        isRetryable: false
      });
    }
  }, []);

  // Retry function for error states
  const handleRetry = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Clear error after a timeout
  useEffect(() => {
    if (error && !error.isRetryable) {
      const timeout = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  // Memoized loading skeleton component for performance
  const LoadingSkeleton = useMemo(() => () => (
    <div className="space-y-4">
      {[...Array(2)].map((_, index) => (
        <div 
          key={index}
          className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 shadow-sm p-4 sm:p-6 animate-pulse"
        >
          {/* Header skeleton */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md w-3/4 animate-shimmer"></div>
            </div>
            <div className="h-6 w-6 bg-gray-200 rounded-full flex-shrink-0"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-3 mb-5">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-5/6 animate-shimmer"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-4/6 animate-shimmer"></div>
          </div>
          
          {/* CTA button skeleton */}
          <div className="h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-28 animate-shimmer"></div>
        </div>
      ))}
    </div>
  ), []);

  // Memoized empty state component for performance
  const EmptyState = useMemo(() => () => (
    <div className="text-center py-12 px-6">
      <div className="mb-4 relative">
        {/* Animated background circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full animate-pulse"></div>
        </div>
        
        {/* Main icon */}
        <div className="relative">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400 animate-bounce" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v1M7 4V3a1 1 0 011-1v1m8 0H8m0 0v11a2 2 0 002 2h4a2 2 0 002-2V4" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 12l2 2 4-4" 
            />
          </svg>
        </div>
      </div>
      
      <h3 className="roboto-serif-heading text-lg font-semibold text-gray-700 mb-2">
        All caught up!
      </h3>
      <p className="roboto-serif-body text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
        Stay tuned for exciting updates, special offers, and important announcements.
      </p>
      
      {/* Decorative elements */}
      <div className="mt-6 flex justify-center space-x-2">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          ></div>
        ))}
      </div>
    </div>
  ), []);

  // Memoized error state component for performance
  const ErrorState = useMemo(() => () => (
    <div className="text-center py-12 px-6">
      <div className="mb-6 relative">
        {/* Animated background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full animate-pulse"></div>
        </div>
        
        {/* Error icon */}
        <div className="relative">
          <svg 
            className="mx-auto h-12 w-12 text-red-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
      </div>
      
      <h3 className="roboto-serif-heading text-lg font-semibold text-gray-700 mb-3">
        Something went wrong
      </h3>
      <p className="roboto-serif-body text-sm text-gray-600 mb-6 max-w-sm mx-auto leading-relaxed">
        {error.message}
      </p>
      
      {error.isRetryable && (
        <button
          onClick={handleRetry}
          className="
            inline-flex items-center px-4 py-2.5 border border-gray-300 
            shadow-sm text-sm font-medium rounded-lg 
            text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            transition-all duration-200 ease-in-out hover:scale-105 active:scale-95
          "
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      )}
    </div>
  ), [error, handleRetry]);

  // Main render
  return (
    <div className={`promotional-messages-container ${className}`}>
      {/* Enhanced refresh indicator */}
      {isRefreshing && (
        <div className="mb-4 text-center">
          <div className="inline-flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700 font-medium">
            <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Updating messages...
          </div>
        </div>
      )}

      {/* Enhanced error banner */}
      {error && !loading && (
        <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="roboto-serif-body text-sm text-red-800 font-medium">{error.message}</p>
            </div>
            <div className="ml-3 flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600 transition-colors duration-150"
                aria-label="Dismiss error"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error && error.isRetryable ? (
        <ErrorState />
      ) : activeMessages.length > 0 ? (
        <div className="space-y-4">
          {activeMessages.map((message) => (
            <PromotionalMessageCard
              key={message.id}
              message={message}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
});

// Add display name for debugging
PromotionalMessagesContainer.displayName = 'PromotionalMessagesContainer';

export default PromotionalMessagesContainer;