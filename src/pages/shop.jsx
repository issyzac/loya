import React, { useEffect, useState } from 'react';
import { Button } from '@headlessui/react';
import { ShoppingBagIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

import { useUpdateOrder, useUpdateCurrentPage } from '../providers/AppProvider';

const products = [
    {
        id: 1,
        name: 'Cold Brew Bottle',
        href: '#',
        price: '200',
        originalPrice: '250',
        rating: 4.8,
        reviews: 24,
        description: "A sleek and durable glass bottle perfect for cold brew coffee. The airtight seal keeps your brew fresh for days, while the wide mouth makes it easy to add ice and clean. Ideal for making and storing your favorite cold brew concentrate.",
        imageSrc: 'https://hightidecoffee.com/cdn/shop/files/16_oz_Cold_Brew_Bottle.jpg?v=1716668888',
        imageAlt: 'Tall slender porcelain bottle with natural clay textured body and cork stopper.',
        badge: 'Best Seller'
    },
    {
        id: 2,
        name: 'Aeropress',
        href: '#',
        price: '3000',
        originalPrice: '3500',
        rating: 4.9,
        reviews: 156,
        description: "The innovative coffee press that's become a cult favorite among coffee enthusiasts. Makes smooth, rich coffee in minutes using a unique pressure-brewing process. Compact, durable and perfect for home or travel.",
        imageSrc: 'https://firebasestorage.googleapis.com/v0/b/enzi-website.appspot.com/o/aropress-2.jpg?alt=media&token=4a212d60-848e-442b-a4cc-4eaf51e5ada3',
        imageAlt: 'Olive drab green insulated bottle with flared screw lid and flat top.',
        badge: 'Popular'
    },
    {
        id: 3,
        name: 'Focus Paper Refill',
        href: '#',
        price: '3500',
        originalPrice: '4000',
        rating: 4.7,
        reviews: 89,
        description: "High-quality paper refills for your productivity needs. Each pack contains 50 sheets of premium, smooth paper perfect for writing, planning, and staying organized throughout your day.",
        imageSrc: 'https://www.hario-usa.com/cdn/shop/files/vcf-02-40w.jpg?v=1716668888',
        imageAlt: 'Person using a pen to cross a task off a productivity paper card.',
        badge: 'New'
    }
  ]

  export default function Shop() {

    const updateCustomerOrder = useUpdateOrder();
    const updateCurrentPage = useUpdateCurrentPage();

    const productSelected = (product) => {
        updateCustomerOrder(product)
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    return (
      <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
              Exclusive Shop
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover premium coffee accessories and tools curated just for our valued customers
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-large transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                onClick={() => {
                  updateCurrentPage("Product");
                  productSelected(product)
                }}
              >
                <div className="relative">
                  <img
                    alt={product.imageAlt}
                    src={product.imageSrc}
                    className="aspect-square w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.badge && (
                    <div className="absolute top-4 left-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        product.badge === 'Best Seller' ? 'bg-accent-100 text-accent-800' :
                        product.badge === 'Popular' ? 'bg-secondary-100 text-secondary-800' :
                        'bg-primary-100 text-primary-800'
                      }`}>
                        {product.badge}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIconSolid
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-secondary-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    <Button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2">
                      <ShoppingBagIcon className="h-4 w-4" />
                      Select
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }