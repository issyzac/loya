import {
  Button,
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'

import NavigationMenu from './elements/navigation-menu'
import AccountNavigationMenu from './elements/account-navigation-menu'
import CustomerProfile from './elements/customer-profile'
import LeaderBoard from './elements/leader-board'
import CustomerHome from './elements/customer-home'
import { Link } from 'react-router-dom'

import logo from './assets/e-nzi-01.png' 
import { Route, Routes } from 'react-router-dom'
import { UserProvider, UserContext, useUser, useUpdateUser } from './providers/UserProvider'
import { useContext, useEffect } from 'react'
import { useAppState, useCurrentPage, useUpdateCurrentPage } from './providers/AppProvider'

const user = {
  name: 'Tom Cook',
  email: 'tom@example.com',
  imageUrl:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
}

const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' },
]

export default function Home() {

  const user = useUser();
  const updateUser = useUpdateUser();

  const currentPage = useCurrentPage();
  const updateCurrentPage = useUpdateCurrentPage();

  return (
      <div className="min-h-full">
        <Popover as="header" className="bg-primary pb-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <div className="relative flex items-center justify-center py-5 lg:justify-between">
              {/* Logo */}
              <div className="absolute left-0 shrink-0 lg:static pl-2 pt-8">
                <a href="#">
                  <span className="sr-only">LOYA</span>
                  <img
                    alt="Your Company"
                    src={logo}
                    className="h-16 w-auto"
                  />
                </a>
              </div>

              {/* Right section on desktop */}
              <div className="hidden lg:ml-4 lg:flex lg:items-center lg:pr-0.5">
                <button
                  type="button"
                  className="relative shrink-0 rounded-full p-1 text-indigo-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="size-6" />
                </button>

                <AccountNavigationMenu />

              </div>

              {/* Search */}
              <div className="min-w-0 flex-1 px-12 hidden">
                <div className="mx-auto grid w-full max-w-xs grid-cols-1">
                  <input
                    name="search"
                    type="search"
                    placeholder="Search"
                    aria-label="Search"
                    className="peer col-start-1 row-start-1 block w-full rounded-md bg-white/20 py-1.5 pl-10 pr-3 text-base text-white outline-none placeholder:text-white focus:bg-white focus:text-gray-900 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white/40 focus:placeholder:text-gray-400 sm:text-sm/6"
                  />
                  <MagnifyingGlassIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-white peer-focus:text-gray-400"
                  />
                </div>
              </div>

              {/* Menu button */}
              <div className="absolute right-0 shrink-0 lg:hidden pr-2 pt-8">
                {/* Mobile menu button */}
                <PopoverButton className="group relative inline-flex items-center justify-center rounded-md bg-transparent p-2 text-indigo-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
                  <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
                </PopoverButton>
              </div>
            </div>
            <NavigationMenu />
          </div>

          <div className="lg:hidden">
            <PopoverBackdrop
              transition
              className="fixed inset-0 z-20 bg-black/25 duration-150 data-[closed]:opacity-0 data-[enter]:ease-out data-[leave]:ease-in"
            />

            <PopoverPanel
              focus
              transition
              className="absolute inset-x-0 top-0 z-30 mx-auto w-full max-w-3xl origin-top transform p-2 transition duration-150 data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:ease-out data-[leave]:ease-in"
            >
              <div className="divide-y divide-gray-200 rounded-lg bg-white shadow-lg ring-1 ring-black/5">
                <div className="pb-2 pt-3">
                  <div className="flex items-center justify-between px-4">
                    <div>
                      <img
                        alt="Your Company"
                        src={logo}
                        className="h-8 w-auto"
                      />
                    </div>
                    <div className="-mr-2">
                      <PopoverButton className="relative inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                        <span className="absolute -inset-0.5" />
                        <span className="sr-only">Close menu</span>
                        <XMarkIcon aria-hidden="true" className="size-6" />
                      </PopoverButton>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 px-2">
                    <Button onClick={() => {
                      updateCurrentPage("Home");
                    }} className='block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800' >
                        Home
                    </Button>
                    <Button onClick={() => {
                      updateCurrentPage("Profile");
                    }} className='block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800' >
                        Profile
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverPanel>
          </div>
        </Popover>
          <main className="-mt-24 pb-8 pt-8">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
              <h1 className="sr-only">Page title</h1>
              {/* Main 3 column grid */}
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
                
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                  <section aria-labelledby="section-2-title">
                    <h2 id="section-2-title" className="sr-only">
                      Section title
                    </h2>
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                      <div className="p-10">
                        <LeaderBoard />
                      </div>
                    </div>
                  </section>
                </div>
                
                {/* Left column */}
                <div className="grid grid-cols-1 gap-4 lg:col-span-2">
                  <section aria-labelledby="section-1-title">
                    <h2 id="section-1-title" className="sr-only">
                      Section title
                    </h2>
                    <div className="overflow-hidden rounded-lg bg-white shadow h-[40rem]">
                      <div className="p-10">
                        { currentPage === 'Home' ? <CustomerHome /> : <CustomerProfile /> }
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right column */}
                <div className="hidden lg:grid grid-cols-1 gap-4">
                  <section aria-labelledby="section-2-title">
                    <h2 id="section-2-title" className="sr-only">
                      Section title
                    </h2>
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                      <div className="p-10">
                        <LeaderBoard />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </main>
          <footer>
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
              <div className="border-t border-gray-200 py-8 text-center text-sm text-gray-500 sm:text-left">
                <span className="block sm:inline">&copy; 2025 Enzi Coffee Co.</span>{' '}
                <span className="block sm:inline">All rights reserved.</span>
              </div>
            </div>
        </footer>
      </div>
  )
}