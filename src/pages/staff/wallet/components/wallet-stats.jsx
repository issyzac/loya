import { useState, useEffect } from 'react';
import { 
  WalletIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon, 
  CreditCardIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/16/solid';
import { formatTZS } from '../../../../utils/currency';
import walletService from '../../../../api/wallet-service';

export default function WalletStats() {
  const [stats, setStats] = useState({
    totalWalletBalance: 0,
    customersWithBalance: 0,
    openCreditSlips: 0,
    todaysPayments: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    loadWalletStats();
  }, []);

  const loadWalletStats = async () => {
    try {
      // In a real implementation, you would have dedicated endpoints for these statistics
      // For now, we'll simulate the data or use placeholder values
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real implementation, these would come from dedicated stats endpoints
      setStats({
        totalWalletBalance: 12545000,  
        customersWithBalance: 23,
        openCreditSlips: 8,
        todaysPayments: 12,
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Failed to load wallet stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load statistics'
      }));
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, loading, error }) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center">
        <div className={`p-2 bg-${color}-500 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
          ) : error ? (
            <div className="flex items-center mt-1">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">Error</span>
            </div>
          ) : (
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Wallet Balance"
        value={formatTZS(stats.totalWalletBalance)}
        icon={WalletIcon}
        color="green"
        loading={stats.loading}
        error={stats.error}
      />
      
      <StatCard
        title="Customers with Balance"
        value={stats.customersWithBalance}
        icon={UsersIcon}
        color="blue"
        loading={stats.loading}
        error={stats.error}
      />
      
      <StatCard
        title="Open Credit Slips"
        value={stats.openCreditSlips}
        icon={ClipboardDocumentListIcon}
        color="orange"
        loading={stats.loading}
        error={stats.error}
      />
      
      <StatCard
        title="Today's Payments"
        value={stats.todaysPayments}
        icon={CreditCardIcon}
        color="purple"
        loading={stats.loading}
        error={stats.error}
      />
    </div>
  );
}