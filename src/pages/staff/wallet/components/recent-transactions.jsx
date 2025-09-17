import { useState, useEffect } from 'react';
import { Button } from '../../../../components/button';
import { 
  ClockIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/16/solid';
import { formatTZS } from '../../../../utils/currency';
import { LoadingDisplay } from './error-display';
import walletService from '../../../../api/wallet-service';

export default function RecentTransactions({ limit = 5 }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecentTransactions();
  }, [limit]);

  const loadRecentTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await walletService.getRecentTransactions(limit);
      
      if (response.success && response.transactions) {
        // Normalize the API response to match component expectations
        const normalizedTransactions = response.transactions.map(transaction => ({
          id: transaction.entry_id || transaction.id,
          type: transaction.entry_type || transaction.type,
          direction: transaction.direction || (transaction.amount_cents > 0 ? 'CREDIT' : 'DEBIT'),
          customer_name: transaction.customer_name || transaction.customer?.name || 'Unknown Customer',
          amount_cents: Math.abs(transaction.amount_cents || 0),
          description: transaction.description || getTransactionDescription(transaction.entry_type || transaction.type),
          occurred_at: transaction.occurred_at || transaction.created_at,
          color: getTransactionColor(transaction.entry_type || transaction.type)
        }));
        
        setTransactions(normalizedTransactions);
      } else {
        // Fallback to empty array if API fails
        setTransactions([]);
        console.warn('Failed to load recent transactions:', response.error?.message);
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('Failed to load recent transactions:', err);
      setError('Failed to load recent transactions');
      setTransactions([]);
      setLoading(false);
    }
  };

  const getTransactionDescription = (type) => {
    switch (type) {
      case 'PAYMENT':
        return 'Payment received';
      case 'SALE_ON_CREDIT':
        return 'Credit slip created';
      case 'CHANGE_TO_BALANCE':
        return 'Change stored';
      case 'BALANCE_CONSUMPTION':
        return 'Wallet applied to credit slip';
      case 'DEPOSIT':
        return 'Deposit added';
      default:
        return 'Transaction';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'PAYMENT':
      case 'DEPOSIT':
        return 'green';
      case 'SALE_ON_CREDIT':
        return 'orange';
      case 'CHANGE_TO_BALANCE':
        return 'blue';
      case 'BALANCE_CONSUMPTION':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getTransactionIcon = (direction) => {
    return direction === 'CREDIT' ? ArrowUpIcon : ArrowDownIcon;
  };

  const getDirectionColor = (direction) => {
    return direction === 'CREDIT' ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Wallet Activity</h3>
        </div>
        <div className="p-6">
          <LoadingDisplay message="Loading recent transactions..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Wallet Activity</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
            <span className="text-red-600">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Wallet Activity</h3>
          <Button 
            outline 
            href="/staff/wallet/history"
            size="sm"
          >
            <ClockIcon className="h-4 w-4 mr-1" />
            View All
          </Button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="p-12 text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
          <p className="text-gray-600">No recent wallet transactions to display.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {transactions.map((transaction) => {
            const IconComponent = getTransactionIcon(transaction.direction);
            const amountColor = getDirectionColor(transaction.direction);
            
            return (
              <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 bg-${transaction.color}-100 rounded-lg`}>
                      <IconComponent className={`h-4 w-4 text-${transaction.color}-600`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description} - {transaction.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTimeAgo(transaction.occurred_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${amountColor}`}>
                      {transaction.direction === 'CREDIT' ? '+' : '-'}{formatTZS(transaction.amount_cents)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}