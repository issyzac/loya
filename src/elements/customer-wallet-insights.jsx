import { useState, useEffect } from 'react';
import { useUser } from '../providers/UserProvider';
import customerWalletService from '../api/customer-wallet-service';
import { formatTZS } from '../utils/currency';
import { Button } from '../components/button';
import { Text } from '../components/text';
import { Badge } from '../components/badge';

/**
 * Simple visual representation of wallet activity using bars
 * @param {object} props - Component props
 * @param {number} props.value - The value to represent (0-100)
 * @param {string} props.color - Color scheme ('green', 'yellow', 'blue')
 * @param {string} props.label - Label for the bar
 */
function ActivityBar({ value, color = 'blue', label }) {
  const colorClasses = {
    green: 'bg-green-200 text-green-800',
    yellow: 'bg-yellow-200 text-yellow-800',
    blue: 'bg-blue-200 text-blue-800',
    gray: 'bg-gray-200 text-gray-800'
  };

  const fillClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        <Text className="text-xs text-gray-500">{value}%</Text>
      </div>
      <div className={`w-full h-2 rounded-full ${colorClasses[color]}`}>
        <div 
          className={`h-full rounded-full transition-all duration-300 ${fillClasses[color]}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Simple spending pattern visualization
 * @param {object} props - Component props
 * @param {object} props.patterns - Spending patterns data
 */
function SpendingPatterns({ patterns }) {
  if (!patterns || Object.keys(patterns).length === 0) {
    return (
      <div className="text-center py-4">
        <Text className="text-gray-500">No spending patterns available yet</Text>
        <Text className="text-sm text-gray-400 mt-1">
          Make a few transactions to see your patterns
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {patterns.most_active_day && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <Text className="font-medium text-blue-800">Most Active Day</Text>
            <Text className="text-sm text-blue-600">{patterns.most_active_day}</Text>
          </div>
          <i className="fa-regular fa-calendar text-2xl text-blue-600"></i>
        </div>
      )}

      {patterns.avg_transaction_amount && (
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div>
            <Text className="font-medium text-green-800">Average Transaction</Text>
            <Text className="text-sm text-green-600">{patterns.avg_transaction_amount}</Text>
          </div>
          <i class="fa-regular fa-money-bill text-2xl text-green-600"></i>
        </div>
      )}

      {patterns.recent_spending_total && (
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div>
            <Text className="font-medium text-purple-800">Recent Spending</Text>
            <Text className="text-sm text-purple-600">{patterns.recent_spending_total}</Text>
          </div>
          <i class="fa-regular fa-chart-bar text-2xl text-purple-600"></i>
        </div>
      )}
    </div>
  );
}

/**
 * Customer-friendly notifications and reminders
 * @param {object} props - Component props
 * @param {Array} props.notifications - Array of notification objects
 * @param {function} props.onActionClick - Callback for notification actions
 */
function WalletNotifications({ notifications, onActionClick }) {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification, index) => {
        const colorClasses = {
          reminder: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          info: 'bg-blue-50 border-blue-200 text-blue-800',
          success: 'bg-green-50 border-green-200 text-green-800'
        };

        const iconMap = {
          reminder: '<i class="fa-regular fa-clock text-yellow-600"></i>',
          info: '<i class="fa-regular fa-info-circle text-blue-600"></i>',
          success: '<i class="fa-regular fa-check-circle text-green-600"></i>'
        };

        return (
          <div 
            key={index}
            className={`p-4 rounded-lg border ${colorClasses[notification.type] || colorClasses.info}`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-xl flex-shrink-0">
                <span dangerouslySetInnerHTML={{ __html: iconMap[notification.type] || '<i class="fa-regular fa-info-circle text-blue-600"></i>' }}></span>
              </span>
              <div className="flex-1">
                <Text className="font-medium mb-1">{notification.message}</Text>
                {notification.actionText && onActionClick && (
                  <Button
                    size="sm"
                    outline
                    onClick={() => onActionClick(notification.action)}
                    className="mt-2"
                  >
                    {notification.actionText}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Helpful recommendations based on wallet status
 * @param {object} props - Component props
 * @param {Array} props.recommendations - Array of recommendation objects
 * @param {function} props.onActionClick - Callback for recommendation actions
 */
function WalletRecommendations({ recommendations, onActionClick }) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Text className="font-medium text-gray-800 mb-3 flex items-center">
        <i className="fa-regular fa-lightbulb mr-2 text-yellow-600"></i>
        Helpful Tips
      </Text>
      {recommendations.map((recommendation, index) => (
        <div 
          key={index}
          className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg"
        >
          <div className="flex items-start space-x-3">
            <i className="fa-regular fa-lightbulb text-xl flex-shrink-0 text-indigo-600"></i>
            <div className="flex-1">
              <Text className="text-indigo-800 mb-2">{recommendation.message}</Text>
              {recommendation.actionText && onActionClick && (
                <Button
                  size="sm"
                  color="indigo"
                  onClick={() => onActionClick(recommendation.action)}
                >
                  {recommendation.actionText}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Customer Wallet Insights Component
 * Provides spending patterns, summaries, and customer-friendly insights
 * 
 * Features:
 * - Monthly spending statistics and average transaction amounts
 * - Simple visual representations of wallet activity
 * - Customer-friendly language for insights and patterns
 * - Gentle notifications and helpful recommendations
 */
export default function CustomerWalletInsights({
  onNavigateToAddCredit,
  onNavigateToApplyWallet,
  className = ''
}) {
  // State management
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Context hooks
  const user = useUser();

  // Set user context in wallet service
  useEffect(() => {
    if (user) {
      customerWalletService.setUser(user);
    }
  }, [user]);

  // Load wallet insights
  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await customerWalletService.getMyWalletInsights();
      
      if (response.success) {
        setInsights(response.insights);
      } else {
        setError(response.error?.message || 'Failed to load wallet insights');
      }
    } catch (err) {
      setError('Unable to load wallet insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load insights on component mount
  useEffect(() => {
    loadInsights();
  }, [user]);

  // Handle notification and recommendation actions
  const handleActionClick = (action) => {
    switch (action) {
      case 'add_credit':
        onNavigateToAddCredit?.();
        break;
      case 'apply_wallet':
        onNavigateToApplyWallet?.();
        break;
      case 'use_credit':
        // Could navigate to shop or show usage options
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          
          {/* Patterns skeleton */}
          <div className="space-y-4 mb-6">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>

          {/* Notifications skeleton */}
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <i className="fa-regular fa-face-frown text-4xl block mb-2 text-red-600"></i>
          <Text className="font-medium">Unable to load insights</Text>
          <Text className="text-sm text-gray-500 mt-1">{error}</Text>
        </div>
        <Button onClick={loadInsights} size="sm" outline>
          Try Again
        </Button>
      </div>
    );
  }

  // No insights available
  if (!insights) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <i class="fa-regular fa-chart-bar text-4xl block mb-2 text-gray-400"></i>
        <Text className="font-medium text-gray-600">No insights available</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Start using your wallet to see spending patterns and insights
        </Text>
      </div>
    );
  }

  const { current_balance, activity_summary, spending_patterns, notifications, recommendations } = insights;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2">
        <i class="fa-regular fa-chart-bar text-2xl text-blue-600"></i>
        <Text className="roboto-serif-heading text-xl font-semibold text-gray-800">
          Your Wallet Insights
        </Text>
      </div>

      {/* Activity Summary */}
      {activity_summary && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <Text className="font-medium text-gray-800 mb-3">Recent Activity</Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Text className="text-2xl font-bold text-blue-600">
                {activity_summary.recent_transaction_count}
              </Text>
              <Text className="text-sm text-blue-800">Recent Transactions</Text>
            </div>
            
            {activity_summary.formatted_last_transaction_date && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Text className="text-sm font-bold text-green-600">
                  {activity_summary.formatted_last_transaction_date}
                </Text>
                <Text className="text-sm text-green-800">Last Activity</Text>
              </div>
            )}
          </div>

          {!activity_summary.has_recent_activity && (
            <div className="text-center py-4 text-gray-500">
              <Text className="text-sm">No recent activity to show</Text>
            </div>
          )}
        </div>
      )}

      {/* Spending Patterns */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Text className="font-medium text-gray-800 mb-4">Your Spending Patterns</Text>
        <SpendingPatterns patterns={spending_patterns} />
      </div>

      {/* Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="space-y-3">
          <Text className="font-medium text-gray-800">📢 Important Updates</Text>
          <WalletNotifications 
            notifications={notifications} 
            onActionClick={handleActionClick}
          />
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <WalletRecommendations 
          recommendations={recommendations} 
          onActionClick={handleActionClick}
        />
      )}

      {/* Balance Summary Card */}
      {current_balance && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-4">
          <Text className="font-medium text-indigo-800 mb-3">💳 Quick Balance Summary</Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Text className="text-sm text-indigo-600 mb-1">Available Credit</Text>
              <Text className="text-lg font-bold text-indigo-800">
                {current_balance.formatted_wallet_balance}
              </Text>
            </div>
            <div>
              <Text className="text-sm text-indigo-600 mb-1">Outstanding Bills</Text>
              <Text className="text-lg font-bold text-indigo-800">
                {current_balance.formatted_outstanding_balance}
              </Text>
            </div>
          </div>
          
          {current_balance.formatted_net_balance && (
            <div className="mt-3 pt-3 border-t border-indigo-200">
              <Text className="text-sm text-indigo-600 mb-1">Net Balance</Text>
              <Text className="text-xl font-bold text-indigo-900">
                {current_balance.formatted_net_balance}
              </Text>
            </div>
          )}
        </div>
      )}

      {/* Empty State Message */}
      {(!notifications || notifications.length === 0) && 
       (!recommendations || recommendations.length === 0) && 
       (!activity_summary?.has_recent_activity) && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <i className="fa-regular fa-star text-4xl block mb-2 text-yellow-500"></i>
          <Text className="font-medium text-gray-600 mb-2">You're all caught up!</Text>
          <Text className="text-sm text-gray-500">
            Keep using your wallet and we'll show you helpful insights here
          </Text>
        </div>
      )}
    </div>
  );
}