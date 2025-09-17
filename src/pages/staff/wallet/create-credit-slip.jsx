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
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserCircleIcon,
} from '@heroicons/react/16/solid';

import walletService from '../../../api/wallet-service';
import { formatCustomerData } from '../../../utils/api-response';
import { createErrorDisplay, createSuccessDisplay } from '../../../utils/error-handler';
import { formatTZS, parseTZSToCents, validateTZSInput, addAmounts } from '../../../utils/currency';
import ProductSelector from './components/product-selector';
import ErrorDisplay, { LoadingDisplay, SuccessDisplay } from './components/error-display';

export default function CreateCreditSlip() {
  const staffUser = useStaffUser();
  const [customer, setCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [taxCents, setTaxCents] = useState(0);
  const [discountCents, setDiscountCents] = useState(0);
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
    
    if (customerId) {
      if (customerName) {
        setCustomerSearchTerm(decodeURIComponent(customerName));
      } else {
        setCustomerSearchTerm(customerId);
      }
      searchCustomerById(customerId);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCustomerDropdown && !event.target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomerDropdown]);

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
      const response = await walletService.getCustomerById(customerId.trim());
      
      if (response.success && response.customers && response.customers.length > 0) {
        selectCustomer(response.customers[0]);
      } else {
        setFieldErrors({ customer: 'Customer not found' });
        setCustomer(null);
      }
    } catch (err) {
      console.error('Customer search error:', err);
      setFieldErrors({ customer: 'Failed to search customer by ID' });
      setCustomer(null);
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
      const response = await walletService.searchCustomer(searchTerm.trim());
      
      if (response.success && response.customers && response.customers.length > 0) {
        setCustomerResults(response.customers);
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

  const selectCustomer = (customerData) => {
    const formattedCustomer = formatCustomerData(customerData);
    setCustomer(formattedCustomer);
    setCustomerSearchTerm(customerData.name);
    setCustomerResults([]);
    setShowCustomerDropdown(false);
    setFieldErrors({ customer: null });
  };

  const clearCustomerSelection = () => {
    setCustomer(null);
    setCustomerSearchTerm('');
    setCustomerResults([]);
    setShowCustomerDropdown(false);
    setFieldErrors({ customer: null });
  };

  const handleCustomerSearch = (e) => {
    e.preventDefault();
    if (customerSearchTerm.trim().length >= 2) {
      searchCustomer(customerSearchTerm);
    }
  };

  const calculateTotals = () => {
    const subtotalCents = selectedItems.reduce((sum, item) => sum + item.line_total_cents, 0);
    const grandTotalCents = addAmounts(addAmounts(subtotalCents, taxCents), -discountCents);
    
    return {
      subtotalCents,
      taxCents,
      discountCents,
      grandTotalCents: Math.max(0, grandTotalCents) // Ensure non-negative
    };
  };

  const validateForm = () => {
    const errors = {};

    if (!customer) {
      errors.customer = 'Please select a customer';
    }

    if (selectedItems.length === 0) {
      errors.items = 'Please add at least one item';
    }

    // Validate tax amount
    if (taxCents < 0) {
      errors.tax = 'Tax amount cannot be negative';
    }

    // Validate discount amount
    if (discountCents < 0) {
      errors.discount = 'Discount amount cannot be negative';
    }

    const totals = calculateTotals();
    if (totals.grandTotalCents <= 0) {
      errors.total = 'Total amount must be greater than zero';
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
      const creditSlipData = {
        customer_id: customer.customer_id,
        store_id: 'default-store',  
        currency: 'TZS',
        lines: selectedItems.map(item => ({
          item_id: item.item_id,
          description: item.description,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents
        })),
        tax_cents: taxCents,
        discount_cents: discountCents,
        occurred_at: new Date().toISOString()
      };

      const response = await walletService.createCreditSlip(creditSlipData);

      if (response.success) {
        const successMessage = `Credit slip ${response.slip_number} created successfully for ${formatTZS(response.grand_total_cents)}`;
        setSuccess(createSuccessDisplay(successMessage));
        
        // Reset form
        setSelectedItems([]);
        setTaxCents(0);
        setDiscountCents(0);
        setFieldErrors({});
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(createErrorDisplay(response));
      }
    } catch (err) {
      console.error('Create credit slip error:', err);
      setError(createErrorDisplay({ error: { message: 'Failed to create credit slip' } }));
    } finally {
      setLoading(false);
    }
  };

  const handleTaxChange = (value) => {
    const validation = validateTZSInput(value);
    if (validation.isValid) {
      setTaxCents(validation.amount);
      setFieldErrors({ ...fieldErrors, tax: null });
    } else if (value === '') {
      setTaxCents(0);
      setFieldErrors({ ...fieldErrors, tax: null });
    } else {
      setFieldErrors({ ...fieldErrors, tax: validation.error });
    }
  };

  const handleDiscountChange = (value) => {
    const validation = validateTZSInput(value);
    if (validation.isValid) {
      setDiscountCents(validation.amount);
      setFieldErrors({ ...fieldErrors, discount: null });
    } else if (value === '') {
      setDiscountCents(0);
      setFieldErrors({ ...fieldErrors, discount: null });
    } else {
      setFieldErrors({ ...fieldErrors, discount: validation.error });
    }
  };

  const totals = calculateTotals();

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <NavbarSection>
            <NavbarItem>
              <NavbarLabel>Create Credit Slip</NavbarLabel>
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
          <h1 className="text-2xl font-semibold text-gray-900">Create Credit Slip</h1>
          <p className="text-gray-600">Create a new credit slip for items taken on credit</p>
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
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
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
                  <Button 
                    type="button"
                    onClick={handleCustomerSearch}
                    disabled={customerLoading || customerSearchTerm.trim().length < 2}
                    color="blue"
                    outline
                  >
                    {customerLoading ? 'Searching...' : 'Search'}
                  </Button>
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
                        key={result._id || result.id || index}
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

          {/* Product Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
            <ProductSelector 
              selectedItems={selectedItems}
              onItemsChange={setSelectedItems}
            />
            {fieldErrors.items && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.items}</p>
            )}
          </div>

          {/* Totals and Additional Charges */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Totals</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tax and Discount Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Amount
                  </label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={formatTZS(taxCents, false)}
                    onChange={(e) => handleTaxChange(e.target.value)}
                  />
                  {fieldErrors.tax && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.tax}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Amount
                  </label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={formatTZS(discountCents, false)}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                  />
                  {fieldErrors.discount && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.discount}</p>
                  )}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatTZS(totals.subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatTZS(totals.taxCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium">-{formatTZS(totals.discountCents)}</span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatTZS(totals.grandTotalCents)}</span>
                  </div>
                </div>
                {fieldErrors.total && (
                  <p className="mt-2 text-sm text-red-600">{fieldErrors.total}</p>
                )}
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
              disabled={loading || !customer || selectedItems.length === 0}
              color="blue"
            >
              {loading ? 'Creating Credit Slip...' : 'Create Credit Slip'}
            </Button>
          </div>
        </form>
      </div>
    </StackedLayout>
  );
}