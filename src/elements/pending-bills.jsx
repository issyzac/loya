
import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import { Text } from '../components/text';
import { pendingBills } from '../api/dummy-data';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Button } from '../components/button';
import { LoadingSkeleton } from '../components/loading-skeleton';
import { ErrorDisplay } from '../components/error-display';
import { useUpdateOrder, useRemovedItems, useUpdateRemovedItems, useCurrentPage } from '../providers/AppProvider';
import { useUser } from '../providers/UserProvider';
import ordersService from '../api/orders-service';
import { transformOrdersResponse } from '../utils/orders-transform';
import { 
  handleGracefulDegradation, 
  processError, 
  trackOperationPerformance,
  ERROR_CATEGORIES 
} from '../utils/error-logger';
import performanceMonitor from '../utils/performance-monitor';

/**
 * Validates customer ID format and content
 * @param {any} customerId - The customer ID to validate
 * @returns {object} Validation result with isValid boolean and error message
 */
const validateCustomerId = (customerId) => {
  if (!customerId) {
    return { isValid: false, error: 'Customer ID is missing' };
  }
  
  if (typeof customerId !== 'string') {
    return { isValid: false, error: 'Customer ID must be a string' };
  }
  
  const trimmedId = customerId.trim();
  if (trimmedId === '') {
    return { isValid: false, error: 'Customer ID cannot be empty' };
  }
  
  // Basic MongoDB ObjectId format validation (24 hex characters)
  if (trimmedId.length === 24 && /^[0-9a-fA-F]{24}$/.test(trimmedId)) {
    return { isValid: true, error: null };
  }
  
  // Reject IDs that are too short (likely invalid)
  if (trimmedId.length < 12) {
    return { isValid: false, error: 'Customer ID appears to be too short' };
  }
  
  // Allow other ID formats for flexibility
  return { isValid: true, error: null };
};

const PendingBills = () => {
  const renderStartTime = useRef(performance.now());
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [customerIdStatus, setCustomerIdStatus] = useState({ resolved: false, error: null });
  const [isComponentMounted, setIsComponentMounted] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  
  // Refs for managing request cancellation and performance optimization
  const abortControllerRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const lastCustomerIdRef = useRef(null);
  const fetchDebounceRef = useRef(null);
  
  // App state hooks
  const { updateCustomerOrder } = useUpdateOrder();
  const removedItems = useRemovedItems();
  const { clearRemovedItems } = useUpdateRemovedItems();
  const currentPage = useCurrentPage();
  const user = useUser();

  // Memoized customer ID resolution to prevent unnecessary re-computations
  const customerIdInfo = useMemo(() => {
    if (!user || typeof user !== 'object') {
      return { customerId: null, error: 'User not logged in' };
    }

    const potentialIds = [user._id, user.customer_id, user.id, user.user_id];
    let customerId = null;
    
    for (const id of potentialIds) {
      if (id) {
        const validation = validateCustomerId(id);
        if (validation.isValid) {
          customerId = id.trim();
          break;
        }
      }
    }
    
    if (!customerId) {
      return { customerId: null, error: 'Customer identification not available' };
    }

    return { customerId, error: null };
  }, [user]);

  // Simplified cache configuration to prevent circular dependencies
  const cacheConfig = useMemo(() => {
    const isFrequentUser = currentPage === 'PendingBills';
    
    return {
      useCache: true,
      cacheTtl: isFrequentUser ? 3 * 60 * 1000 : 5 * 60 * 1000, // 3min for current page, 5min otherwise
      forceRefresh: false,
      enableAggressiveCaching: isFrequentUser
    };
  }, [currentPage]);

  // Optimized customer ID resolution with memoization
  const getCustomerId = useCallback(() => {
    const { customerId, error } = customerIdInfo;
    
    if (customerId) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Resolved customer ID:', customerId);
      }
      setCustomerIdStatus({ resolved: true, error: null });
      return { customerId, error: null };
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Customer ID resolution failed:', error);
      }
      setCustomerIdStatus({ resolved: false, error });
      return { customerId: null, error };
    }
  }, [customerIdInfo]);

  // Function to cancel any ongoing requests and debounced calls
  const cancelOngoingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cancelling ongoing API request');
      }
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current);
      fetchDebounceRef.current = null;
    }
  }, []);

  // Optimized function to load pending bills with caching and performance improvements
  const loadPendingBills = useCallback(async (isRetry = false, options = {}) => {
    const startTime = performance.now();
    
    // Cancel any existing requests before starting a new one
    cancelOngoingRequests();
    
    // Don't proceed if component is unmounted
    if (!isComponentMounted) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Component unmounted, skipping API call');
      }
      return;
    }

    // Simple performance optimization to prevent rapid successive calls
    const now = Date.now();
    const timeSinceLastFetch = lastFetchTime ? (now - lastFetchTime) : Infinity;
    const skipThreshold = 30000; // 30 seconds
    
    if (!isRetry && !options.forceRefresh && timeSinceLastFetch < skipThreshold) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ Skipping fetch - recent data available (${Math.round(timeSinceLastFetch/1000)}s ago)`);
      }
      return;
    }

    try {
      setLoading(true);
      if (!isRetry) {
        setError(null);
      }

      const { customerId, error: customerIdError } = getCustomerId();
      
      if (!customerId) {
        // Process customer ID error with comprehensive logging
        const customerIdErr = new Error(customerIdError || 'Customer ID not available');
        customerIdErr.code = 'CUSTOMER_ID_MISSING';
        
        const processedError = processError(customerIdErr, {
          operation: 'loadPendingBills',
          phase: 'customer_id_resolution',
          isRetry,
          userContext: user ? 'available' : 'unavailable'
        }, 'Unable to identify customer');
        
        // Implement graceful degradation for missing customer ID
        const degradation = handleGracefulDegradation('pending_bills', customerIdErr, pendingBills);
        
        if (isComponentMounted) {
          setError({
            ...processedError,
            requiresAuth: true,
            recoveryGuidance: 'Please sign in again to view your pending bills.'
          });
          
          // Apply degradation strategy
          if (degradation.strategy === 'use_cached_data' || degradation.strategy === 'show_empty_state') {
            setSlips(degradation.fallbackData || pendingBills);
            setFromCache(true);
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Applied graceful degradation: using fallback data for missing customer ID');
            }
          }
        }
        
        trackOperationPerformance('loadPendingBills', startTime, false, customerIdErr);
        return;
      }

      // Check if customer ID changed - invalidate cache if so
      if (lastCustomerIdRef.current && lastCustomerIdRef.current !== customerId) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Customer ID changed, invalidating cache');
        }
        ordersService.invalidateCustomerCache(lastCustomerIdRef.current);
      }
      lastCustomerIdRef.current = customerId;

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (process.env.NODE_ENV === 'development') {
        console.log(`Loading pending bills for customer: ${customerId ? '[REDACTED]' : 'null'}`);
      }
      
      // Use simple cache configuration
      const requestOptions = {
        useCache: true,
        cacheTtl: 5 * 60 * 1000, // 5 minutes
        forceRefresh: false,
        ...options
      };

      const response = await ordersService.getCustomerOpenOrdersWithRetry(
        customerId, 
        'TZS', 
        1, 
        20, 
        3, 
        signal,
        requestOptions
      );
      
      // Check if component is still mounted and request wasn't cancelled
      if (!isComponentMounted || signal.aborted) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Request cancelled or component unmounted');
        }
        return;
      }
      
      if (response.success) {
        const transformedData = transformOrdersResponse(response);
        
        if (transformedData.hasError) {
          const transformError = new Error(transformedData.errorMessage);
          transformError.code = 'DATA_TRANSFORMATION_ERROR';
          throw transformError;
        }
        
        // Only update state if component is still mounted
        if (isComponentMounted) {
          setSlips(transformedData.orders);
          setError(null);
          setRetryCount(0);
          setLastFetchTime(now);
          setFromCache(response.fromCache || false);
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Successfully loaded ${transformedData.orders.length} pending bills ${response.fromCache ? '(from cache)' : '(from API)'}`);
          }
        }
        
        trackOperationPerformance('loadPendingBills', startTime, true);
      } else {
        // Handle API error response
        const apiError = response.error || new Error('Failed to load pending bills');
        throw apiError;
      }
    } catch (err) {
      // Don't handle errors if request was cancelled or component unmounted
      if (!isComponentMounted || err.message?.includes('cancelled') || err.name === 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          console.log('Request cancelled, not handling error');
        }
        return;
      }

      // Process error with comprehensive logging and categorization
      const processedError = processError(err, {
        operation: 'loadPendingBills',
        isRetry,
        retryCount,
        customerId: 'REDACTED',
        userContext: user ? 'available' : 'unavailable'
      }, 'Failed to load pending bills');

      // Implement graceful degradation based on error type
      const degradation = handleGracefulDegradation('pending_bills', err, pendingBills);
      
      // Only update state if component is still mounted
      if (isComponentMounted) {
        // Set comprehensive error information
        setError({
          ...processedError,
          // Add authentication guidance for auth errors
          requiresAuth: processedError.category === ERROR_CATEGORIES.AUTHENTICATION,
          // Provide specific recovery guidance
          recoveryGuidance: processedError.recoveryGuidance || getRecoveryGuidance(processedError.category, isRetry)
        });
        
        // Apply graceful degradation strategy
        switch (degradation.strategy) {
          case 'use_cached_data':
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Applied graceful degradation: using cached data');
            }
            // Keep existing data and show degradation message
            break;
            
          case 'show_empty_state':
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Applied graceful degradation: showing empty state with fallback');
            }
            if (!isRetry && retryCount === 0 && degradation.fallbackData) {
              setSlips(degradation.fallbackData);
              setFromCache(true);
            } else {
              setSlips([]);
            }
            break;
            
          case 'redirect_to_auth':
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Applied graceful degradation: authentication required');
            }
            setSlips([]);
            break;
            
          default:
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Applied graceful degradation: showing error state');
            }
            if (!isRetry && retryCount === 0 && degradation.fallbackData) {
              setSlips(degradation.fallbackData);
              setFromCache(true);
            } else {
              setSlips([]);
            }
        }
      }
      
      trackOperationPerformance('loadPendingBills', startTime, false, err);
    } finally {
      // Only update loading state if component is still mounted
      if (isComponentMounted) {
        setLoading(false);
      }
      
      // Clean up the abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  }, [getCustomerId, retryCount, isComponentMounted, cancelOngoingRequests, user]);

  // Debounced loading function to prevent rapid successive calls
  const debouncedLoadPendingBills = useCallback((isRetry = false, options = {}, delay = 300) => {
    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current);
    }

    fetchDebounceRef.current = setTimeout(() => {
      if (isComponentMounted) {
        loadPendingBills(isRetry, options);
      }
    }, delay);
  }, [loadPendingBills, isComponentMounted]);

  // Helper function to provide context-specific recovery guidance
  const getRecoveryGuidance = (errorCategory, isRetry) => {
    switch (errorCategory) {
      case ERROR_CATEGORIES.NETWORK:
        return isRetry 
          ? 'Still having connection issues. Please check your internet connection and try again later.'
          : 'Please check your internet connection and try again.';
      
      case ERROR_CATEGORIES.AUTHENTICATION:
        return 'Your session has expired. Please sign in again to view your pending bills.';
      
      case ERROR_CATEGORIES.SERVER:
        return isRetry
          ? 'The server is still experiencing issues. Please try again in a few minutes.'
          : 'The server is temporarily unavailable. Please try again in a moment.';
      
      case ERROR_CATEGORIES.RATE_LIMIT:
        return 'You\'ve made too many requests. Please wait 30 seconds before trying again.';
      
      default:
        return isRetry
          ? 'The issue persists. Please contact support if this continues.'
          : 'Please try again. If the problem continues, contact support.';
    }
  };

  // Component mount/unmount lifecycle management with performance tracking
  useEffect(() => {
    const mountStartTime = performance.now();
    setIsComponentMounted(true);
    
    // Record component mount
    performanceMonitor.recordComponentMount('PendingBills');
    
    return () => {
      const mountTime = performance.now() - mountStartTime;
      if (process.env.NODE_ENV === 'development') {
        console.log(`PendingBills component unmounting after ${Math.round(mountTime)}ms, cleaning up...`);
      }
      setIsComponentMounted(false);
      
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Clear any timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  // Initial load effect - only run when component is mounted and user context is available
  useEffect(() => {
    if (isComponentMounted && user !== undefined) {
      // Use debounced loading for initial load to prevent rapid calls
      debouncedLoadPendingBills(false, {}, 100);
    }
  }, [debouncedLoadPendingBills, isComponentMounted, user]);



  // Handle removed items being added back - only when component is mounted
  useEffect(() => {
    if (isComponentMounted && removedItems.length > 0) {
      setSlips(prevSlips => {
        const newSlips = [...prevSlips];
        removedItems.forEach(item => {
          if (!newSlips.some(s => s.slip_id === item.slip_id)) {
            newSlips.push(item);
          }
        });
        return newSlips;
      });
      clearRemovedItems();
    }
  }, [removedItems, clearRemovedItems, isComponentMounted]);

  // Refresh data when returning to pending bills page - with proper lifecycle management
  useEffect(() => {
    if (isComponentMounted && currentPage === 'PendingBills' && user !== undefined) {
      // Use debounced loading when navigating to prevent rapid calls
      debouncedLoadPendingBills(false, {}, 150);
    }
  }, [currentPage, debouncedLoadPendingBills, isComponentMounted, user]);



  // Enhanced retry function with comprehensive error tracking and rate limiting
  const handleRetry = useCallback(() => {
    if (!isComponentMounted) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Component unmounted, skipping retry');
      }
      return;
    }
    
    // Implement retry rate limiting to prevent abuse
    const maxRetries = 5;
    if (retryCount >= maxRetries) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Maximum retry attempts (${maxRetries}) reached`);
      }
      
      // Process max retries error
      const maxRetriesError = new Error(`Maximum retry attempts (${maxRetries}) exceeded`);
      maxRetriesError.code = 'MAX_RETRIES_EXCEEDED';
      
      const processedError = processError(maxRetriesError, {
        operation: 'handleRetry',
        retryCount,
        maxRetries,
        originalError: error
      }, 'Too many retry attempts');
      
      setError({
        ...processedError,
        isRetryable: false,
        recoveryGuidance: 'Please refresh the page or contact support if the problem persists.'
      });
      
      return;
    }
    
    // Log retry attempt with context
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 User initiated retry attempt ${retryCount + 1}/${maxRetries}`);
    }
    
    // Track retry performance
    const retryStartTime = performance.now();
    
    setRetryCount(prev => {
      const newCount = prev + 1;
      
      // Log retry context for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Retry context:', {
          attempt: newCount,
          maxRetries,
          previousError: error?.code,
          errorCategory: error?.category,
          isRetryable: error?.isRetryable
        });
      }
      
      return newCount;
    });
    
    // Clear previous error state before retry
    setError(null);
    
    // Initiate retry with enhanced tracking - use immediate loading for retries
    loadPendingBills(true, { forceRefresh: true }).then(() => {
      trackOperationPerformance('handleRetry', retryStartTime, true);
    }).catch((retryError) => {
      trackOperationPerformance('handleRetry', retryStartTime, false, retryError);
    });
  }, [loadPendingBills, isComponentMounted, retryCount, error]);

  // Handle payment action - with proper lifecycle checks
  const handlePay = useCallback((slip) => {
    if (!isComponentMounted) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Component unmounted, skipping payment action');
      }
      return;
    }
    
    updateCustomerOrder(slip);
    setSlips(prevSlips => prevSlips.filter(s => s.slip_id !== slip.slip_id));
  }, [updateCustomerOrder, isComponentMounted]);


  // Memoized debug information component (only shown in development)
  const DebugInfo = memo(() => {
    const cacheStats = ordersService.getCacheStats();
    const perfMetrics = performanceMonitor.getMetrics();
    const perfInsights = performanceMonitor.getInsights();
    
    return (
      <div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs">
        <strong>Debug Info:</strong>
        <br />
        Component Mounted: {isComponentMounted ? '✅ Yes' : '❌ No'}
        <br />
        Current Page: {currentPage}
        <br />
        Customer ID Status: {customerIdStatus.resolved ? '✅ Resolved' : '❌ Not Resolved'}
        {customerIdStatus.error && <><br />Error: {customerIdStatus.error}</>}
        <br />
        User Object: {user ? 'Present' : 'Missing'}
        {user && <><br />Available ID fields: {Object.keys(user).filter(key => key.includes('id') || key === '_id').join(', ') || 'None'}</>}
        <br />
        Active Request: {abortControllerRef.current ? '🔄 Yes' : '❌ No'}
        <br />
        Retry Count: {retryCount}
        <br />
        Removed Items Count: {removedItems.length}
        <br />
        Using Fallback Data: {slips === pendingBills ? 'Yes' : 'No'}
        <br />
        From Cache: {fromCache ? '📦 Yes' : '🌐 No'}
        <br />
        Last Fetch: {lastFetchTime ? new Date(lastFetchTime).toLocaleTimeString() : 'Never'}
        <br />
        <strong>Cache Performance:</strong>
        <br />
        Cache Hit Rate: {(cacheStats.cache.hitRate * 100).toFixed(1)}%
        <br />
        Request Dedup Rate: {(cacheStats.requests.deduplicationRate * 100).toFixed(1)}%
        <br />
        Pending Requests: {cacheStats.requests.pendingCount}
        <br />
        Cache Config: TTL={Math.round(cacheConfig.cacheTtl/1000)}s, Aggressive={cacheConfig.enableAggressiveCaching ? 'Yes' : 'No'}
        <br />
        <strong>Performance Metrics:</strong>
        <br />
        Avg Response Time: {perfMetrics.avgResponseTime}ms
        <br />
        Avg Render Time: {perfMetrics.avgRenderTime}ms
        <br />
        API Calls: {perfMetrics.apiCalls}
        <br />
        Performance Score: {perfInsights.score}/100
        {perfInsights.warnings.length > 0 && (
          <>
            <br />
            <strong style={{color: 'orange'}}>Warnings:</strong>
            {perfInsights.warnings.map((warning, i) => (
              <><br key={i} />⚠️ {warning}</>
            ))}
          </>
        )}
      </div>
    );
  });

  // Track render performance
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    performanceMonitor.recordRenderTime('PendingBills', renderTime);
    renderStartTime.current = performance.now(); // Reset for next render
  });

  return (
    <div className="">
      <h4 className='roboto-serif-heading'>Your Pending Bills</h4>
      
      {/* Debug information for development */}
      {process.env.NODE_ENV === 'development' && <DebugInfo />}
      
      {/* Customer ID resolution warning */}
      {!customerIdStatus.resolved && !loading && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Using sample data because customer identification is not available. 
                {customerIdStatus.error && ` (${customerIdStatus.error})`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cache status indicator (only show when data is from cache) */}
      {fromCache && !loading && !error && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-xs text-green-700">
                📦 Data loaded from cache for faster performance
                {lastFetchTime && ` • Last updated: ${new Date(lastFetchTime).toLocaleTimeString()}`}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <LoadingSkeleton 
          count={3} 
          className="mt-4"
          showHeader={true}
          headerText="Loading your pending bills..."
        />
      )}
      
      {/* Error state */}
      {!loading && error && (
        <ErrorDisplay 
          error={error} 
          onRetry={error?.isRetryable ? handleRetry : null}
          isRetrying={loading}
          className="mt-4"
        />
      )}
      
      {/* Success state - show bills or empty message */}
      {!loading && !error && (
        <>
          {slips.length === 0 ? (
            <Text>You have no pending bills.</Text>
          ) : (
            <div className="grid gap-4 mt-4">
              {slips.map((slip) => (
                <Disclosure as="div" key={slip.slip_id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                  {({ open, close }) => (
                    <>
                      <DisclosureButton className="w-full flex justify-between items-center p-4 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset">
                        <div className="flex items-center">
                          <div className="flex flex-col">
                            <span className="font-medium text-lg">{slip.slip_number}</span>
                            <span className="text-sm text-gray-500">{new Date(slip.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-xl">{slip.grand_total}</span>
                          </div>
                          <ChevronDownIcon className={`${open ? 'transform rotate-180' : ''} w-5 h-5 ml-2 transition-transform duration-200`} />
                        </div>
                      </DisclosureButton>
                      <DisclosurePanel className="p-4 border-t bg-gray-50">
                        <ul className="space-y-2">
                          {slip.items.map((item) => (
                            <li key={item.item_id} className="flex justify-between py-1">
                              <span className="text-gray-700">{item.item_name} (x{item.quantity})</span>
                              <span className="font-medium">{item.price_total}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex justify-end mt-4 space-x-2">
                          <Button 
                            onClick={() => close()}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Close
                          </Button>
                          <Button 
                            onClick={() => { handlePay(slip); close(); }}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Pay
                          </Button>
                        </div>
                      </DisclosurePanel>
                    </>
                  )}
                </Disclosure>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PendingBills;

