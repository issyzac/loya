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
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/16/solid';

import walletService from '../../../api/wallet-service';
import { createErrorDisplay } from '../../../utils/error-handler';
import AuditEntry, { AuditEntrySkeleton } from './components/audit-entry';
import ErrorDisplay, { LoadingDisplay } from './components/error-display';

const OPERATION_TYPES = [
  { value: '', label: 'All Operations' },
  { value: 'CREDIT_SLIP_CREATED', label: 'Credit Slip Created' },
  { value: 'PAYMENT_PROCESSED', label: 'Payment Processed' },
  { value: 'CHANGE_STORED', label: 'Change Stored' },
  { value: 'WALLET_APPLIED', label: 'Wallet Applied' },
  { value: 'BALANCE_ADJUSTMENT', label: 'Balance Adjustment' },
];

const PAGE_SIZES = [20, 50, 100];

export default function AuditTrail() {
  const staffUser = useStaffUser();
  const [auditEntries, setAuditEntries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    customerId: '',
    operationType: '',
    startDate: '',
    endDate: '',
    page: 1,
    perPage: 20
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Check if user has permission to access audit trail
    // In a real implementation, this would check actual permissions
    const hasAuditAccess = staffUser?.role === 'admin' || staffUser?.role === 'manager';
    if (!hasAuditAccess) {
      setAccessDenied(true);
      return;
    }

    loadAuditTrail();
  }, [filters, staffUser]);

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

  const loadAuditTrail = async () => {
    if (accessDenied) return;

    setLoading(true);
    setError(null);

    try {
      const response = await walletService.getAuditTrail({
        customerId: filters.customerId || undefined,
        operationType: filters.operationType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page: filters.page,
        perPage: filters.perPage
      });

      if (response.success) {
        // Mock data for demonstration - in real implementation, use response.entries
        const mockEntries = [
          {
            audit_id: 'AUD001',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            operation_type: 'PAYMENT_PROCESSED',
            customer_id: 'CUST001',
            amount_cents: 1500000,
            currency: 'TZS',
            user_id: 'staff_jane',
            user_role: 'cashier',
            operation_data: {
              payment_id: 'PAY001',
              method: 'CASH',
              allocations: [
                { type: 'slip', slip_id: 'SLIP001', applied_cents: 1000000 },
                { type: 'wallet', applied_cents: 500000 }
              ]
            },
            request_info: {
              method: 'POST',
              endpoint: 'wallet.process_payment',
              remote_addr: '192.168.1.100',
              user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          },
          {
            audit_id: 'AUD002',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            operation_type: 'CREDIT_SLIP_CREATED',
            customer_id: 'CUST002',
            amount_cents: 850000,
            currency: 'TZS',
            user_id: 'staff_john',
            user_role: 'cashier',
            operation_data: {
              slip_id: 'SLIP002',
              slip_number: 'CS-20240115-002',
              lines: [
                { item_id: 'ITEM001', quantity: 2, unit_price_cents: 350000 },
                { item_id: 'ITEM002', quantity: 1, unit_price_cents: 150000 }
              ]
            },
            request_info: {
              method: 'POST',
              endpoint: 'wallet.create_credit_slip',
              remote_addr: '192.168.1.101',
              user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          },
          {
            audit_id: 'AUD003',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            operation_type: 'CHANGE_STORED',
            customer_id: 'CUST003',
            amount_cents: 250000,
            currency: 'TZS',
            user_id: 'staff_mike',
            user_role: 'cashier',
            operation_data: {
              change_cents: 250000,
              store_id: 'STORE001'
            },
            request_info: {
              method: 'POST',
              endpoint: 'wallet.store_change',
              remote_addr: '192.168.1.102',
              user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
            }
          }
        ];

        setAuditEntries(mockEntries);
        setPagination({
          current_page: 1,
          per_page: 20,
          total_entries: 45,
          total_pages: 3,
          has_next: true,
          has_prev: false
        });
      } else {
        setError(createErrorDisplay(response));
        setAuditEntries([]);
        setPagination(null);
      }
    } catch (err) {
      console.error('Load audit trail error:', err);
      setError(createErrorDisplay({ error: { message: 'Failed to load audit trail' } }));
      setAuditEntries([]);
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
      customerId: '',
      operationType: '',
      startDate: '',
      endDate: '',
      page: 1,
      perPage: 20
    });
  };

  const exportAuditTrail = () => {
    // This would typically generate a CSV or PDF export
    alert('Export functionality would be implemented here');
  };

  // Access denied screen
  if (accessDenied) {
    return (
      <StackedLayout
        navbar={
          <Navbar>
            <NavbarSection>
              <NavbarItem>
                <NavbarLabel>Audit Trail</NavbarLabel>
              </NavbarItem>
            </NavbarSection>
            <NavbarSpacer />
            <NavbarSection>
              <NavbarItem>
                <NavbarLabel>Welcome, {staffUser?.name || 'Staff'}</NavbarLabel>
              </NavbarItem>
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
          <Button 
            outline 
            onClick={() => window.location.href = '/staff/wallet'}
            className="mb-4"
          >
            <ArrowLeftIcon />
            Back to Wallet
          </Button>
          
          <div className="max-w-md mx-auto mt-12">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-4">
                You do not have permission to access the audit trail. This feature is restricted to administrators and managers only.
              </p>
              <Button onClick={() => window.location.href = '/staff/wallet'}>
                Return to Wallet Dashboard
              </Button>
            </div>
          </div>
        </div>
      </StackedLayout>
    );
  }

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <NavbarSection>
            <NavbarItem>
              <NavbarLabel>Audit Trail</NavbarLabel>
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
          <div className="flex items-center mb-2">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-semibold text-gray-900">Audit Trail</h1>
          </div>
          <p className="text-gray-600">Track all wallet operations for accountability and compliance</p>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorDisplay 
            error={error} 
            onRetry={loadAuditTrail}
            className="mb-6"
          />
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="flex gap-3">
              <Button outline onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button outline onClick={exportAuditTrail}>
                Export
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Customer ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer ID
              </label>
              <InputGroup>
                <MagnifyingGlassIcon />
                <Input
                  type="text"
                  placeholder="Customer ID..."
                  value={filters.customerId}
                  onChange={(e) => handleFilterChange('customerId', e.target.value)}
                />
              </InputGroup>
            </div>

            {/* Operation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation Type
              </label>
              <select
                value={filters.operationType}
                onChange={(e) => handleFilterChange('operationType', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {OPERATION_TYPES.map(type => (
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

        {/* Audit Entries */}
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Audit Entries
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
                <AuditEntrySkeleton key={i} />
              ))}
            </div>
          )}

          {/* Audit Entries */}
          {!loading && auditEntries.length > 0 && (
            <div className="p-6 space-y-4">
              {auditEntries.map((entry) => (
                <AuditEntry key={entry.audit_id} entry={entry} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && auditEntries.length === 0 && (
            <div className="p-12 text-center">
              <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Entries Found</h3>
              <p className="text-gray-600">
                {Object.values(filters).some(v => v) && (filters.customerId || filters.operationType || filters.startDate || filters.endDate)
                  ? 'No audit entries match your current filters.'
                  : 'No audit entries have been recorded yet.'
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
    </StackedLayout>
  );
}