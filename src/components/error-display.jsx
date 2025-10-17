import { ExclamationTriangleIcon, XCircleIcon, WifiIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { Button } from './button'
import { ButtonLoadingSpinner } from './loading-skeleton'

/**
 * Error display component with retry functionality
 * Provides accessible error messages and recovery options
 */
export function ErrorDisplay({ 
  error, 
  onRetry, 
  isRetrying = false,
  className,
  showIcon = true,
  size = "default",
  ...props 
}) {
  if (!error) return null

  // Determine error type and styling
  const isAuthError = error.requiresAuth || error.code === 'CUSTOMER_ID_MISSING'
  const isNetworkError = error.code === 'NETWORK_ERROR'
  const isWarning = error.severity === 'warning' || isAuthError
  
  // Color schemes based on error type
  const colorScheme = isWarning 
    ? {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-400',
        title: 'text-yellow-800',
        message: 'text-yellow-700',
        button: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'
      }
    : {
        bg: 'bg-red-50',
        border: 'border-red-200', 
        icon: 'text-red-400',
        title: 'text-red-800',
        message: 'text-red-700',
        button: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300'
      }

  // Size variants
  const sizeClasses = {
    compact: 'p-3',
    default: 'p-4',
    large: 'p-6'
  }

  // Choose appropriate icon
  const ErrorIcon = isNetworkError ? WifiIcon : 
                   isWarning ? ExclamationTriangleIcon : 
                   XCircleIcon

  // Generate error title
  const getErrorTitle = () => {
    if (isAuthError) return 'Authentication Required'
    if (isNetworkError) return 'Connection Problem'
    return 'Unable to Load Data'
  }

  return (
    <div 
      className={clsx(
        colorScheme.bg,
        colorScheme.border,
        'border rounded-lg',
        sizeClasses[size],
        className
      )}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <div className="flex items-start">
        {showIcon && (
          <ErrorIcon 
            className={clsx(
              'h-5 w-5 mt-0.5 mr-3 flex-shrink-0',
              colorScheme.icon
            )} 
            aria-hidden="true"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className={clsx('text-sm font-medium', colorScheme.title)}>
            {getErrorTitle()}
          </h3>
          
          <p className={clsx('mt-1 text-sm', colorScheme.message)}>
            {error.message}
          </p>
          
          {/* Action buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {error.isRetryable && onRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                className={clsx(
                  colorScheme.button,
                  'text-sm px-3 py-1.5',
                  isRetrying && 'opacity-75 cursor-not-allowed'
                )}
                size="sm"
                aria-describedby="retry-description"
              >
                {isRetrying ? (
                  <>
                    <ButtonLoadingSpinner size="xs" className="mr-2" />
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </Button>
            )}
            
            {isAuthError && (
              <Button
                onClick={() => {
                  // Navigate to login page - this could be enhanced with proper routing
                  window.location.href = '/login'
                }}
                className="bg-yellow-600 text-white hover:bg-yellow-700 text-sm px-3 py-1.5"
                size="sm"
              >
                Sign In
              </Button>
            )}
          </div>
          
          {/* Screen reader description for retry button */}
          {error.isRetryable && (
            <div id="retry-description" className="sr-only">
              Click to retry loading the data. This may help resolve temporary connection issues.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Compact error display for inline use
 */
export function CompactErrorDisplay({ error, onRetry, isRetrying, className, ...props }) {
  if (!error) return null
  
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      isRetrying={isRetrying}
      size="compact"
      className={clsx('mt-2', className)}
      {...props}
    />
  )
}

/**
 * Network status indicator for connection issues
 */
export function NetworkStatusIndicator({ isOnline = true, className, ...props }) {
  if (isOnline) return null
  
  return (
    <div 
      className={clsx(
        'flex items-center space-x-2 p-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-600',
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <WifiIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
      <span>You appear to be offline. Some features may not work properly.</span>
    </div>
  )
}