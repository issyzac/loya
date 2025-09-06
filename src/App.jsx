import React from  'react'
import { Avatar } from './components/avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from './components/dropdown'
import { Navbar, NavbarDivider, NavbarItem, NavbarLabel, NavbarSection, NavbarSpacer } from './components/navbar'
import { Sidebar, SidebarBody, SidebarHeader, SidebarItem, SidebarLabel, SidebarSection } from './components/sidebar'
import { StackedLayout } from './components/stacked-layout'
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/16/solid'
import { InboxIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import HomeRouter from './util/home_router'
import { useUser } from './providers/UserProvider'

const navItems = [
  { label: 'Home', url: '/' },
  { label: 'Orders', url: '/orders' },
  { label: 'Points', url: '/points' }
]

function TeamDropdownMenu() {
  return (
    <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
      <DropdownItem href="/teams/1/settings">
        <Cog8ToothIcon />
        <DropdownLabel>Settings</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="/teams/2">
        <Avatar slot="icon" initials="WC" className="bg-purple-500 text-white" />
        <DropdownLabel>Workcation</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="/teams/create">
        <PlusIcon />
        <DropdownLabel>New team&hellip;</DropdownLabel>
      </DropdownItem>
    </DropdownMenu>
  )
}

function App() {
  const user = useUser();
  const isLoggedIn = user && user.loyverse_id;

  return (
    <StackedLayout
      navbar={null}
      sidebar={null}
    >
      <HomeRouter />
    </StackedLayout>
  )
}

export default App
