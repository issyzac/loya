import { useState, useEffect } from 'react';
import { Button } from '../../../../components/button';
import { 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  WifiIcon,
  ServerIcon,
  ClockIcon
} from '@heroicons/react/16/solid';

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
const MAX_AUTO_RETRIES = 3;

export default function RetryHandler({ 
  onRetry, 
  error, 
  maxRetries = 5,
  autoRetry = false,
  className = ''
}) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [nextRetryIn, setNextRetryIn] = useState(0);

  useEffect(() => {
    if (autoRetry && retryCount < MAX_AUTO_RETRIES && error) {
      const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
      setNextRetryIn(delay / 1000);
      
      const countdownInterval = setInterval(() => {
        setNextRetryIn(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            handleRetry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [error, retryCount, autoRetry]);

  const handleRetry = async () => {
    if (retryCount >= maxRetries) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      await onRetry();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorIcon = () => {
    if (!error?.error?.code) return ExclamationTriangleIcon;
    
    switch (error.error.code) {
      case 'NETWORK_ERROR':
        return WifiIcon;
      case 'SERVER_ERROR':
        return ServerIcon;
      case 'TIMEOUT_ERROR':
        return ClockIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const getRetryMessage = () => {
    if (retryCount === 0) return 'Try again';
    if (retryCount >= maxRetries) return 'Max retries reached';
    return `Retry (${retryCount}/${maxRetries})`;
  };

  const ErrorIcon = getErrorIcon();
  const canRetry = retryCount < maxRetries;
  const isAutoRetrying = autoRetry && retryCount < MAX_AUTO_RETRIES && nextRetryIn > 0;

  return (
    <div className={`text-center p-6 ${className}`}>
      <ErrorIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {error?.error?.code === 'NETWORK_ERROR' ? 'Connection Problem' :
         error?.error?.code === 'SERVER_ERROR' ? 'Server Error' :
         error?.error?.code === 'TIMEOUT_ERROR' ? 'Request Timeout' :
         'Something went wrong'}
      </h3>
      
      <p className="text-gray-600 mb-6">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>

      {/* Auto Retry Countdown */}
      {isAutoRetrying && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center">
            <ArrowPathIcon className="h-4 w-4 text-blue-600 animate-spin mr-2" />
            <span className="text-blue-800 text-sm">
              Auto-retrying in {nextRetryIn} second{nextRetryIn !== 1 ? 's' : ''}...
            </span>
          </div>
        </div>
      )}

      {/* Retry Statistics */}
      {retryCount > 0 && (
        <div className="mb-4 text-sm text-gray-500">
          <p>Retry attempts: {retryCount}/{maxRetries}</p>
          {retryCount >= MAX_AUTO_RETRIES && (
            <p className="text-orange-600">Auto-retry disabled. Manual retry required.</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={handleRetry}
          disabled={!canRetry || isRetrying || isAutoRetrying}
          color={canRetry ? 'blue' : 'gray'}
        >
          {isRetrying ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              {getRetryMessage()}
            </>
          )}
        </Button>

        <Button
          outline
          onClick={() => window.location.href = '/staff/wallet'}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Network Status Indicator */}
      {error?.error?.code === 'NETWORK_ERROR' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <WifiIcon className="h-4 w-4 inline mr-1" />
            Check your internet connection and try again
          </p>
        </div>
      )}

      {/* Tips for Users */}
      {retryCount >= 2 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-left">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Troubleshooting Tips:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Refresh the page and try again</li>
            <li>• Contact support if the problem persists</li>
            {error?.error?.code === 'SERVER_ERROR' && (
              <li>• The server may be temporarily unavailable</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Hook for managing retry state
export function useRetryHandler(asyncFunction, options = {}) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  });

  const { maxRetries = 5, autoRetry = false } = options;

  const execute = async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFunction(...args);
      setState(prev => ({ 
        ...prev, 
        data: result, 
        loading: false, 
        error: null,
        retryCount: 0 
      }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error,
        retryCount: prev.retryCount + 1
      }));
      throw error;
    }
  };

  const retry = () => execute();

  const reset = () => {
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0
    });
  };

  return {
    ...state,
    execute,
    retry,
    reset,
    canRetry: state.retryCount < maxRetries
  };
}