import React, { useEffect, useState } from 'react';
import { Button } from '@headlessui/react';

import { useUpdateOrder, useUpdateCurrentPage } from '../providers/AppProvider';

const products = [
    {
        id: 1,
        name: 'Cold Brew Bottle',
        href: '#',
        price: '200',
        description: "A sleek and durable glass bottle perfect for cold brew coffee. The airtight seal keeps your brew fresh for days, while the wide mouth makes it easy to add ice and clean. Ideal for making and storing your favorite cold brew concentrate.",
        imageSrc: 'https://hightidecoffee.com/cdn/shop/files/16_oz_Cold_Brew_Bottle.jpg?v=1716668888',
        imageAlt: 'Tall slender porcelain bottle with natural clay textured body and cork stopper.',
    },
    {
        id: 2,
        name: 'Aeropress',
        href: '#',
        price: '3000',
        description: "The innovative coffee press that's become a cult favorite among coffee enthusiasts. Makes smooth, rich coffee in minutes using a unique pressure-brewing process. Compact, durable and perfect for home or travel.",
        imageSrc: 'https://firebasestorage.googleapis.com/v0/b/enzi-website.appspot.com/o/aropress-2.jpg?alt=media&token=4a212d60-848e-442b-a4cc-4eaf51e5ada3',
        imageAlt: 'Olive drab green insulated bottle with flared screw lid and flat top.',
    },
    {
        id: 3,
        name: 'Focus Paper Refill',
        href: '#',
        price: '3500',
        description: "High-quality paper refills for your productivity needs. Each pack contains 50 sheets of premium, smooth paper perfect for writing, planning, and staying organized throughout your day.",
        imageSrc: 'https://www.hario-usa.com/cdn/shop/files/vcf-02-40w.jpg?v=1716668888',
        imageAlt: 'Person using a pen to cross a task off a productivity paper card.',
    }
  ]
  
  export default function Shop() {

    const updateCustomerOrder = useUpdateOrder();

    const updateCurrentPage = useUpdateCurrentPage();

    const productSelected = (product) => {
        updateCustomerOrder(product)
    }

    return (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          
          <h2 className="sr-only">Products</h2>
  
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 xl:gap-x-6">
            {products.map((product) => (
              <Button key={product.id} href={product.href} className="group"
                onClick={() => {
                  updateCurrentPage("Product");
                  productSelected(product)
                }}>
                <img
                  alt={product.imageAlt}
                  src={product.imageSrc}
                  className="aspect-square w-full rounded-lg bg-gray-200 object-cover group-hover:opacity-75 xl:aspect-[7/8]"
                />
                <h3 className="mt-4 text-sm text-gray-700">{product.name}</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">{product.price}</p>
              </Button>
            ))}
          </div>
        </div>
      </div>
    )
  }