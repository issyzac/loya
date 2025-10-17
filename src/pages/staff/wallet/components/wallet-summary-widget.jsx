import { useState, useEffect } from 'react';
import { Button } from '../../../../components/button';
import { 
  WalletIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon, 
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/16/solid';
import { formatTZS } from '../../../../utils/currency';
import walletService from '../../../../api/wallet-service';

export default function WalletSummaryWidget() {
  const [walletStats, setWalletStats] = useState({
    totalWalletBalance: 0,
    customersWithBalance: 0,
    openCreditSlips: 0,
    todaysPayments: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    loadWalletSummary();
  }, []);

  const loadWalletSummary = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data - in real implementation, this would come from a summary endpoint
      setWalletStats({
        totalWalletBalance: 12545000, // 125,450 TZS in cents
        customersWithBalance: 23,
        openCreditSlips: 8,
        todaysPayments: 12,
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Failed to load wallet summary:', error);
      setWalletStats(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load wallet data'
      }));
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, onClick }) => (
    <div 
      className={`bg-white p-4 rounded-lg shadow border-l-4 border-${color}-500 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 bg-${color}-100 rounded-lg mr-3`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</p>
            {walletStats.loading ? (
              <div className="h-6 bg-gray-200 rounded animate-pulse mt-1 w-16"></div>
            ) : walletStats.error ? (
              <div className="flex items-center mt-1">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-xs text-red-600">Error</span>
              </div>
            ) : (
              <p className="text-lg font-bold text-gray-900">{value}</p>
            )}
          </div>
        </div>
        
        {trend && !walletStats.loading && !walletStats.error && (
          <div className="text-right">
            <div className={`flex items-center text-xs ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              <ArrowTrendingUpIcon className={`h-3 w-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend)}%</span>
            </div>
            <p className="text-xs text-gray-500">vs yesterday</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <WalletIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Wallet Overview</h3>
        </div>
        <Button 
          outline 
          size="sm"
          onClick={() => window.location.href = '/staff/wallet'}
        >
          View Details
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Total Wallet Balance"
          value={formatTZS(walletStats.totalWalletBalance)}
          icon={WalletIcon}
          color="green"
          trend={8.2}
          onClick={() => window.location.href = '/staff/wallet'}
        />
        
        <StatCard
          title="Customers with Balance"
          value={walletStats.customersWithBalance}
          icon={UsersIcon}
          color="blue"
          trend={5.1}
          onClick={() => window.location.href = '/staff/wallet/search'}
        />
        
        <StatCard
          title="Open Credit Slips"
          value={walletStats.openCreditSlips}
          icon={ClipboardDocumentListIcon}
          color="orange"
          trend={-2.3}
          onClick={() => window.location.href = '/staff/wallet/create-credit'}
        />
        
        <StatCard
          title="Today's Payments"
          value={walletStats.todaysPayments}
          icon={CreditCardIcon}
          color="purple"
          trend={12.7}
          onClick={() => window.location.href = '/staff/wallet/process-payment'}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            outline 
            size="sm"
            onClick={() => window.location.href = '/staff/wallet/search'}
            className="text-xs"
          >
            Search Customer
          </Button>
          <Button 
            outline 
            size="sm"
            onClick={() => window.location.href = '/staff/wallet/process-payment'}
            className="text-xs"
          >
            Process Payment
          </Button>
        </div>
      </div>

      {/* Error State */}
      {walletStats.error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{walletStats.error}</span>
          </div>
          <Button 
            size="sm" 
            outline 
            onClick={loadWalletSummary}
            className="mt-2 text-xs"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}