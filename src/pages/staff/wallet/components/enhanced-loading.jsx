import { 
  ArrowPathIcon, 
  WalletIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/react/16/solid';

const LOADING_TYPES = {
  default: {
    icon: ArrowPathIcon,
    message: 'Loading...',
    color: 'blue'
  },
  wallet: {
    icon: WalletIcon,
    message: 'Loading wallet data...',
    color: 'green'
  },
  customer: {
    icon: UsersIcon,
    message: 'Searching for customer...',
    color: 'blue'
  },
  payment: {
    icon: CreditCardIcon,
    message: 'Processing payment...',
    color: 'purple'
  },
  credit: {
    icon: ClipboardDocumentListIcon,
    message: 'Creating credit slip...',
    color: 'orange'
  },
  change: {
    icon: BanknotesIcon,
    message: 'Storing change...',
    color: 'yellow'
  }
};

export default function EnhancedLoading({ 
  type = 'default', 
  message, 
  size = 'md',
  showProgress = false,
  progress = 0,
  className = ''
}) {
  const config = LOADING_TYPES[type] || LOADING_TYPES.default;
  const IconComponent = config.icon;
  const displayMessage = message || config.message;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const containerClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
      {/* Loading Icon */}
      <div className="relative">
        <IconComponent 
          className={`${sizeClasses[size]} text-${config.color}-600 animate-spin`}
        />
        {/* Pulse effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} bg-${config.color}-200 rounded-full animate-ping opacity-25`}></div>
      </div>

      {/* Loading Message */}
      <p className={`mt-3 text-${config.color}-800 font-medium ${
        size === 'sm' ? 'text-xs' : 
        size === 'md' ? 'text-sm' : 
        size === 'lg' ? 'text-base' : 'text-lg'
      }`}>
        {displayMessage}
      </p>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-full max-w-xs mt-3">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className={`bg-${config.color}-600 h-2 rounded-full transition-all duration-300 ease-out`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}
    </div>
  );
}

// Specific loading components for common use cases
export function WalletLoading({ message, size = 'md' }) {
  return <EnhancedLoading type="wallet" message={message} size={size} />;
}

export function CustomerLoading({ message, size = 'md' }) {
  return <EnhancedLoading type="customer" message={message} size={size} />;
}

export function PaymentLoading({ message, size = 'md', showProgress, progress }) {
  return (
    <EnhancedLoading 
      type="payment" 
      message={message} 
      size={size} 
      showProgress={showProgress}
      progress={progress}
    />
  );
}

export function CreditSlipLoading({ message, size = 'md' }) {
  return <EnhancedLoading type="credit" message={message} size={size} />;
}

export function ChangeLoading({ message, size = 'md' }) {
  return <EnhancedLoading type="change" message={message} size={size} />;
}

// Loading overlay for forms
export function LoadingOverlay({ isVisible, type = 'default', message }) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
      <EnhancedLoading type={type} message={message} size="lg" />
    </div>
  );
}

// Skeleton loading for lists
export function SkeletonList({ count = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton loading for cards
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`animate-pulse bg-white p-6 rounded-lg shadow ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );
}