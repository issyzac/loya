import { useState, useEffect } from 'react';
import { Button } from '../../../../components/button';
import { 
  ClockIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  ExclamationTriangleIcon,
  WalletIcon,
  CreditCardIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/16/solid';
import { formatTZS } from '../../../../utils/currency';

export default function WalletActivityWidget() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock data - in real implementation, this would come from recent activity endpoint
      const mockActivities = [
        {
          id: 'ACT001',
          type: 'PAYMENT',
          direction: 'CREDIT',
          customer_name: 'John Doe',
          amount_cents: 1500000, // 15,000 TZS
          description: 'Payment received',
          occurred_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          icon: CreditCardIcon,
          color: 'green'
        },
        {
          id: 'ACT002',
          type: 'CREDIT_SLIP',
          direction: 'DEBIT',
          customer_name: 'Jane Smith',
          amount_cents: 850000, // 8,500 TZS
          description: 'Credit slip created',
          occurred_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 minutes ago
          icon: ClipboardDocumentListIcon,
          color: 'orange'
        },
        {
          id: 'ACT003',
          type: 'CHANGE_STORED',
          direction: 'CREDIT',
          customer_name: 'Mike Johnson',
          amount_cents: 250000, // 2,500 TZS
          description: 'Change stored as wallet balance',
          occurred_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
          icon: BanknotesIcon,
          color: 'blue'
        },
        {
          id: 'ACT004',
          type: 'WALLET_APPLIED',
          direction: 'DEBIT',
          customer_name: 'Sarah Wilson',
          amount_cents: 1200000, // 12,000 TZS
          description: 'Wallet balance applied to credit slip',
          occurred_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 minutes ago
          icon: WalletIcon,
          color: 'purple'
        }
      ];
      
      setActivities(mockActivities);
      setLoading(false);
      
    } catch (err) {
      console.error('Failed to load recent activity:', err);
      setError('Failed to load recent activity');
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Wallet Activity</h3>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Wallet Activity</h3>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <Button 
            size="sm" 
            outline 
            onClick={loadRecentActivity}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ClockIcon className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Wallet Activity</h3>
        </div>
        <Button 
          outline 
          size="sm"
          onClick={() => window.location.href = '/staff/wallet/history'}
        >
          View All
        </Button>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ClockIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No recent wallet activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const IconComponent = activity.icon;
            const isCredit = activity.direction === 'CREDIT';
            
            return (
              <div 
                key={activity.id} 
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => window.location.href = '/staff/wallet/history'}
              >
                {/* Icon */}
                <div className={`p-2 bg-${activity.color}-100 rounded-lg flex-shrink-0`}>
                  <IconComponent className={`h-4 w-4 text-${activity.color}-600`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <div className={`flex items-center ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit ? (
                        <ArrowUpIcon className="h-3 w-3" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-gray-600">{activity.customer_name}</p>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500">{getTimeAgo(activity.occurred_at)}</p>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                    {isCredit ? '+' : '-'}{formatTZS(activity.amount_cents)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <button 
            onClick={loadRecentActivity}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}