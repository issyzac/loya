import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  BanknotesIcon,
  CreditCardIcon,
  WalletIcon
} from '@heroicons/react/16/solid';

// Status badge component
export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true, 
  customText,
  className = '' 
}) {
  const getStatusConfig = (status) => {
    const configs = {
      // Payment statuses
      'paid': {
        text: 'Paid',
        icon: CheckCircleIcon,
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      'pending': {
        text: 'Pending',
        icon: ClockIcon,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      'failed': {
        text: 'Failed',
        icon: XCircleIcon,
        className: 'bg-red-100 text-red-800 border-red-200'
      },
      'processing': {
        text: 'Processing',
        icon: ClockIcon,
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      },

      // Credit slip statuses
      'open': {
        text: 'Open',
        icon: ExclamationTriangleIcon,
        className: 'bg-red-100 text-red-800 border-red-200'
      },
      'partially_paid': {
        text: 'Partially Paid',
        icon: ClockIcon,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      'closed': {
        text: 'Closed',
        icon: CheckCircleIcon,
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      'void': {
        text: 'Void',
        icon: XCircleIcon,
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      },

      // Account statuses
      'active': {
        text: 'Active',
        icon: CheckCircleIcon,
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      'inactive': {
        text: 'Inactive',
        icon: XCircleIcon,
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      'suspended': {
        text: 'Suspended',
        icon: ExclamationTriangleIcon,
        className: 'bg-red-100 text-red-800 border-red-200'
      },

      // Transaction statuses
      'success': {
        text: 'Success',
        icon: CheckCircleIcon,
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      'error': {
        text: 'Error',
        icon: XCircleIcon,
        className: 'bg-red-100 text-red-800 border-red-200'
      },
      'warning': {
        text: 'Warning',
        icon: ExclamationTriangleIcon,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      'info': {
        text: 'Info',
        icon: InformationCircleIcon,
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    };

    return configs[status.toLowerCase()] || configs.info;
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border
      ${config.className}
      ${sizeClasses[size]}
      ${className}
    `}>
      {showIcon && (
        <IconComponent className={`${iconSizes[size]} mr-1`} />
      )}
      {customText || config.text}
    </span>
  );
}

// Balance status indicator
export function BalanceStatus({ 
  walletCents, 
  outstandingCents, 
  showDetails = false 
}) {
  const hasBalance = walletCents > 0;
  const hasOutstanding = outstandingCents > 0;
  
  const getStatus = () => {
    if (hasOutstanding && hasBalance) return 'mixed';
    if (hasOutstanding) return 'outstanding';
    if (hasBalance) return 'credit';
    return 'clear';
  };

  const getConfig = (status) => {
    const configs = {
      'credit': {
        text: 'Has Credit',
        icon: WalletIcon,
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      'outstanding': {
        text: 'Outstanding Balance',
        icon: ExclamationTriangleIcon,
        className: 'bg-red-100 text-red-800 border-red-200'
      },
      'mixed': {
        text: 'Mixed Balance',
        icon: InformationCircleIcon,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      'clear': {
        text: 'Clear',
        icon: CheckCircleIcon,
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    };
    return configs[status];
  };

  const status = getStatus();
  const config = getConfig(status);
  const IconComponent = config.icon;

  return (
    <div className="flex items-center space-x-2">
      <span className={`
        inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border
        ${config.className}
      `}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </span>
      
      {showDetails && (
        <div className="text-xs text-gray-600">
          {hasBalance && `Credit: TZS ${(walletCents / 100).toLocaleString()}`}
          {hasBalance && hasOutstanding && ' | '}
          {hasOutstanding && `Owes: TZS ${(outstandingCents / 100).toLocaleString()}`}
        </div>
      )}
    </div>
  );
}

// Transaction type indicator
export function TransactionTypeIndicator({ type, direction, amount }) {
  const getTypeConfig = (type, direction) => {
    const configs = {
      'SALE_ON_CREDIT': {
        text: 'Credit Sale',
        icon: BanknotesIcon,
        className: 'bg-orange-100 text-orange-800 border-orange-200'
      },
      'PAYMENT': {
        text: 'Payment',
        icon: CreditCardIcon,
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      'CHANGE_TO_BALANCE': {
        text: 'Change Stored',
        icon: WalletIcon,
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      'BALANCE_CONSUMPTION': {
        text: 'Wallet Applied',
        icon: WalletIcon,
        className: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      'DEPOSIT': {
        text: 'Deposit',
        icon: BanknotesIcon,
        className: 'bg-green-100 text-green-800 border-green-200'
      }
    };

    return configs[type] || {
      text: type,
      icon: InformationCircleIcon,
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };

  const config = getTypeConfig(type, direction);
  const IconComponent = config.icon;

  return (
    <div className="flex items-center space-x-2">
      <span className={`
        inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border
        ${config.className}
      `}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </span>
      
      {direction && (
        <span className={`
          text-xs font-medium
          ${direction === 'CREDIT' ? 'text-green-600' : 'text-red-600'}
        `}>
          {direction === 'CREDIT' ? '+' : '-'}{amount}
        </span>
      )}
    </div>
  );
}

// Progress indicator for multi-step processes
export function ProgressIndicator({ 
  steps, 
  currentStep, 
  variant = 'horizontal' 
}) {
  if (variant === 'vertical') {
    return (
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`
              flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
              ${index < currentStep ? 'bg-green-500 text-white' :
                index === currentStep ? 'bg-blue-500 text-white' :
                'bg-gray-300 text-gray-600'}
            `}>
              {index < currentStep ? (
                <CheckCircleIcon className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`
              ml-3 text-sm
              ${index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-500'}
            `}>
              {step}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
            ${index < currentStep ? 'bg-green-500 text-white' :
              index === currentStep ? 'bg-blue-500 text-white' :
              'bg-gray-300 text-gray-600'}
          `}>
            {index < currentStep ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={`
              w-12 h-0.5 mx-2
              ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}
            `} />
          )}
        </div>
      ))}
    </div>
  );
}

// Connection status indicator
export function ConnectionStatus({ isOnline = true, lastSync }) {
  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className={`
        w-2 h-2 rounded-full
        ${isOnline ? 'bg-green-500' : 'bg-red-500'}
      `} />
      <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {lastSync && (
        <span className="text-gray-500">
          • Last sync: {new Date(lastSync).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// Loading dots animation
export function LoadingDots({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  };

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${sizeClasses[size]} bg-current rounded-full animate-pulse
          `}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
}