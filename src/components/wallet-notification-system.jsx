import { useState, useEffect, useCallback } from 'react';
import { Button } from './button';
import { Text } from './text';

/**
 * Wallet Notification System Component
 * Provides gentle, non-intrusive notifications for wallet status changes
 * 
 * Features:
 * - Gentle reminders for old outstanding credit slips
 * - Notifications for significant available wallet credit
 * - Non-intrusive messaging for balance changes
 * - Session-based notification dismissal
 */
export default function WalletNotificationSystem({
  walletData,
  creditSlipsSummary,
  onNavigateToAddCredit,
  onNavigateToApplyWallet,
  className = ''
}) {
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());
  const [notifications, setNotifications] = useState([]);

  /**
   * Generate notifications based on wallet status
   */
  const generateNotifications = useCallback(() => {
    if (!walletData) return [];

    const newNotifications = [];
    const walletCents = walletData.wallet_cents || 0;
    const outstandingCents = walletData.outstanding_cents || 0;
    const netBalance = walletCents - outstandingCents;

    // Requirement 7.1: Gentle reminder for old outstanding credit slips
    if (creditSlipsSummary?.slips && creditSlipsSummary.slips.length > 0) {
      const oldSlips = creditSlipsSummary.slips.filter(slip => slip.days_old >= 7);
      
      if (oldSlips.length > 0) {
        const totalOldAmount = oldSlips.reduce((sum, slip) => 
          sum + (slip.totals?.remaining_cents || 0), 0
        );
        
        newNotifications.push({
          id: 'old-credit-slips',
          type: 'reminder',
          priority: 'medium',
          icon: '<i class="fa-regular fa-calendar text-yellow-600"></i>',
          title: 'Outstanding Bills Reminder',
          message: `You have ${oldSlips.length} bill${oldSlips.length === 1 ? '' : 's'} from over a week ago`,
          details: `Total amount: ${walletData.currency === 'TZS' ? 'TZS ' : ''}${(totalOldAmount / 100).toLocaleString()}`,
          action: null,
          actionText: null,
          onAction: null,
          dismissible: true,
          autoHide: false
        });
      }
    }

    // Requirement 7.2: Notification for significant available wallet credit
    if (walletCents >= 50000) { // 500 TZS or more
      newNotifications.push({
        id: 'significant-credit',
        type: 'info',
        priority: 'low',
        icon: '<i class="fa-regular fa-wallet text-green-600"></i>',
        title: 'Available Wallet Credit',
        message: `You have ${walletData.currency === 'TZS' ? 'TZS ' : ''}${(walletCents / 100).toLocaleString()} available in your wallet`,
        details: outstandingCents > 0 ? 'Consider using it to pay your outstanding bills' : 'Ready to use for your next purchase',
        action: outstandingCents > 0 ? 'apply_wallet' : 'use_credit',
        actionText: outstandingCents > 0 ? 'Apply to Bills' : 'Use Credit',
        onAction: outstandingCents > 0 ? onNavigateToApplyWallet : onNavigateToAddCredit,
        dismissible: true,
        autoHide: false
      });
    }

    // Requirement 7.3: Balance change notifications
    if (netBalance < 0 && Math.abs(netBalance) >= 10000) { // Owing 100 TZS or more
      newNotifications.push({
        id: 'negative-balance',
        type: 'warning',
        priority: 'medium',
        icon: '<i class="fa-regular fa-exclamation-triangle text-yellow-600"></i>',
        title: 'Outstanding Balance',
        message: `You owe ${walletData.currency === 'TZS' ? 'TZS ' : ''}${(Math.abs(netBalance) / 100).toLocaleString()}`,
        details: walletCents > 0 ? 'You can use your wallet credit to reduce this amount' : 'Consider making a payment',
        action: 'view_bills',
        actionText: walletCents > 0 ? 'Apply Wallet' : 'View Bills',
        onAction: walletCents > 0 ? onNavigateToApplyWallet : null,
        dismissible: true,
        autoHide: false
      });
    }

    // Positive balance encouragement (low priority)
    if (netBalance > 0 && walletCents > 0 && outstandingCents === 0) {
      newNotifications.push({
        id: 'positive-balance',
        type: 'success',
        priority: 'low',
        icon: '<i class="fa-regular fa-check-circle text-green-600"></i>',
        title: 'Great Job!',
        message: 'Your account is in good standing',
        details: `You have ${walletData.currency === 'TZS' ? 'TZS ' : ''}${(walletCents / 100).toLocaleString()} ready for your next visit`,
        action: null,
        actionText: null,
        onAction: null,
        dismissible: true,
        autoHide: true,
        autoHideDelay: 5000
      });
    }

    return newNotifications;
  }, [walletData, creditSlipsSummary, onNavigateToAddCredit, onNavigateToApplyWallet]);

  // Update notifications when wallet data changes
  useEffect(() => {
    const newNotifications = generateNotifications();
    
    // Filter out dismissed notifications
    const visibleNotifications = newNotifications.filter(
      notification => !dismissedNotifications.has(notification.id)
    );
    
    setNotifications(visibleNotifications);
  }, [generateNotifications, dismissedNotifications]);

  // Auto-hide notifications with autoHide enabled
  useEffect(() => {
    const autoHideNotifications = notifications.filter(n => n.autoHide);
    
    if (autoHideNotifications.length > 0) {
      const timers = autoHideNotifications.map(notification => {
        return setTimeout(() => {
          handleDismissNotification(notification.id);
        }, notification.autoHideDelay || 3000);
      });

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [notifications]);

  /**
   * Handle notification dismissal (session-based)
   * Requirement 7.4: Session-based notification dismissal functionality
   */
  const handleDismissNotification = useCallback((notificationId) => {
    setDismissedNotifications(prev => new Set([...prev, notificationId]));
  }, []);

  /**
   * Handle notification action
   */
  const handleNotificationAction = useCallback((notification) => {
    if (notification.onAction) {
      notification.onAction();
    }
    
    // Optionally dismiss notification after action
    if (notification.dismissible) {
      handleDismissNotification(notification.id);
    }
  }, [handleDismissNotification]);

  /**
   * Get notification styling based on type and priority
   */
  const getNotificationStyle = (notification) => {
    const baseClasses = 'rounded-lg border p-4 shadow-sm';
    
    switch (notification.type) {
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-200 text-blue-800`;
      case 'success':
        return `${baseClasses} bg-green-50 border-green-200 text-green-800`;
      case 'reminder':
        return `${baseClasses} bg-orange-50 border-orange-200 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-200 text-gray-800`;
    }
  };

  /**
   * Get icon color based on notification type
   */
  const getIconColor = (notification) => {
    switch (notification.type) {
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'reminder':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  // Don't render if no notifications
  if (notifications.length === 0) {
    return null;
  }

  // Sort notifications by priority (medium first, then low)
  const sortedNotifications = [...notifications].sort((a, b) => {
    const priorityOrder = { medium: 0, low: 1 };
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  return (
    <div className={`space-y-3 ${className}`}>
      {sortedNotifications.map((notification) => (
        <div
          key={notification.id}
          className={getNotificationStyle(notification)}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className={`text-xl ${getIconColor(notification)} flex-shrink-0`}>
              <span dangerouslySetInnerHTML={{ __html: notification.icon }}></span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    {notification.title}
                  </h4>
                  <Text className="text-sm mb-1">
                    {notification.message}
                  </Text>
                  {notification.details && (
                    <Text className="text-xs opacity-75">
                      {notification.details}
                    </Text>
                  )}
                </div>

                {/* Dismiss button */}
                {notification.dismissible && (
                  <button
                    onClick={() => handleDismissNotification(notification.id)}
                    className="ml-2 text-current opacity-50 hover:opacity-75 transition-opacity"
                    aria-label="Dismiss notification"
                  >
                    <span className="text-lg">×</span>
                  </button>
                )}
              </div>

              {/* Action button */}
              {notification.action && notification.actionText && (
                <div className="mt-3">
                  <Button
                    onClick={() => handleNotificationAction(notification)}
                    size="sm"
                    outline
                    className="text-xs"
                  >
                    {notification.actionText}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}