import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-regular-svg-icons';
import { faWallet, faChartBar } from '@fortawesome/free-solid-svg-icons';
import CustomerWalletDashboard from '../elements/customer-wallet-dashboard';
import CustomerTransactionHistory from '../elements/customer-transaction-history';
import CustomerWalletInsights from '../elements/customer-wallet-insights';
import { useUpdateCurrentPage } from '../providers/AppProvider';

/**
 * Customer Wallet Page Component
 * Full page wrapper for the customer wallet interface with tabbed navigation
 * 
 * Features:
 * - Page header with navigation breadcrumbs
 * - Tabbed interface for organizing wallet content
 * - Integration with existing customer navigation patterns
 * - Mobile-responsive layout with touch-friendly tabs
 * - Loading and error states
 */
const CustomerWalletPage = () => {
  const updateCurrentPage = useUpdateCurrentPage();
  const [activeTab, setActiveTab] = useState('overview');

  // Tab configuration
  const tabs = [
    { id: 'overview', name: 'Overview', icon: faWallet },
    { id: 'transactions', name: 'Transactions', icon: faChartBar },
    { id: 'insights', name: 'Insights', icon: faLightbulb }
  ];



  /**
   * Handle tab change
   */
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  /**
   * Render tab content based on active tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <CustomerWalletDashboard
            onNavigateToTransactionHistory={() => handleTabChange('transactions')}
            showTransactionHistory={false}
            showInsights={false}
            className="space-y-6"
          />
        );
      case 'transactions':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="roboto-serif-heading text-2xl font-bold text-gray-900 mb-2">
                Transaction History
              </h2>
              <p className="text-gray-600">
                View and filter your complete transaction history
              </p>
            </div>
            <CustomerTransactionHistory className="bg-white rounded-lg shadow-sm" />
          </div>
        );
      case 'insights':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="roboto-serif-heading text-2xl font-bold text-gray-900 mb-2">
                Wallet Insights
              </h2>
              <p className="text-gray-600">
                Understand your spending patterns and wallet activity
              </p>
            </div>
            <CustomerWalletInsights 
              className="bg-white rounded-lg shadow-sm"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => updateCurrentPage('Home')}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Home
              </button>
            </li>
            <li>
              <span className="text-gray-400 text-sm">/</span>
            </li>
            <li>
              <span className="text-gray-900 text-sm font-medium">Wallet</span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="roboto-serif-heading text-3xl font-bold text-gray-900 mb-2">
          Your Wallet
        </h1>
        <p className="text-gray-600">
          Manage your wallet balance and view your financial activity
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 min-w-0 flex-shrink-0
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <FontAwesomeIcon icon={tab.icon} className="text-lg" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CustomerWalletPage;