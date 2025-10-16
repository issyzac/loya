import clsx from 'clsx'

/**
 * Skeleton loading component that matches the bill card structure
 * Provides accessible loading indicators with proper ARIA labels
 */
export function LoadingSkeleton({ 
  count = 3, 
  className,
  showHeader = false,
  headerText = "Loading...",
  ...props 
}) {
  return (
    <div 
      className={clsx("grid gap-4", className)} 
      role="status" 
      aria-label={`Loading ${count} items`}
      {...props}
    >
      {showHeader && (
        <div className="sr-only" aria-live="polite">
          {headerText}
        </div>
      )}
      
      {Array.from({ length: count }, (_, index) => (
        <div 
          key={index} 
          className="bg-white shadow overflow-hidden sm:rounded-lg animate-pulse"
          aria-hidden="true"
        >
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col space-y-2">
                {/* Bill number skeleton */}
                <div className="h-5 bg-gray-200 rounded w-32"></div>
                {/* Date skeleton */}
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Total amount skeleton */}
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                {/* Chevron icon skeleton */}
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Compact loading skeleton for inline use
 */
export function CompactLoadingSkeleton({ className, ...props }) {
  return (
    <div 
      className={clsx("flex items-center space-x-2", className)}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      <span className="text-sm text-gray-600">Loading...</span>
    </div>
  )
}

/**
 * Button loading spinner for retry operations
 */
export function ButtonLoadingSpinner({ className, size = "sm", ...props }) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4", 
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }
  
  return (
    <div 
      className={clsx(
        "animate-spin rounded-full border-b-2 border-current",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}