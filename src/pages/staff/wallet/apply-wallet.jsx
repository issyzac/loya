import { useState, useEffect } from 'react';
import { useStaffUser } from '../../../providers/UserProvider';
import { Sidebar, SidebarBody, SidebarHeader, SidebarItem, SidebarLabel, SidebarSection } from '../../../components/sidebar';
import { Navbar, NavbarDivider, NavbarItem, NavbarLabel, NavbarSection, NavbarSpacer } from '../../../components/navbar';
import { StackedLayout } from '../../../components/stacked-layout';
import { Button } from '../../../components/button';
import { Input, InputGroup } from '../../../components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/table';
import {
  ArrowRightStartOnRectangleIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog8ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  UsersIcon,
  WalletIcon,
  CheckCircleIcon,
} from '@heroicons/react/16/solid';

import walletService from '../../../api/wallet-service';
import { formatCustomerData, formatCustomerBalance } from '../../../utils/api-response';
import { createErrorDisplay, createSuccessDisplay } from '../../../utils/error-handler';
import { formatTZS } from '../../../utils/currency';
import ApplyWalletModal from './components/apply-wallet-modal';
import ErrorDisplay, { LoadingDisplay, SuccessDisplay } from './components/error-display';

export default function ApplyWallet() {
  const staffUser = useStaffUser();
  const [customer, setCustomer] = useState(null);
  const [customerBalance, setCustomerBalance] = useState(null);
  const [openSlips, setOpenSlips] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showApplyWalletModal, setShowApplyWalletModal] = useState(false);
  const [selectedSlipForWallet, setSelectedSlipForWallet] = useState(null);

  // Get customer ID from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('customer_id');
    if (customerId) {
      setCustomerSearchTerm(customerId);
      searchCustomer(customerId);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffRefreshToken');
    localStorage.removeItem('staffUser');
    localStorage.removeItem('staffPermissions');
    window.location.href = '/staff/login';
  };

  const sidebarItems = [
    { label: 'Dashboard', url: '/staff/dashboard', icon: HomeIcon },
    { label: 'Orders', url: '/staff/orders', icon: ClipboardDocumentListIcon },
    { label: 'Customers', url: '/staff/customers', icon: UsersIcon },
    { label: 'Wallet', url: '/staff/wallet', icon: WalletIcon, active: true },
    { label: 'Analytics', url: '/staff/analytics', icon: ChartBarIcon },
    { label: 'Staff Management', url: '/staff/management', icon: UserGroupIcon },
    { label: 'Settings', url: '/staff/settings', icon: Cog8ToothIcon },
  ];

  const searchCustomer = async (searchTerm) => {
    if (!searchTerm.trim()) return;

    setCustomerLoading(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    try {
      // Search for customer
      const customerResponse = await walletService.searchCustomer(searchTerm.trim());
      
      if (!customerResponse.success) {
        setFieldErrors({ customer: 'Customer not found' });
        setCustomer(null);
        setCustomerBalance(null);
        setOpenSlips([]);
        return;
      }

      const customerData = formatCustomerData(customerResponse.customer);
      setCustomer(customerData);

      // Get customer balance and open slips
      const [balanceResponse, slipsResponse] = await Promise.all([
        walletService.getCustomerBalance(customerData.customer_id),
        walletService.getOpenCreditSlips(customerData.customer_id)
      ]);

      if (balanceResponse.success) {
        const balanceData = formatCustomerBalance(balanceResponse.balance);
        setCustomerBalance(balanceData);
      }

      if (slipsResponse.success) {
        setOpenSlips(slipsResponse.slips || []);
      }

    } catch (err) {
      console.error('Customer search error:', err);
      setFieldErrors({ customer: 'Failed to search customer' });
      setCustomer(null);
      setCustomerBalance(null);
      setOpenSlips([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleCustomerSearch = (e) => {
    e.preventDefault();
    searchCustomer(customerSearchTerm);
  };

  const handleApplyWallet = (slip) => {
    setSelectedSlipForWallet(slip);
    setShowApplyWalletModal(true);
  };

  const handleWalletApplicationSuccess = (result) => {
    setSuccess(createSuccessDisplay(result.message));
    setShowApplyWalletModal(false);
    setSelectedSlipForWallet(null);
    
    // Refresh customer data
    if (customer) {
      searchCustomer(customer.customer_id);
    }
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasWalletBalance = customerBalance && customerBalance.wallet_cents > 0;
  const hasOpenSlips = openSlips.length > 0;
  const canApplyWallet = hasWalletBalance && hasOpenSlips;

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <NavbarSection>
            <NavbarItem>
              <NavbarLabel>Apply Wallet Balance</NavbarLabel>
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
        {/* Header */}
        <div className="mb-6">
          <Button 
            outline 
            onClick={() => window.location.href = '/staff/wallet'}
            className="mb-4"
          >
            <ArrowLeftIcon />
            Back to Wallet
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Apply Wallet Balance</h1>
          <p className="text-gray-600">Use customer wallet balance to pay down credit slips</p>
        </div>

        {/* Success Message */}
        {success && (
          <SuccessDisplay message={success.message} className="mb-6" />
        )}

        {/* Error Message */}
        {error && (
          <ErrorDisplay 
            error={error} 
            onRetry={() => setError(null)}
            className="mb-6"
          />
        )}

        {/* Customer Search */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Search</h3>
          
          <form onSubmit={handleCustomerSearch} className="flex gap-4">
            <div className="flex-1">
              <InputGroup>
                <MagnifyingGlassIcon />
                <Input
                  type="text"
                  placeholder="Enter customer ID or phone number..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  disabled={customerLoading}
                />
              </InputGroup>
              {fieldErrors.customer && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.customer}</p>
              )}
            </div>
            <Button 
              type="submit"
              disabled={customerLoading || !customerSearchTerm.trim()}
              color="blue"
            >
              {customerLoading ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </div>

        {/* Loading State */}
        {customerLoading && (
          <LoadingDisplay message="Searching for customer..." />
        )}

        {/* Customer Results */}
        {customer && customerBalance && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                    <p className="text-sm text-gray-600">{customer.phone_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Wallet Balance</p>
                  <p className={`text-2xl font-bold ${hasWalletBalance ? 'text-green-600' : 'text-gray-400'}`}>
                    {formatTZS(customerBalance.wallet_cents)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {!hasWalletBalance && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-yellow-800">
                  This customer has no wallet balance available to apply to credit slips.
                </p>
              </div>
            )}

            {hasWalletBalance && !hasOpenSlips && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-blue-800">
                  This customer has wallet balance but no open credit slips to apply it to.
                </p>
              </div>
            )}

            {/* Open Credit Slips */}
            {hasOpenSlips && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Open Credit Slips
                  {!hasWalletBalance && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (No wallet balance to apply)
                    </span>
                  )}
                </h3>
                
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Slip Number</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Total Amount</TableHeader>
                      <TableHeader>Paid Amount</TableHeader>
                      <TableHeader>Remaining</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {openSlips.map((slip) => {
                      const remainingAmount = slip.totals?.remaining_cents || 0;
                      const canApplyToSlip = hasWalletBalance && remainingAmount > 0;
                      
                      return (
                        <TableRow key={slip._id}>
                          <TableCell className="font-mono text-sm">{slip.slip_number}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              slip.status === 'OPEN' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {slip.status}
                            </span>
                          </TableCell>
                          <TableCell>{formatTZS(slip.totals?.grand_total_cents || 0)}</TableCell>
                          <TableCell>{formatTZS(slip.totals?.paid_cents || 0)}</TableCell>
                          <TableCell className="font-semibold text-red-600">
                            {formatTZS(remainingAmount)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              color={canApplyToSlip ? 'green' : 'gray'}
                              outline={!canApplyToSlip}
                              onClick={() => handleApplyWallet(slip)}
                              disabled={!canApplyToSlip}
                            >
                              <WalletIcon className="h-3 w-3 mr-1" />
                              {canApplyToSlip ? 'Apply Wallet' : 'Cannot Apply'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary */}
            {canApplyWallet && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                  <p className="text-green-800">
                    Customer has <span className="font-semibold">{formatTZS(customerBalance.wallet_cents)}</span> available 
                    to apply to <span className="font-semibold">{openSlips.length}</span> open credit slip{openSlips.length !== 1 ? 's' : ''}.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Apply Wallet Modal */}
        <ApplyWalletModal
          isOpen={showApplyWalletModal}
          onClose={() => {
            setShowApplyWalletModal(false);
            setSelectedSlipForWallet(null);
          }}
          customer={customer}
          customerBalance={customerBalance}
          creditSlip={selectedSlipForWallet}
          onSuccess={handleWalletApplicationSuccess}
        />
      </div>
    </StackedLayout>
  );
}