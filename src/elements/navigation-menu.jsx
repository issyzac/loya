import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUser
} from '@fortawesome/free-regular-svg-icons'
import {
  faHouse, 
  faWallet, 
  faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons'

import { Link } from 'react-router-dom'
import { useUpdateUser } from '../providers/UserProvider'
import { useCurrentPage, useUpdateCurrentPage } from '../providers/AppProvider'
import { Button } from '@headlessui/react'

const navigation = [
    { name: 'Home', href: '/home', current: true, icon: faHouse }, 
    // { name: 'Shop', href: '/shop', current: false, icon: '🛍️' },
    { name: 'Wallet', href: '/wallet', current: false, icon: faWallet },
    { name: 'Profile', href: '/profile', current: false, icon: faUser }
  ]

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

export default function NavigationMenu (){

  const setUser = useUpdateUser();
  const currentPage = useCurrentPage();
  const updateCurrentPage = useUpdateCurrentPage();

    return(
        <div className="hidden border-t border-primary-200/30 py-6 lg:block">
            <div className="grid grid-cols-3 items-center gap-8">
              <div className="col-span-2">
                <nav className="flex space-x-2">
                  {navigation.map((item) => (
                    <Button
                      key={item.name}
                      onClick={() => {
                        updateCurrentPage(item.name.replace(/ /g, ''));
                      }}
                      className={classNames(
                        item.name === currentPage
                          ? 'bg-white/20 text-white shadow-lg ring-2 ring-white/30'
                          : 'text-primary-100 hover:bg-white/10 hover:text-white',
                        'group relative flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50'
                      )} >
                      <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                      <span>{item.name === "Shop" ? "Exclusive Shop" : item.name}</span>
                      {item.name === currentPage && (
                        <div className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-white/80"></div>
                      )}
                    </Button>
                  ))}
                </nav>
              </div>
              <div className="mx-auto grid w-full max-w-md grid-cols-1">
                <div className="relative">
                  <input
                    name="search"
                    type="search"
                    placeholder="Search products, receipts..."
                    aria-label="Search"
                    className="peer col-start-1 row-start-1 block w-full rounded-xl bg-white/15 backdrop-blur-sm py-3 pl-12 pr-4 text-sm text-white outline-none placeholder:text-primary-200 border border-white/20 focus:bg-white focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                  />
                  <FontAwesomeIcon 
                    icon={faMagnifyingGlass} 
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-200 peer-focus:text-gray-400 transition-colors duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
    )
}