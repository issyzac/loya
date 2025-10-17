import { useState, useEffect, createContext, useContext } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/16/solid';

// Notification Context
const NotificationContext = createContext();

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Notification Provider
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const success = (message, options = {}) => 
    addNotification({ ...options, type: 'success', message });

  const error = (message, options = {}) => 
    addNotification({ ...options, type: 'error', message, duration: 8000 });

  const warning = (message, options = {}) => 
    addNotification({ ...options, type: 'warning', message });

  const info = (message, options = {}) => 
    addNotification({ ...options, type: 'info', message });

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

// Individual Notification Component
function Notification({ notification, onRemove }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return CheckCircleIcon;
      case 'error':
        return XCircleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getStyles = () => {
    const baseStyles = 'border-l-4 shadow-lg';
    switch (notification.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-400`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-400`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-400`;
      default:
        return `${baseStyles} bg-blue-50 border-blue-400`;
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  const IconComponent = getIcon();

  return (
    <div
      className={`
        max-w-sm w-full bg-white rounded-lg pointer-events-auto overflow-hidden
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getStyles()}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <IconComponent className={`h-5 w-5 ${getIconColor()}`} />
          </div>
          <div className="ml-3 w-0 flex-1">
            {notification.title && (
              <p className={`text-sm font-semibold ${getTextColor()}`}>
                {notification.title}
              </p>
            )}
            <p className={`text-sm ${getTextColor()} ${notification.title ? 'mt-1' : ''}`}>
              {notification.message}
            </p>
            {notification.details && (
              <p className="text-xs text-gray-600 mt-1">
                {notification.details}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`rounded-md inline-flex ${getTextColor()} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              onClick={handleRemove}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Notification Container
function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed inset-0 flex items-end justify-end px-4 py-6 pointer-events-none sm:p-6 z-50">
      <div className="w-full flex flex-col items-end space-y-4 sm:items-end">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </div>
  );
}

// Hook for wallet-specific notifications
export function useWalletNotifications() {
  const notifications = useNotifications();

  const paymentSuccess = (amount, customer) => {
    notifications.success(
      `Payment of ${amount} processed successfully`,
      {
        title: 'Payment Processed',
        details: `Customer: ${customer}`,
        duration: 6000
      }
    );
  };

  const creditSlipCreated = (slipNumber, amount) => {
    notifications.success(
      `Credit slip ${slipNumber} created for ${amount}`,
      {
        title: 'Credit Slip Created',
        duration: 6000
      }
    );
  };

  const changeStored = (amount, customer) => {
    notifications.success(
      `${amount} stored as wallet balance`,
      {
        title: 'Change Stored',
        details: `Customer: ${customer}`,
        duration: 5000
      }
    );
  };

  const walletApplied = (amount, slipNumber) => {
    notifications.success(
      `${amount} applied from wallet to ${slipNumber}`,
      {
        title: 'Wallet Applied',
        duration: 5000
      }
    );
  };

  const operationError = (operation, error) => {
    notifications.error(
      error || `Failed to ${operation}`,
      {
        title: 'Operation Failed',
        duration: 8000
      }
    );
  };

  const networkError = () => {
    notifications.error(
      'Please check your internet connection and try again',
      {
        title: 'Connection Error',
        duration: 10000
      }
    );
  };

  const validationError = (message) => {
    notifications.warning(
      message,
      {
        title: 'Validation Error',
        duration: 6000
      }
    );
  };

  return {
    ...notifications,
    paymentSuccess,
    creditSlipCreated,
    changeStored,
    walletApplied,
    operationError,
    networkError,
    validationError
  };
}