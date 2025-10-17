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
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/16/solid';

import walletService from '../../../api/wallet-service';
import { formatCustomerData, formatCustomerBalance } from '../../../utils/api-response';
import { createErrorDisplay, createSuccessDisplay } from '../../../utils/error-handler';
import { formatTZS, validateTZSInput } from '../../../utils/currency';
import ErrorDisplay, { LoadingDisplay, SuccessDisplay } from './components/error-display';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: BanknotesIcon },
  { value: 'CARD', label: 'Card', icon: CreditCardIcon },
  { value: 'MOBILE', label: 'Mobile Money', icon: DevicePhoneMobileIcon },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: BuildingLibraryIcon },
];

export default function ProcessPayment() {
  const staffUser = useStaffUser();
  const [customer, setCustomer] = useState(null);
  const [customerBalance, setCustomerBalance] = useState(null);
  const [openSlips, setOpenSlips] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAmountCents, setPaymentAmountCents] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
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
      // Get customer by ID
      const customerResponse = await walletService.getCustomerById(customerId.trim());
      
      if (!customerResponse.success || !customerResponse.customers || customerResponse.customers.length === 0) {
        setFieldErrors({ customer: 'Customer not found' });
        setCustomer(null);
        setCustomerBalance(null);
        setOpenSlips([]);
        return;
      }

      const customerData = formatCustomerData(customerResponse.customers[0]);
      setCustomer(customerData);

      // Get customer balance
      const balanceResponse = await walletService.getCustomerBalance(customerData.customer_id);
      
      if (balanceResponse.success) {
        const balanceData = formatCustomerBalance(balanceResponse.balance);
        setCustomerBalance(balanceData);
        
        // Get open credit slips if any
        const slipsResponse = await walletService.getOpenCreditSlips(customerData.customer_id);
        if (slipsResponse.success) {
          setOpenSlips(slipsResponse.slips || []);
        }
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

    // Load customer balance and open slips
    try {
      const [balanceResponse, slipsResponse] = await Promise.all([
        walletService.getCustomerBalance(formattedCustomer.customer_id),
        walletService.getOpenCreditSlips(formattedCustomer.customer_id)
      ]);

      if (balanceResponse.success) {
        const balanceData = formatCustomerBalance(balanceResponse.balance);
        setCustomerBalance(balanceData);
      }

      if (slipsResponse.success) {
        setOpenSlips(slipsResponse.slips || []);
      }
    } catch (err) {
      console.error('Error loading customer data:', err);
    }
  };

  const clearCustomerSelection = () => {
    setCustomer(null);
    setCustomerBalance(null);
    setOpenSlips([]);
    setCustomerSearchTerm('');
    setCustomerResults([]);
    setShowCustomerDropdown(false);
    setFieldErrors({ customer: null });
  };

  const handlePaymentAmountChange = (value) => {
    setPaymentAmount(value);

    if (value === '') {
      setPaymentAmountCents(0);
      setFieldErrors({ ...fieldErrors, amount: null });
      return;
    }

    const validation = validateTZSInput(value);
    if (validation.isValid) {
      setPaymentAmountCents(validation.amount);
      setFieldErrors({ ...fieldErrors, amount: null });
    } else {
      setFieldErrors({ ...fieldErrors, amount: validation.error });
    }
  };

  // Calculate how payment will be automatically allocated
  const calculatePaymentAllocation = () => {
    if (!paymentAmountCents || !openSlips) {
      return { toSlips: 0, toWallet: paymentAmountCents, slipPayments: [] };
    }

    let remainingPayment = paymentAmountCents;
    const slipPayments = [];
    let totalToSlips = 0;

    // Sort slips by creation date (oldest first)
    const sortedSlips = [...openSlips].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );

    // Allocate to slips first
    for (const slip of sortedSlips) {
      if (remainingPayment <= 0) break;
      
      const slipRemaining = slip.totals?.remaining_cents || 0;
      const allocateToSlip = Math.min(remainingPayment, slipRemaining);
      
      if (allocateToSlip > 0) {
        slipPayments.push({
          slip_id: slip._id,
          amount: allocateToSlip,
          slip_number: slip.slip_number
        });
        totalToSlips += allocateToSlip;
        remainingPayment -= allocateToSlip;
      }
    }

    return {
      toSlips: totalToSlips,
      toWallet: remainingPayment,
      slipPayments
    };
  };

  const paymentAllocation = calculatePaymentAllocation();
  const totalDebt = openSlips.reduce((sum, slip) => sum + (slip.totals?.remaining_cents || 0), 0);

  const validateForm = () => {
    const errors = {};

    if (!customer) {
      errors.customer = 'Please select a customer';
    }

    if (paymentAmountCents <= 0) {
      errors.amount = 'Payment amount must be greater than zero';
    }

    if (!paymentMethod) {
      errors.method = 'Please select a payment method';
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
      // Automatically create allocations
      const allocation = calculatePaymentAllocation();
      const allocations = [];

      // Add slip allocations
      allocation.slipPayments.forEach(payment => {
        allocations.push({
          type: 'slip',
          slip_id: payment.slip_id,
          applied_cents: payment.amount
        });
      });

      // Add wallet allocation if there's remaining amount
      if (allocation.toWallet > 0) {
        allocations.push({
          type: 'wallet',
          applied_cents: allocation.toWallet
        });
      }

      const paymentData = {
        customer_id: customer.customer_id,
        store_id: 'default-store',
        currency: 'TZS',
        method: paymentMethod,
        amount_cents: paymentAmountCents,
        allocations: allocations,
        occurred_at: new Date().toISOString()
      };

      const response = await walletService.processPayment(paymentData);

      if (response.success) {
        let successMessage = `Payment of ${formatTZS(paymentAmountCents)} processed successfully`;
        const details = [];

        if (response.applied_total > 0) {
          details.push(`✓ Paid down debt: ${formatTZS(response.applied_total)}`);
        }

        if (response.wallet_topup > 0) {
          details.push(`✓ Added to wallet: ${formatTZS(response.wallet_topup)}`);
        }

        if (allocation.toSlips > 0 && allocation.toWallet === 0) {
          successMessage = `Debt payment of ${formatTZS(paymentAmountCents)} processed successfully`;
        } else if (allocation.toSlips === 0 && allocation.toWallet > 0) {
          successMessage = `Wallet top-up of ${formatTZS(paymentAmountCents)} processed successfully`;
        }

        setSuccess(createSuccessDisplay(successMessage, details.join(' • ')));

        // Reset form
        setPaymentAmount('');
        setPaymentAmountCents(0);
        setFieldErrors({});

        // Refresh customer data
        if (customer) {
          searchCustomerById(customer.customer_id);
        }

        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(createErrorDisplay(response));
      }
    } catch (err) {
      console.error('Process payment error:', err);
      setError(createErrorDisplay({ error: { message: 'Failed to process payment' } }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <NavbarSection>
            <NavbarItem>
              <NavbarLabel>Process Payment</NavbarLabel>
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
          <h1 className="text-2xl font-semibold text-gray-900">Process Payment</h1>
          <p className="text-gray-600">Record customer payments - debts are paid automatically, excess goes to wallet</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6">
            <SuccessDisplay message={success.message} />
            {success.details && (
              <div className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                {success.details}
              </div>
            )}
          </div>
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
                          Wallet Balance: <span className="font-semibold">{formatTZS(customerBalance.wallet_cents)}</span>
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

          {/* Payment Details */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount *
                </label>
                <Input
                  type="text"
                  placeholder="Enter payment amount..."
                  value={paymentAmount}
                  onChange={(e) => handlePaymentAmountChange(e.target.value)}
                  className="text-black placeholder-gray-500"
                  style={{ color: 'black' }}
                />
                
                {/* Quick Amount Buttons */}
                {customer && totalDebt > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      outline
                      onClick={() => {
                        setPaymentAmount(formatTZS(totalDebt).replace(/[^\d]/g, ''));
                        setPaymentAmountCents(totalDebt);
                      }}
                      className="text-xs"
                    >
                      Pay All Debt ({formatTZS(totalDebt)})
                    </Button>
                    {openSlips.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        outline
                        onClick={() => {
                          const firstSlipAmount = openSlips[0].totals?.remaining_cents || 0;
                          setPaymentAmount(formatTZS(firstSlipAmount).replace(/[^\d]/g, ''));
                          setPaymentAmountCents(firstSlipAmount);
                        }}
                        className="text-xs"
                      >
                        Pay Oldest ({formatTZS(openSlips[0].totals?.remaining_cents || 0)})
                      </Button>
                    )}
                  </div>
                )}
                
                {fieldErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.amount}</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${paymentMethod === method.value
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <method.icon className="h-4 w-4" />
                      {method.label}
                    </button>
                  ))}
                </div>
                {fieldErrors.method && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.method}</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Preview */}
          {customer && paymentAmountCents > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <BanknotesIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">Payment: {formatTZS(paymentAmountCents)}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  {paymentAllocation.toSlips > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">• Will pay down debt:</span>
                      <span className="font-semibold text-green-700">{formatTZS(paymentAllocation.toSlips)}</span>
                    </div>
                  )}
                  
                  {paymentAllocation.toWallet > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">• Will add to wallet:</span>
                      <span className="font-semibold text-blue-700">{formatTZS(paymentAllocation.toWallet)}</span>
                    </div>
                  )}
                  
                  {paymentAllocation.slipPayments.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">Debt payments (oldest first):</p>
                      {paymentAllocation.slipPayments.map((payment, index) => (
                        <div key={payment.slip_id} className="flex justify-between text-xs text-blue-600">
                          <span>Credit Slip #{payment.slip_number}</span>
                          <span>{formatTZS(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {paymentAllocation.toSlips === 0 && paymentAllocation.toWallet > 0 && (
                  <div className="mt-2 flex items-center text-sm text-blue-700">
                    <WalletIcon className="h-4 w-4 mr-1" />
                    <span>No outstanding debt - full amount goes to wallet</span>
                  </div>
                )}
                
                {paymentAllocation.toSlips > 0 && paymentAllocation.toWallet === 0 && (
                  <div className="mt-2 flex items-center text-sm text-green-700">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    <span>Payment will reduce debt</span>
                  </div>
                )}
              </div>
              
              {totalDebt > paymentAmountCents && totalDebt > 0 && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center text-sm text-orange-700">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                    <span>Remaining debt after payment: {formatTZS(totalDebt - paymentAmountCents)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={loading || !customer || paymentAmountCents <= 0}
              color="blue"
            >
              {loading ? 'Processing Payment...' : 'Process Payment'}
            </Button>
          </div>
        </form>
      </div>
    </StackedLayout>
  );
}