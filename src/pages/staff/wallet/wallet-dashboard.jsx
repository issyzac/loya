import { useState, useEffect } from 'react';
import { useStaffUser } from "../../../providers/UserProvider";
import { Sidebar, SidebarBody, SidebarHeader, SidebarItem, SidebarLabel, SidebarSection } from '../../../components/sidebar';
import { Navbar, NavbarDivider, NavbarItem, NavbarLabel, NavbarSection, NavbarSpacer } from '../../../components/navbar';
import { StackedLayout } from '../../../components/stacked-layout';
import {
    ArrowRightStartOnRectangleIcon,
    BanknotesIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    Cog8ToothIcon,
    CreditCardIcon,
    HomeIcon,
    UserGroupIcon,
    UsersIcon,
    WalletIcon,
    ShieldCheckIcon,
    DocumentMagnifyingGlassIcon,
    ArrowPathIcon,
    PresentationChartLineIcon,
} from '@heroicons/react/16/solid';
import { Button } from '../../../components/button';
import WalletStats from './components/wallet-stats';
import CustomersWithBalance from './components/customers-with-balance';
import RecentTransactions from './components/recent-transactions';
import { formatTZS } from '../../../utils/currency';
import walletService from '../../../api/wallet-service';
import { createErrorDisplay } from '../../../utils/error-handler';
import ErrorDisplay from './components/error-display';

export default function WalletDashboard() {
    const staffUser = useStaffUser();
    
    // Check if user has audit access
    const hasAuditAccess = staffUser?.role === 'admin' || staffUser?.role === 'manager';

    // Wallet statistics state
    const [walletStats, setWalletStats] = useState({
        totalBalance: 0,
        customersWithBalance: 0,
        openCreditSlips: 0,
        recentTransactions: 0,
        loading: true
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        loadWalletStats();
    }, []);

    const loadWalletStats = async () => {
        try {
            setError(null);
            setWalletStats(prev => ({ ...prev, loading: true }));
            
            const response = await walletService.getWalletStats();
            
            if (response.success && response.stats) {
                setWalletStats({
                    totalBalance: response.stats.total_balance_cents || 0,
                    customersWithBalance: response.stats.customers_with_balance || 0,
                    openCreditSlips: response.stats.open_credit_slips || 0,
                    recentTransactions: response.stats.recent_transactions_count || 0,
                    loading: false
                });
            } else { 
                setWalletStats({
                    totalBalance: 0,
                    customersWithBalance: 0,
                    openCreditSlips: 0,
                    recentTransactions: 0,
                    loading: false
                });
                console.warn('Failed to load wallet stats, using fallback data');
            }
        } catch (error) {
            console.error('Failed to load wallet stats:', error);
            setError(createErrorDisplay({ error: { message: 'Failed to load wallet statistics' } }));
            setWalletStats({
                totalBalance: 0,
                customersWithBalance: 0,
                openCreditSlips: 0,
                recentTransactions: 0,
                loading: false
            });
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

    const walletActions = [
        {
            title: 'Search Customer',
            description: 'Find customer and view wallet balance',
            icon: UsersIcon,
            color: 'blue',
            href: '/staff/wallet/search'
        },
        {
            title: 'Create Credit Slip',
            description: 'Add items taken on credit',
            icon: ClipboardDocumentListIcon,
            color: 'green',
            href: '/staff/wallet/create-credit'
        },
        {
            title: 'Process Payment',
            description: 'Record customer payment',
            icon: CreditCardIcon,
            color: 'purple',
            href: '/staff/wallet/process-payment'
        },
        {
            title: 'Store Change',
            description: 'Add change to wallet balance',
            icon: BanknotesIcon,
            color: 'orange',
            href: '/staff/wallet/store-change'
        },
        {
            title: 'Transaction History',
            description: 'View transaction history for customers',
            icon: DocumentMagnifyingGlassIcon,
            color: 'emerald',
            href: '/staff/wallet/history'
        }
    ];

    if (hasAuditAccess) {
        walletActions.push({
            title: 'Audit Trail',
            description: 'View detailed audit records',
            icon: ShieldCheckIcon,
            color: 'gray',
            href: '/staff/wallet/audit'
        });
    }

    return (
        <StackedLayout
            navbar={
                <Navbar>
                    <NavbarSection>
                        <NavbarItem>
                            <NavbarLabel>Wallet Management Dashboard</NavbarLabel>
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
            <div className="p-6 space-y-6">
                {/* Page Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Wallet Management</h1>
                        <p className="text-gray-600 mt-1">Manage customer wallet balances and credit slips</p>
                    </div>
                    <div className="flex space-x-3">
                        <Button color="gray" outline onClick={loadWalletStats}>
                            <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                            Refresh Data
                        </Button>
                        <Button color="blue" href="/staff/wallet/search">
                            <UsersIcon className="h-4 w-4 mr-1.5" />
                            Search Customer
                        </Button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <ErrorDisplay 
                        error={error} 
                        onRetry={loadWalletStats}
                        className="mb-6"
                    />
                )}

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Wallet Balance</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                    {walletStats.loading ? (
                                        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                                    ) : (
                                        formatTZS(walletStats.totalBalance)
                                    )}
                                </h3>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <WalletIcon className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-3 text-sm text-blue-600">
                            <span className="font-medium">Total balance across all customers</span>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Customers With Balance</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                    {walletStats.loading ? (
                                        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                    ) : (
                                        walletStats.customersWithBalance
                                    )}
                                </h3>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                <UsersIcon className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-3 text-sm text-green-600">
                            <span className="font-medium">Customers with positive wallet balance</span>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Open Credit Slips</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                    {walletStats.loading ? (
                                        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                    ) : (
                                        walletStats.openCreditSlips
                                    )}
                                </h3>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-3 text-sm text-purple-600">
                            <span className="font-medium">Pending credit slips requiring payment</span>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Recent Transactions</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                    {walletStats.loading ? (
                                        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                    ) : (
                                        walletStats.recentTransactions
                                    )}
                                </h3>
                            </div>
                            <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                                <PresentationChartLineIcon className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                        <div className="mt-3 text-sm text-amber-600">
                            <span className="font-medium">Transactions in last 7 days</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
                        {walletActions.map((action) => (
                            <a 
                                key={action.title}
                                href={action.href}
                                className="flex flex-col items-center p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 shadow-sm hover:shadow transition-all duration-200"
                            >
                                <div className="mb-3 p-3 bg-blue-100 rounded-full">
                                    <action.icon className="h-6 w-6 text-blue-600" />
                                </div>
                                <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                                <p className="text-xs text-gray-600 text-center">{action.description}</p>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Data Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customers with balance */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                            <span>Customers with Balance</span>
                            <Button 
                                href="/staff/wallet/search" 
                                color="blue" 
                                size="sm"
                                outline
                            >
                                View All
                            </Button>
                        </h2>
                        <CustomersWithBalance limit={5} />
                    </div>
                    
                    {/* Recent Transactions */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                            <span>Recent Transactions</span>
                            <Button 
                                href="/staff/wallet/history" 
                                color="blue" 
                                size="sm"
                                outline
                            >
                                View All
                            </Button>
                        </h2>
                        <RecentTransactions limit={5} />
                    </div>
                </div>

                {/* Administrative Section for privileged users */}
                {hasAuditAccess && (
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Administrative Access</h3>
                                <p className="text-sm text-gray-600">Access audit trails and administrative functions</p>
                            </div>
                            <div className="flex gap-3">
                                <Button 
                                    outline 
                                    onClick={() => window.location.href = '/staff/wallet/audit'}
                                >
                                    <ShieldCheckIcon className="h-4 w-4 mr-1" />
                                    Audit Trail
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StackedLayout>
    );
}