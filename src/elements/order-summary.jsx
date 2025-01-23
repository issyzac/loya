import { React } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { useCustomerOrder, useUpdateProductToBuy } from '../providers/AppProvider';
import { useUser } from '../providers/UserProvider';

export default function OrderSummary() {

    const updateProductToBuy = useUpdateProductToBuy();

    const customerOrder = useCustomerOrder();

    const user = useUser();

    const cancelOrder = () => {
        updateProductToBuy(false);
    }

    return (
        <div className="shadow mt-4">
            <section
            aria-labelledby="summary-heading"
            className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
          >
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
              Order summary
            </h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600"> Available Loya Credit </dt>
                <dd className="text-sm font-medium text-gray-900"> L¥ {user.total_points}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="flex items-center text-sm text-gray-600">
                  <span> Item Cost </span>
                  <a href="#" className="ml-2 shrink-0 text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Learn more about how shipping is calculated</span>
                    <QuestionMarkCircleIcon aria-hidden="true" className="size-5" />
                  </a>
                </dt>
                <dd className="text-sm font-medium text-gray-900"> L¥ {customerOrder.price} </dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="flex text-sm text-gray-600">
                </dt>
                <dd className="text-sm font-medium text-gray-900">  </dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Balance</dt>
                <dd className="text-base font-medium text-gray-900"> L¥ {user.total_points - customerOrder.price} </dd>
              </div>
            </dl>

            

            <div className="mt-6">
              <button
                className="w-full rounded-md border border-transparent bg-[#b58150] px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-[#b58150] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
              >
                Checkout
              </button>

              <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                    <p>
                      or{' '}
                      <button
                        type="button"
                        onClick={ () => {
                            cancelOrder();
                        }}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Cancel
                        <span aria-hidden="true"> &rarr;</span>
                      </button>
                    </p>
                  </div>

            </div>
          </section>
        </div>
    )
} 