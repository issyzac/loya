'use client'

import { useState } from 'react'
import { CheckIcon, InformationCircleIcon, QuestionMarkCircleIcon, StarIcon } from '@heroicons/react/20/solid'
import { Button, Radio, RadioGroup } from '@headlessui/react'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useCustomerOrder, useProductToBuy, useUpdateCurrentPage, useUpdateProductToBuy } from '../providers/AppProvider'
import { useUser } from '../providers/UserProvider'
import { ExclamationCircleIcon } from '@heroicons/react/16/solid'

const reviews = { average: 4, totalCount: 1624 }

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function ProductDetails() {

  const updateCurrentPage = useUpdateCurrentPage();

  const customerOrder  = useCustomerOrder();

  const user = useUser();

  const product = customerOrder;

  const canBuy = user.total_points >= product.price;  

  const updateProductToBuy = useUpdateProductToBuy();

  const productToBuy = useProductToBuy();

  const UpdatePage = (currentPage) => {
    updateCurrentPage(currentPage);
  }

  const buyThisProduct = (buy) => {
    updateProductToBuy(buy);
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-8 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
        {/* Product details */}
        <div className="lg:max-w-lg lg:self-end">
          <nav aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-2">
              <Button className="font-medium text-gray-500 hover:text-gray-900" 
                onClick={() => {
                  UpdatePage("Shop");
                }}>
                Back
              </Button>
            </ol>
          </nav>

          <div className="mt-4">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{product.name}</h1>
          </div>

          <section aria-labelledby="information-heading" className="mt-4">
            <h2 id="information-heading" className="sr-only">
              Product information
            </h2>

            <div className="flex items-center">
              <p className="text-lg text-gray-900 sm:text-xl">{product.price}</p>

              <div className="ml-4 border-l border-gray-300 pl-4">
                <h2 className="sr-only">Reviews</h2>
              </div>
            </div>

            <div className="mt-4 space-y-6">
              <p className="text-base text-gray-500">{product.description}</p>
            </div>
          </section>
        </div>

        {/* Product image */}
        <div className="mt-10 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-center">
          <img alt={product.imageAlt} src={product.imageSrc} className="aspect-square w-full rounded-lg object-cover" />
        </div>

        {/* Product form */}
        <div className="mt-10 lg:col-start-1 lg:row-start-2 lg:max-w-lg lg:self-start">
          <section aria-labelledby="options-heading">
            <h2 id="options-heading" className="sr-only">
              Product options
            </h2>

            <form>
              <div className="mt-10">
                { productToBuy ? <></> : canBuy ? <BuyButton /> : <BuyButtonDisabled /> } 
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  )

  function BuyButton(){
    return (
      <button
        onClick={() => {
          buyThisProduct(true);
        }}
        className="flex w-full items-center justify-center rounded-md border border-transparent bg-[#b58150] px-8 py-3 text-base font-medium text-white hover:bg-[#b58150] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50">
          Buy Now
      </button>
    )
  }


  function BuyButtonDisabled(){
    return (
      <div>
        <div className="mt-10">
        <button
        disabled="true"
        type="disabled"
        className="flex w-full items-center justify-center rounded-md border border-transparent  bg-gray-300 px-8 py-3 text-base 
        font-medium text-white hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50">
        Buy Now
      </button>
              </div>
              <div className="mt-6 text-center">
                <p className="group inline-flex text-base font-medium">
                  <ExclamationCircleIcon
                    aria-hidden="true"
                    className="mr-2 size-6 shrink-0 text-gray-400"
                  />
                  <span className="text-gray-400"> Continue to collect points to buy this product </span>
                </p>
              </div>
      </div>
    )
  }

}