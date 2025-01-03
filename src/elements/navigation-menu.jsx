import React from 'react'

import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Link } from 'react-router-dom'
import { useUpdateUser } from '../providers/UserProvider'

const navigation = [
    { name: 'Home', href: '/home', current: true },
    { name: 'Profile', href: '/profile', current: false } 
  ]

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

export default function NavigationMenu (){

  const setUser = useUpdateUser();

    return(
        <div className="hidden border-t border-white/20 py-5 lg:block">
            <div className="grid grid-cols-3 items-center gap-8">
              <div className="col-span-2">
                <nav className="flex space-x-4">
                  {navigation.map((item) => (
                    <Link
                     to={item.href}
                     className={classNames(
                      item.current ? 'text-white' : 'text-indigo-100',
                      'rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10',
                    )} >
                        {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="mx-auto grid w-full max-w-md grid-cols-1">
                <input
                  name="search"
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                  className="peer col-start-1 row-start-1 block w-full rounded-md bg-white/20 py-1.5 pl-10 pr-3 text-sm/6 text-white outline-none placeholder:text-white focus:bg-white focus:text-gray-900 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white/40 focus:placeholder:text-gray-400"
                />
                <MagnifyingGlassIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-white peer-focus:text-gray-400"
                />
              </div>
            </div>
          </div>
    )
}