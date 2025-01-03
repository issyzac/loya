import React from 'react'
import  {
    Menu,
    MenuButton,
    MenuItem,
    MenuItems
} from '@headlessui/react'

const user = {
  name: 'Tom Cook',
  email: 'tom@example.com',
  imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
}

const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' },
]

export default function AccountNavigationMenu(){
    return(
        <>
        {/* Profile dropdown */}
        <Menu as="div" className="relative ml-4 shrink-0">
            <div>
                <MenuButton className="relative flex rounded-full bg-white text-sm ring-2 ring-white/20 focus:outline-none focus:ring-white">
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Open user menu</span>
                <img alt="" src={user.imageUrl} className="size-8 rounded-full" />
                </MenuButton>
            </div>
            <MenuItems
                transition
                className="absolute -right-2 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:data-[leave]:scale-95 data-[closed]:data-[leave]:transform data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-75 data-[leave]:ease-in">
                {userNavigation.map((item) => (
                <MenuItem key={item.name}>
                    <a
                    href={item.href}
                    className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                    >
                    {item.name}
                    </a>
                </MenuItem>
                ))}
            </MenuItems>
        </Menu>
        </>
    )
}