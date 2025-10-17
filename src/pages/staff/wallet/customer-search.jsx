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
  CreditCardIcon,
  BanknotesIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/16/solid';

import walletService from '../../../api/wallet-service';
import { formatCustomerData, formatCustomerBalance } from '../../../utils/api-response';
import { createErrorDisplay, createSuccessDisplay } from '../../../utils/error-handler';
import { formatTZS } from '../../../utils/currency';
import CustomerBalanceCard from './components/customer-balance-card';
import ApplyWalletModal from './components/apply-wallet-modal';
import ErrorDisplay, { LoadingDisplay, SuccessDisplay } from './components/error-display';

export default function CustomerSearch() {
  const staffUser = useStaffUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [customer, setCustomer] = useState(null);
  const [customerResults, setCustomerResults] = useState([]);
  const [balance, setBalance] = useState(null);
  const [openSlips, setOpenSlips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showApplyWalletModal, setShowApplyWalletModal] = useState(false);
  const [selectedSlipForWallet, setSelectedSlipForWallet] = useState(null);

  useEffect(() => {
    const checkUrlForCustomerId = async () => { 
      const urlParams = new URLSearchParams(window.location.search);
      const customerId = urlParams.get('customer_id');
      
       if (customerId) {
        setLoading(true);
        setError(null);
        
        try { 
          const customerResponse = await walletService.getCustomerById(customerId);
          
          if (customerResponse.success && customerResponse.customers && customerResponse.customers.length > 0) {
            selectCustomer(customerResponse.customers[0]);
            if (customerResponse.customers[0].name) {
              setSearchTerm(customerResponse.customers[0].name);
            }
            setSearchPerformed(true);
          } else {
            setError(createErrorDisplay({
              error: { message: `Failed to find customer with ID: ${customerId}` }
            }));
          }
        } catch (err) {
          console.error('Error loading customer from URL param:', err);
          setError(createErrorDisplay({
            error: { message: 'Failed to load customer from URL parameter' }
          }));
        } finally {
          setLoading(false);
        }
      }
    };
    
    checkUrlForCustomerId();
  }, []);  

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

     if (value.trim().length >= 3) {
      const timeout = setTimeout(() => {
        handleSearch({ preventDefault: () => {} });
      }, 500);
      setSearchTimeout(timeout);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim() || searchTerm.trim().length < 3) return;

    // Clear any pending auto-search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setCustomer(null);
    setCustomerResults([]);
    setBalance(null);
    setOpenSlips([]);
    setSearchPerformed(true);

    try {
      // Search for customer
      const customerResponse = await walletService.searchCustomer(searchTerm.trim());
      
      if (!customerResponse.success) {
        setError(createErrorDisplay(customerResponse));
        return;
      }

      // If there are customers in the response
      if (customerResponse.customers && customerResponse.customers.length > 0) {
        // Store all customers found in state
        setCustomerResults(customerResponse.customers);
        
        // If there's only one customer, select it automatically
        if (customerResponse.customers.length === 1) {
          selectCustomer(customerResponse.customers[0]);
        }
      } else {
        setError(createErrorDisplay({ 
          error: { message: `No customers found matching "${searchTerm}"` } 
        }));
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(createErrorDisplay({ 
        error: { 
          message: 'Failed to search customer',
          details: err.message || 'An unexpected error occurred'
        } 
      }));
    } finally {
      setLoading(false);
    }
  };

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

  const handleQuickAction = (action, customerId) => {
    const baseUrl = '/staff/wallet';
    const params = new URLSearchParams({ customer_id: customerId });
    
    // If we have balance data, pass it as well for better context
    if (balance) {
      if (balance.wallet_cents) {
        params.append('wallet_balance', balance.wallet_cents);
      }
      if (balance.credit_slip_cents) {
        params.append('credit_balance', balance.credit_slip_cents);
      }
    }
    
    // If we have customer name, pass it as well
    if (customer && customer.name) {
      params.append('customer_name', encodeURIComponent(customer.name));
    }
    
    // If we have phone number and email, pass them as well
    if (customer && customer.phone_number) {
      params.append('phone_number', encodeURIComponent(customer.phone_number));
    }
    
    if (customer && customer.email) {
      params.append('email', encodeURIComponent(customer.email));
    }
    
    switch (action) {
      case 'create-credit':
        window.location.href = `${baseUrl}/create-credit?${params}`;
        break;
      case 'process-payment':
        window.location.href = `${baseUrl}/process-payment?${params}`;
        break;
      case 'store-change':
        window.location.href = `${baseUrl}/store-change?${params}`;
        break;
      case 'view-history':
        window.location.href = `${baseUrl}/history?${params}`;
        break;
    }
  };

  const selectCustomer = async (customerData) => {
    try {
      const formattedCustomer = formatCustomerData(customerData);
      setCustomer(formattedCustomer);
      
      // Get customer balance
      const balanceResponse = await walletService.getCustomerBalance(formattedCustomer.customer_id);
      
      if (balanceResponse.success) {
        const balanceData = formatCustomerBalance(balanceResponse.balance);
        setBalance(balanceData);

        // Get open credit slips if any
        if (balanceData && balanceData.open_slips_count > 0) {
          const slipsResponse = await walletService.getOpenCreditSlips(formattedCustomer.customer_id);
          if (slipsResponse.success) {
            setOpenSlips(slipsResponse.slips || []);
          }
        }
      } else {
        console.warn('Could not fetch customer balance:', balanceResponse.error?.message);
      }
      
      // Update URL with the customer_id without reloading the page
      const url = new URL(window.location);
      url.searchParams.set('customer_id', formattedCustomer.customer_id);
      window.history.pushState({}, '', url);
      
    } catch (err) {
      console.error('Error selecting customer:', err);
      setError(createErrorDisplay({ 
        error: { message: 'Failed to load customer details' } 
      }));
    }
  };

  const handleRetry = () => {
    handleSearch({ preventDefault: () => {} });
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
      handleSearch({ preventDefault: () => {} });
    }
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderNoResults = () => {
    if (!searchPerformed || loading || error || customer || customerResults.length > 0) return null;

    return (
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-red-100 rounded-full mb-4">
          <UsersIcon className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No Customers Found</h3>
        <p className="text-gray-600 mb-4 max-w-lg mx-auto">
          We couldn't find any customers matching "<span className="font-medium text-red-600">{searchTerm}</span>"
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-left text-amber-700">
              <p className="font-medium mb-1">Suggestions:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Check the spelling of the name</li>
                <li>Try using fewer characters</li>
                <li>Search with a different name</li>
                <li>Try searching by phone number if available</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button 
            color="blue"
            onClick={() => {
              setSearchTerm('');
              setSearchPerformed(false);
            }}
            className="flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Start a New Search
          </Button>
        </div>
      </div>
    );
  };
  
  const renderInitialState = () => {
    if (searchPerformed || loading || customer || customerResults.length > 0) return null;
    
    return (
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Search for a Customer</h3>
        <p className="text-gray-600 mb-4 max-w-lg mx-auto">
          Enter a customer name in the search box above to find their wallet information and manage their account.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="font-medium text-blue-800 mb-1">Find Customers</h4>
            <p className="text-sm text-blue-600">Search for customers by name to view their wallet details</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="font-medium text-green-800 mb-1">Manage Wallet</h4>
            <p className="text-sm text-green-600">Check balances, process payments, and apply wallet credit</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
              </svg>
            </div>
            <h4 className="font-medium text-purple-800 mb-1">View History</h4>
            <p className="text-sm text-purple-600">See transaction history and audit customer activity</p>
          </div>
        </div>
      </div>
    );
  };
  
  
  const renderCustomerResults = () => {
    if (!searchPerformed || loading || error || customer || customerResults.length === 0) return null;
    
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Customer Results</h3>
            <p className="text-gray-600">Found {customerResults.length} customers matching "{searchTerm}"</p>
          </div>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Click on a customer to view details
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customerResults.map(result => (
            <div 
              key={result._id || result.id} 
              className="border border-gray-200 rounded-lg p-5 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200 shadow-sm hover:shadow"
              onClick={() => selectCustomer(result)}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <UserCircleIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-gray-900 text-lg">{result.name}</h4>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      ID: {result.loyverse_id ? result.loyverse_id.substring(0, 8) : 'N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {result.phone_number && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                        {result.phone_number}
                      </p>
                    )}
                    {result.email && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                        {result.email}
                      </p>
                    )}
                    {result.total_visits > 0 && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <UserCircleIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                        <span className="flex items-center">
                          <span className="font-medium text-gray-800">{result.total_visits}</span>
                          <span className="ml-1">visits</span>
                        </span>
                      </p>
                    )}
                    {result.total_spent > 0 && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                        <span className="font-medium text-gray-800">{formatTZS(result.total_spent)}</span>
                      </p>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                    <Button size="sm" color="blue" className="px-4">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <NavbarSection>
            <NavbarItem>
              <NavbarLabel>Customer Search</NavbarLabel>
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
          <h1 className="text-2xl font-semibold text-gray-900">Customer Search</h1>
          <p className="text-gray-600">Search for customers and view their wallet balances</p>
        </div>

        {/* Search Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Find Customer</h3>
          <p className="text-gray-600 mb-4">Search for customers by name to view wallet details</p>
          
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <InputGroup>
                <MagnifyingGlassIcon className="text-blue-500" />
                <Input
                  type="text"
                  placeholder="Enter customer name (at least 3 characters)..."
                  value={searchTerm}
                  onChange={handleSearchInput}
                  disabled={loading}
                  className="text-black !text-black dark:!text-black py-3"
                  style={{ color: 'black' }}
                />
              </InputGroup>
              {searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
                <p className="absolute text-xs text-amber-600 mt-1">
                  Type at least 3 characters to search
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={loading || searchTerm.trim().length < 3}
              color="blue"
              className="px-6 font-medium"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : 'Search'}
            </Button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingDisplay 
            message="Searching for customer..." 
            subMessage={searchTerm ? `Looking for customers matching "${searchTerm}"` : "Retrieving customer information"} 
            className="mb-6"
          />
        )}

        {/* Success Message */}
        {success && (
          <SuccessDisplay message={success.message} className="mb-6" />
        )}

        {/* Error State */}
        {error && (
          <ErrorDisplay 
            error={error} 
            onRetry={handleRetry}
            className="mb-6"
          />
        )}

        {/* Initial State */}
        {renderInitialState()}
        
        {/* No Results */}
        {renderNoResults()}
        
        {/* Customer Results List */}
        {renderCustomerResults()}

        {/* Customer Results */}
        {customer && balance && (
          <div className="space-y-6">
            {/* Customer Balance Card */}
            <CustomerBalanceCard customer={customer} balance={balance} />

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
              <p className="text-sm text-gray-600 mb-4">Select an action to perform for this customer</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                  className="group flex flex-col items-center justify-center p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                  onClick={() => handleQuickAction('create-credit', customer.customer_id)}
                >
                  <div className="mb-3 p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Create Credit Slip</h4>
                  <p className="text-xs text-gray-600 text-center">Create a new credit slip for this customer</p>
                </div>
                
                <div 
                  className="group flex flex-col items-center justify-center p-5 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                  onClick={() => handleQuickAction('process-payment', customer.customer_id)}
                >
                  <div className="mb-3 p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                    <CreditCardIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Process Payment</h4>
                  <p className="text-xs text-gray-600 text-center">Process a payment for this customer</p>
                </div>
                
                <div 
                  className="group flex flex-col items-center justify-center p-5 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                  onClick={() => handleQuickAction('store-change', customer.customer_id)}
                >
                  <div className="mb-3 p-3 bg-amber-100 rounded-full group-hover:bg-amber-200 transition-colors">
                    <BanknotesIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Store Change</h4>
                  <p className="text-xs text-gray-600 text-center">Store change to the customer wallet</p>
                </div>
                
                <div 
                  className="group flex flex-col items-center justify-center p-5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                  onClick={() => handleQuickAction('view-history', customer.customer_id)}
                >
                  <div className="mb-3 p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                    <ChartBarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">View History</h4>
                  <p className="text-xs text-gray-600 text-center">See transaction history and activity</p>
                </div>
              </div>
            </div>

            {/* Open Credit Slips */}
            {openSlips.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Open Credit Slips</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {openSlips.length === 1 
                        ? "1 outstanding credit slip requiring attention" 
                        : `${openSlips.length} outstanding credit slips requiring attention`}
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    {balance && balance.wallet_cents > 0 ? (
                      <div className="bg-green-50 border border-green-200 px-3 py-1 rounded-md mr-3">
                        <span className="text-xs text-green-700 font-medium">Available wallet balance: {formatTZS(balance.wallet_cents)}</span>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-md mr-3">
                        <span className="text-xs text-yellow-700 font-medium">No wallet balance available</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHead>
                      <TableRow className="bg-gray-50">
                        <TableHeader className="py-3 px-4">Slip Number</TableHeader>
                        <TableHeader className="py-3 px-4">Status</TableHeader>
                        <TableHeader className="py-3 px-4">Total Amount</TableHeader>
                        <TableHeader className="py-3 px-4">Paid Amount</TableHeader>
                        <TableHeader className="py-3 px-4">Remaining</TableHeader>
                        <TableHeader className="py-3 px-4">Created</TableHeader>
                        <TableHeader className="py-3 px-4">Actions</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {openSlips.map((slip) => {
                        const isFullyPayable = balance && balance.wallet_cents >= (slip.totals?.remaining_cents || 0);
                        const canApply = balance && balance.wallet_cents > 0 && (slip.totals?.remaining_cents || 0) > 0;
                        
                        return (
                          <TableRow key={slip._id} className="hover:bg-blue-50 transition-colors">
                            <TableCell className="font-mono text-sm py-3 px-4">{slip.slip_number}</TableCell>
                            <TableCell className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                slip.status === 'OPEN' 
                                  ? 'bg-red-100 text-red-800 border-red-200'
                                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}>
                                {slip.status}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span className="font-medium">{formatTZS(slip.totals?.grand_total_cents || 0)}</span>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              {slip.totals?.paid_cents > 0 ? (
                                <span className="text-green-600 font-medium">{formatTZS(slip.totals?.paid_cents || 0)}</span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span className="font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                                {formatTZS(slip.totals?.remaining_cents || 0)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 py-3 px-4">
                              <div className="flex flex-col">
                                <span>{new Date(slip.created_at).toLocaleDateString()}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(slip.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <Button
                                size="sm"
                                color={isFullyPayable ? "green" : canApply ? "blue" : "gray"}
                                outline={!isFullyPayable}
                                onClick={() => handleApplyWallet(slip)}
                                disabled={!canApply}
                                className="whitespace-nowrap"
                              >
                                <WalletIcon className="h-4 w-4 mr-1.5" />
                                {isFullyPayable ? "Pay in Full" : canApply ? "Apply Partial" : "Cannot Apply"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-start text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-blue-700">
                      Click "Apply Partial" to use available wallet balance towards a credit slip. 
                      If the wallet balance covers the entire amount, you can pay in full.
                    </p>
                  </div>
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
          customerBalance={balance}
          creditSlip={selectedSlipForWallet}
          onSuccess={handleWalletApplicationSuccess}
        />
      </div>
    </StackedLayout>
  );
}