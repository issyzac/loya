import { useState, useEffect } from 'react';
import { useStaffUser } from '../../../providers/UserProvider';
import { Sidebar, SidebarBody, SidebarHeader, SidebarItem, SidebarLabel, SidebarSection } from '../../../components/sidebar';
import { Navbar, NavbarDivider, NavbarItem, NavbarLabel, NavbarSection, NavbarSpacer } from '../../../components/navbar';
import { StackedLayout } from '../../../components/stacked-layout';
import { Button } from '../../../components/button';
import { Input, InputGroup } from '../../../components/input';
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
  BanknotesIcon,
  ArrowUpIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserCircleIcon,
} from '@heroicons/react/16/solid';

import walletService from '../../../api/wallet-service';
import { formatCustomerData, formatCustomerBalance } from '../../../utils/api-response';
import { createErrorDisplay, createSuccessDisplay } from '../../../utils/error-handler';
import { formatTZS, validateTZSInput, addAmounts } from '../../../utils/currency';
import ErrorDisplay, { LoadingDisplay, SuccessDisplay } from './components/error-display';

export default function StoreChange() {
  const staffUser = useStaffUser();
  const [customer, setCustomer] = useState(null);
  const [customerBalance, setCustomerBalance] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [changeAmount, setChangeAmount] = useState('');
  const [changeAmountCents, setChangeAmountCents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Get customer ID from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('customer_id');
    const customerName = urlParams.get('customer_name');
    const walletBalance = urlParams.get('wallet_balance');
    const creditBalance = urlParams.get('credit_balance');
    
    // Store the customer ID and search term
    if (customerId) {
      if (customerName) {
        setCustomerSearchTerm(decodeURIComponent(customerName));
      } else {
        setCustomerSearchTerm(customerId);
      }
      
      // Search for the customer
      searchCustomerById(customerId);
      
      // If we have wallet balance from URL, display it (this is an optimization)
      if (walletBalance && creditBalance) {
        console.log('Using pre-passed wallet and credit balance from URL parameters');
      }
    }
  }, []);

  // Handle clicking outside customer dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const searchCustomerById = async (customerId) => {
    if (!customerId.trim()) return;

    setCustomerLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Get customer by ID
      const customerResponse = await walletService.getCustomerById(customerId.trim());
      
      if (!customerResponse.success || !customerResponse.customers || customerResponse.customers.length === 0) {
        setFieldErrors({ customer: 'Customer not found' });
        setCustomer(null);
        setCustomerBalance(null);
        return;
      }

      const customerData = formatCustomerData(customerResponse.customers[0]);
      setCustomer(customerData);

      // Get customer balance
      const balanceResponse = await walletService.getCustomerBalance(customerData.customer_id);
      
      if (balanceResponse.success) {
        const balanceData = formatCustomerBalance(balanceResponse.balance);
        setCustomerBalance(balanceData);
      }

    } catch (err) {
      console.error('Customer search error:', err);
      setFieldErrors({ customer: 'Failed to search customer' });
    } finally {
      setCustomerLoading(false);
    }
  };

  const searchCustomer = async (searchTerm) => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    setCustomerLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Search for customer
      const customerResponse = await walletService.searchCustomer(searchTerm.trim());

      if (customerResponse.success && customerResponse.customers && customerResponse.customers.length > 0) {
        setCustomerResults(customerResponse.customers);
        setShowCustomerDropdown(true);
        setFieldErrors({ customer: null });
      } else {
        setCustomerResults([]);
        setShowCustomerDropdown(false);
        setFieldErrors({ customer: 'No customers found' });
      }
    } catch (err) {
      console.error('Customer search error:', err);
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      setFieldErrors({ customer: 'Failed to search customer' });
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleCustomerInputChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Auto-search after user stops typing for 300ms and has at least 2 characters
    if (value.trim().length >= 2) {
      const timeout = setTimeout(() => {
        searchCustomer(value);
      }, 300);
      setSearchTimeout(timeout);
    } else {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      setFieldErrors({ customer: null });
    }
  };

  const selectCustomer = async (customerData) => {
    const formattedCustomer = formatCustomerData(customerData);
    setCustomer(formattedCustomer);
    setCustomerSearchTerm(customerData.name);
    setCustomerResults([]);
    setShowCustomerDropdown(false);
    setFieldErrors({ customer: null });

    // Load customer balance
    try {
      const balanceResponse = await walletService.getCustomerBalance(formattedCustomer.customer_id);

      if (balanceResponse.success) {
        const balanceData = formatCustomerBalance(balanceResponse.balance);
        setCustomerBalance(balanceData);
      }
    } catch (err) {
      console.error('Error loading customer balance:', err);
    }
  };

  const clearCustomerSelection = () => {
    setCustomer(null);
    setCustomerBalance(null);
    setCustomerSearchTerm('');
    setCustomerResults([]);
    setShowCustomerDropdown(false);
    setFieldErrors({ customer: null });
  };

  const handleChangeAmountChange = (value) => {
    setChangeAmount(value);
    
    if (value === '') {
      setChangeAmountCents(0);
      setFieldErrors({ ...fieldErrors, amount: null });
      return;
    }

    const validation = validateTZSInput(value);
    if (validation.isValid) {
      setChangeAmountCents(validation.amount);
      setFieldErrors({ ...fieldErrors, amount: null });
    } else {
      setFieldErrors({ ...fieldErrors, amount: validation.error });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!customer) {
      errors.customer = 'Please select a customer';
    }

    if (changeAmountCents <= 0) {
      errors.amount = 'Change amount must be greater than zero';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const changeData = {
        customer_id: customer.customer_id,
        store_id: 'default-store',
        currency: 'TZS',
        change_cents: changeAmountCents
      };

      const response = await walletService.storeChange(changeData);

      if (response.success) {
        const successMessage = `Successfully stored ${formatTZS(changeAmountCents)} as wallet balance for ${customer.name}`;
        setSuccess(createSuccessDisplay(successMessage));
        
        // Reset form
        setChangeAmount('');
        setChangeAmountCents(0);
        setFieldErrors({});
        
        // Refresh customer balance
        if (customer) {
          searchCustomer(customer.customer_id);
        }
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(createErrorDisplay(response));
      }
    } catch (err) {
      console.error('Store change error:', err);
      setError(createErrorDisplay({ error: { message: 'Failed to store change' } }));
    } finally {
      setLoading(false);
    }
  };

  // Calculate new balance after adding change
  const newBalanceAfterChange = customerBalance 
    ? addAmounts(customerBalance.wallet_cents, changeAmountCents)
    : changeAmountCents;

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <NavbarSection>
            <NavbarItem>
              <NavbarLabel>Store Change</NavbarLabel>
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
          <h1 className="text-2xl font-semibold text-gray-900">Store Change</h1>
          <p className="text-gray-600">Store customer change as wallet balance when exact change is not available</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>

            {!customer ? (
              <div className="relative customer-search-container">
                <div className="flex gap-4 mb-2">
                  <div className="flex-1 relative">
                    <InputGroup>
                      <MagnifyingGlassIcon className="text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search customer by name, phone, or email (min 2 characters)..."
                        value={customerSearchTerm}
                        onChange={handleCustomerInputChange}
                        disabled={customerLoading}
                        className="pr-10 text-black placeholder-gray-500"
                        style={{ color: 'black' }}
                      />
                      {customerLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </InputGroup>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mb-4">
                  Start typing to search for customers automatically
                </p>

                {/* Customer Search Results Dropdown */}
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm text-gray-600 font-medium">
                        Found {customerResults.length} customer{customerResults.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {customerResults.map((result, index) => (
                      <div
                        key={result._id || result.id || result.customer_id || index}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => selectCustomer(result)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <UserCircleIcon className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{result.name}</h4>
                            <div className="flex flex-col gap-1 mt-1">
                              {result.phone_number && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <PhoneIcon className="h-3 w-3 mr-1 text-gray-400" />
                                  {result.phone_number}
                                </p>
                              )}
                              {result.email && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <EnvelopeIcon className="h-3 w-3 mr-1 text-gray-400" />
                                  {result.email}
                                </p>
                              )}
                              {result.total_visits > 0 && (
                                <p className="text-xs text-gray-500">
                                  {result.total_visits} visits
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-blue-600 self-center">
                            Click to select
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {fieldErrors.customer && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    {fieldErrors.customer}
                  </p>
                )}
              </div>
            ) : (
              /* Selected Customer Display */
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800">{customer.name}</p>
                      <div className="flex gap-4 mt-1">
                        {customer.phone_number && (
                          <p className="text-sm text-green-600 flex items-center">
                            <PhoneIcon className="h-3 w-3 mr-1" />
                            {customer.phone_number}
                          </p>
                        )}
                        {customer.email && (
                          <p className="text-sm text-green-600 flex items-center">
                            <EnvelopeIcon className="h-3 w-3 mr-1" />
                            {customer.email}
                          </p>
                        )}
                      </div>
                      {customerBalance && (
                        <p className="text-sm text-green-600 mt-1">
                          Current Wallet Balance: <span className="font-semibold">{formatTZS(customerBalance.wallet_cents)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    color="red"
                    outline
                    size="sm"
                    onClick={clearCustomerSelection}
                    className="hover:bg-red-50 border-red-300 text-red-700 hover:text-red-800"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Change Customer
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Change Amount */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Amount</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Change Amount *
                </label>
                <InputGroup>
                  <BanknotesIcon />
                  <Input
                    type="text"
                    placeholder="Enter change amount..."
                    value={changeAmount}
                    onChange={(e) => handleChangeAmountChange(e.target.value)}
                    className="text-black placeholder-gray-500"
                    style={{ color: 'black' }}
                  />
                </InputGroup>
                {fieldErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.amount}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Enter the amount of change to store in the customer's wallet
                </p>
              </div>

              {/* Balance Preview */}
              {customer && customerBalance && changeAmountCents > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <WalletIcon className="h-5 w-5 mr-2" />
                    Balance Preview
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Current Balance:</span>
                      <span className="font-medium text-blue-900">
                        {formatTZS(customerBalance.wallet_cents)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-blue-700">Change to Add:</span>
                      <span className="font-medium text-blue-900 flex items-center">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        {formatTZS(changeAmountCents)}
                      </span>
                    </div>
                    
                    <hr className="border-blue-300" />
                    
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">New Balance:</span>
                      <span className="font-bold text-blue-900 text-lg">
                        {formatTZS(newBalanceAfterChange)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <div className="flex items-start">
              <BanknotesIcon className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">About Store Change</h4>
                <p className="text-sm text-amber-800">
                  Use this feature when you cannot provide exact change to a customer. 
                  The change amount will be added to their wallet balance and can be used for future purchases.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button"
              outline
              onClick={() => window.location.href = '/staff/wallet'}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading || !customer || changeAmountCents <= 0}
              color="orange"
            >
              {loading ? 'Storing Change...' : 'Store Change'}
            </Button>
          </div>
        </form>

        {/* Quick Actions */}
        {customer && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                outline
                onClick={() => window.location.href = `/staff/wallet/create-credit?customer_id=${customer.customer_id}`}
                className="flex items-center justify-center gap-2"
              >
                <ClipboardDocumentListIcon className="h-4 w-4" />
                Create Credit Slip
              </Button>
              <Button
                outline
                onClick={() => window.location.href = `/staff/wallet/process-payment?customer_id=${customer.customer_id}`}
                className="flex items-center justify-center gap-2"
              >
                <BanknotesIcon className="h-4 w-4" />
                Process Payment
              </Button>
              <Button
                outline
                onClick={() => window.location.href = `/staff/wallet/history?customer_id=${customer.customer_id}`}
                className="flex items-center justify-center gap-2"
              >
                <ChartBarIcon className="h-4 w-4" />
                View History
              </Button>
            </div>
          </div>
        )}
      </div>
    </StackedLayout>
  );
}