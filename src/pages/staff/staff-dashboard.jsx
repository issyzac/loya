import { useState, useEffect } from 'react';
import { useStaffUser, useStaffPermissions, useUpdateStaffToken } from "../../providers/UserProvider";
import { Sidebar, SidebarBody, SidebarHeader, SidebarItem, SidebarLabel, SidebarSection } from '../../components/sidebar';
import { Navbar, NavbarDivider, NavbarItem, NavbarLabel, NavbarSection, NavbarSpacer } from '../../components/navbar';
import { StackedLayout } from '../../components/stacked-layout';
import {
  ArrowRightStartOnRectangleIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog8ToothIcon,
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  WalletIcon,
} from '@heroicons/react/16/solid';
import WalletSummaryWidget from './wallet/components/wallet-summary-widget';
import WalletActivityWidget from './wallet/components/wallet-activity-widget';
import { formatTZS } from '../../utils/currency';

export default function StaffDashboard() {
  const staffUser = useStaffUser();
  const staffPermissions = useStaffPermissions();
  const updateStaffToken = useUpdateStaffToken();
  
  // Wallet statistics state
  const [walletStats, setWalletStats] = useState({
    totalBalance: 0,
    customersWithBalance: 0,
    loading: true
  });

  useEffect(() => {
    loadWalletStats();
  }, []);

  const loadWalletStats = async () => {
    try {
      // Simulate API call - in real implementation, this would fetch from wallet service
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setWalletStats({
        totalBalance: 12545000, // 125,450 TZS in cents
        customersWithBalance: 23,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load wallet stats:', error);
      setWalletStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleLogout = () => {
    // Clear all staff data
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffRefreshToken');
    localStorage.removeItem('staffUser');
    localStorage.removeItem('staffPermissions');

    // Update context
    updateStaffToken(null);

    // Redirect to staff login
    window.location.href = '/staff/login';
  };

  const currentPath = window.location.pathname;
  
  const sidebarItems = [
    { label: 'Dashboard', url: '/staff/dashboard', icon: HomeIcon, active: currentPath === '/staff/dashboard' || currentPath === '/staff' },
    { label: 'Orders', url: '/staff/orders', icon: ClipboardDocumentListIcon, active: currentPath.startsWith('/staff/orders') },
    { label: 'Customers', url: '/staff/customers', icon: UsersIcon, active: currentPath.startsWith('/staff/customers') },
    { label: 'Wallet', url: '/staff/wallet', icon: WalletIcon, active: currentPath.startsWith('/staff/wallet') },
    { label: 'Analytics', url: '/staff/analytics', icon: ChartBarIcon, active: currentPath.startsWith('/staff/analytics') },
    { label: 'Staff Management', url: '/staff/management', icon: UserGroupIcon, active: currentPath.startsWith('/staff/management') },
    { label: 'Settings', url: '/staff/settings', icon: Cog8ToothIcon, active: currentPath.startsWith('/staff/settings') },
  ];

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <NavbarSection>
            <NavbarItem>
              <NavbarLabel>Staff Dashboard</NavbarLabel>
            </NavbarItem>
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem>
              <NavbarLabel>Welcome, {staffUser?.name || 'Staff'}</NavbarLabel>
            </NavbarItem>
            <NavbarItem>
              <NavbarLabel className="text-xs text-gray-500 capitalize">{staffUser?.role || 'Role'}</NavbarLabel>
            </NavbarItem>
            <NavbarDivider />
            <NavbarItem onClick={handleLogout}>
              <ArrowRightStartOnRectangleIcon />
              <NavbarLabel>Logout</NavbarLabel>
            </NavbarItem>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <SidebarLabel>Enzi Coffee</SidebarLabel>
            <SidebarLabel className="text-xs text-gray-500">Staff Portal</SidebarLabel>
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection>
              {sidebarItems.map((item) => (
                <SidebarItem key={item.url} href={item.url} current={item.active}>
                  <item.icon />
                  <SidebarLabel>{item.label}</SidebarLabel>
                </SidebarItem>
              ))}
            </SidebarSection>
          </SidebarBody>
        </Sidebar>
      }
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome to the staff management system</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {staffPermissions && staffPermissions.length > 0 ? (
              staffPermissions.map((permission, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize"
                >
                  {permission.replace('_', ' ')}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">No permissions assigned</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-semibold text-gray-900">24</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-semibold text-gray-900">156</p>
              </div>
            </div>
          </div>

          <div 
            className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow border-l-4 border-emerald-500"
            onClick={() => window.location.href = '/staff/wallet'}
            title="Click to view wallet dashboard"
          >
            <div className="flex items-center">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <WalletIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Wallet Balance</p>
                {walletStats.loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse mt-1 w-24"></div>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{formatTZS(walletStats.totalBalance)}</p>
                )}
                {!walletStats.loading && (
                  <p className="text-xs text-gray-500 mt-1">{walletStats.customersWithBalance} customers with balance</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue Today</p>
                <p className="text-2xl font-semibold text-gray-900">TZS 45,230</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Staff Online</p>
                <p className="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <WalletIcon className="h-5 w-5 text-emerald-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Wallet Quick Actions</h2>
            </div>
            <button 
              onClick={() => window.location.href = '/staff/wallet'}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View Wallet Dashboard →
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => window.location.href = '/staff/wallet/search'}
              className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <UsersIcon className="h-5 w-5 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Search Customer</p>
              <p className="text-xs text-gray-600">Find & view balance</p>
            </button>
            <button
              onClick={() => window.location.href = '/staff/wallet/process-payment'}
              className="p-4 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
            >
              <ClipboardDocumentListIcon className="h-5 w-5 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Process Payment</p>
              <p className="text-xs text-gray-600">Record payment</p>
            </button>
            <button
              onClick={() => window.location.href = '/staff/wallet/create-credit'}
              className="p-4 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all"
            >
              <ChartBarIcon className="h-5 w-5 text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Create Credit</p>
              <p className="text-xs text-gray-600">Add credit slip</p>
            </button>
            <button
              onClick={() => window.location.href = '/staff/wallet/store-change'}
              className="p-4 text-left border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all"
            >
              <Cog8ToothIcon className="h-5 w-5 text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Store Change</p>
              <p className="text-xs text-gray-600">Add to wallet</p>
            </button>
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Wallet Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <WalletSummaryWidget />
          </div>

          {/* Recent Wallet Activity */}
          <div className="bg-white p-6 rounded-lg shadow">
            <WalletActivityWidget />
          </div>
        </div>

        {/* General Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">New order received</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Order #1234</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Customer loyalty points updated</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Customer #567</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Inventory alert</p>
                <p className="text-xs text-gray-500">10 minutes ago</p>
              </div>
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Low Stock</span>
            </div>
          </div>
        </div>
      </div>
    </StackedLayout>
  );
}