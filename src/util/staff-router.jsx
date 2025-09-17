import WalletDashboard from '../pages/staff/wallet/wallet-dashboard';
import CustomerSearch from '../pages/staff/wallet/customer-search';
import CreateCreditSlip from '../pages/staff/wallet/create-credit-slip';
import ProcessPayment from '../pages/staff/wallet/process-payment';
import StoreChange from '../pages/staff/wallet/store-change';
import ApplyWallet from '../pages/staff/wallet/apply-wallet';
import TransactionHistory from '../pages/staff/wallet/transaction-history';
import AuditTrail from '../pages/staff/wallet/audit-trail';
import WalletPlaceholder from '../pages/staff/wallet/components/wallet-placeholder';
import { useStaffUser } from '../providers/UserProvider';
import { Sidebar, SidebarBody, SidebarHeader, SidebarItem, SidebarLabel, SidebarSection } from '../components/sidebar';
import { Navbar, NavbarDivider, NavbarItem, NavbarLabel, NavbarSection, NavbarSpacer } from '../components/navbar';
import { StackedLayout } from '../components/stacked-layout';
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

function WalletLayout({ children, title }) {
  const staffUser = useStaffUser();

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

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <NavbarSection>
            <NavbarItem>
              <NavbarLabel>{title || 'Wallet Management'}</NavbarLabel>
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
      {children}
    </StackedLayout>
  );
}

export default function StaffRouter() {
  const currentPath = window.location.pathname;

  // Simple routing based on pathname
  if (currentPath === '/staff/dashboard' || currentPath === '/staff') {
    return <WalletDashboard />;
  } else if (currentPath === '/staff/wallet') {
    return <WalletDashboard />;
  } else if (currentPath === '/staff/wallet/search') {
    return <CustomerSearch />;
  } else if (currentPath === '/staff/wallet/create-credit') {
    return <CreateCreditSlip />;
  } else if (currentPath === '/staff/wallet/process-payment') {
    return <ProcessPayment />;
  } else if (currentPath === '/staff/wallet/store-change') {
    return <StoreChange />;
  } else if (currentPath === '/staff/wallet/apply-wallet') {
    return <ApplyWallet />;
  } else if (currentPath === '/staff/wallet/history') {
    return <TransactionHistory />;
  } else if (currentPath === '/staff/wallet/audit') {
    return <AuditTrail />;
  } else {
    // Default to wallet dashboard for any other staff routes
    return <WalletDashboard />;
  }
}