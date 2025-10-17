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
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserCircleIcon,
} from '@heroicons/react/16/solid';

import walletService from '../../../api/wallet-service';
import { formatCustomerData, formatTransactionEntry, formatPaginationData } from '../../../utils/api-response';
import { createErrorDisplay } from '../../../utils/error-handler';
import { formatTZS } from '../../../utils/currency';
import TransactionItem, { TransactionItemSkeleton } from './components/transaction-item';
import ErrorDisplay, { LoadingDisplay } from './components/error-display';

const ENTRY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'SALE_ON_CREDIT', label: 'Credit Slips' },
  { value: 'PAYMENT', label: 'Payments' },
  { value: 'DEPOSIT', label: 'Deposits' },
  { value: 'CHANGE_TO_BALANCE', label: 'Change Stored' },
  { value: 'BALANCE_CONSUMPTION', label: 'Wallet Applied' },
];

const PAGE_SIZES = [10, 20, 50];

export default function TransactionHistory() {
  const staffUser = useStaffUser();
  const [customer, setCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    entryType: '',
    startDate: '',
    endDate: '',
    page: 1,
    perPage: 20
  });
  const [loading, setLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Get customer ID from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('customer_id');
    const customerName = urlParams.get('customer_name');
    
    if (customerId) {
      if (customerName) {
        setCustomerSearchTerm(decodeURIComponent(customerName));
      } else {
        setCustomerSearchTerm(customerId);
      }
      searchCustomerById(customerId);
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

  // Load transactions when customer or filters change
  useEffect(() => {
    if (customer) {
      loadTransactions();
    }
  }, [customer, filters]);

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
      const customerResponse = await walletService.getCustomerById(customerId.trim());
      
      if (!customerResponse.success || !customerResponse.customers || customerResponse.customers.length === 0) {
        setFieldErrors({ customer: 'Customer not found' });
        setCustomer(null);
        setTransactions([]);
        setPagination(null);
        return;
      }

      const customerData = formatCustomerData(customerResponse.customers[0]);
      setCustomer(customerData);
      
      // Reset filters when new customer is selected
      setFilters(prev => ({ ...prev, page: 1 }));

    } catch (err) {
      console.error('Customer search error:', err);
      setFieldErrors({ customer: 'Failed to search customer' });
      setCustomer(null);
      setTransactions([]);
      setPagination(null);
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

    // Reset filters when new customer is selected
    setFilters(prev => ({ ...prev, page: 1 }));
    setTransactions([]);
    setPagination(null);
  };

  const clearCustomerSelection = () => {
    setCustomer(null);
    setCustomerSearchTerm('');
    setCustomerResults([]);
    setShowCustomerDropdown(false);
    setFieldErrors({ customer: null });
    setTransactions([]);
    setPagination(null);
  };

  const loadTransactions = async () => {
    if (!customer) return;

    setLoading(true);
    setError(null);

    try {
      const response = await walletService.getTransactionHistory(
        customer.customer_id,
        'TZS',
        filters.page,
        filters.perPage
      );

      if (response.success) {
        const formattedTransactions = response.entries.map(formatTransactionEntry);
        setTransactions(formattedTransactions);
        setPagination(formatPaginationData(response.pagination));
      } else {
        setError(createErrorDisplay(response));
        setTransactions([]);
        setPagination(null);
      }
    } catch (err) {
      console.error('Load transactions error:', err);
      setError(createErrorDisplay({ error: { message: 'Failed to load transaction history' } }));
      setTransactions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      entryType: '',
      startDate: '',
      endDate: '',
      page: 1,
      perPage: 20
    });
  };

  const exportTransactions = () => {
    // This would typically generate a CSV or PDF export
    // For now, we'll just show an alert
    alert('Export functionality would be implemented here');
  };

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <NavbarSection>
            <NavbarItem>
              <NavbarLabel>Transaction History</NavbarLabel>
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
          <h1 className="text-2xl font-semibold text-gray-900">Transaction History</h1>
          <p className="text-gray-600">View customer transaction history and audit trails</p>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorDisplay 
            error={error} 
            onRetry={loadTransactions}
            className="mb-6"
          />
        )}

        {/* Customer Search */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Search</h3>
          
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
                      key={String(result._id || result.id || result.customer_id || index)}
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

        {/* Customer Info and Filters */}
        {customer && (
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
                <div className="flex gap-3">
                  <Button outline onClick={exportTransactions}>
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FunnelIcon className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                </div>
                <Button outline onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={filters.entryType}
                    onChange={(e) => handleFilterChange('entryType', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {ENTRY_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <InputGroup>
                    <CalendarIcon />
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </InputGroup>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <InputGroup>
                    <CalendarIcon />
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </InputGroup>
                </div>

                {/* Page Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Items per Page
                  </label>
                  <select
                    value={filters.perPage}
                    onChange={(e) => handleFilterChange('perPage', parseInt(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {PAGE_SIZES.map(size => (
                      <option key={size} value={size}>
                        {size} items
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-lg shadow">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Transaction History
                    {pagination && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({pagination.total_entries} total)
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              {/* Loading Skeletons */}
              {loading && (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <TransactionItemSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Transaction Items */}
              {!loading && transactions.length > 0 && (
                <div className="p-6 space-y-4">
                  {transactions.map((transaction) => (
                    <TransactionItem 
                      key={String(transaction.entry_id)} 
                      transaction={transaction}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && transactions.length === 0 && customer && (
                <div className="p-12 text-center">
                  <WalletIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
                  <p className="text-gray-600">
                    {filters.entryType || filters.startDate || filters.endDate
                      ? 'No transactions match your current filters.'
                      : 'This customer has no transaction history yet.'
                    }
                  </p>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                      {Math.min(pagination.current_page * pagination.per_page, pagination.total_entries)} of{' '}
                      {pagination.total_entries} results
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        outline
                        size="sm"
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        disabled={!pagination.has_prev}
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <span className="text-sm text-gray-700">
                        Page {pagination.current_page} of {pagination.total_pages}
                      </span>
                      
                      <Button
                        outline
                        size="sm"
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={!pagination.has_next}
                      >
                        Next
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </StackedLayout>
  );
}