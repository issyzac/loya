import { React } from 'react';
import { QuestionMarkCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { useCustomerOrder, useUpdateOrder, useUpdateProductToBuy } from '../providers/AppProvider';
import { useUser } from '../providers/UserProvider';

export default function OrderSummary() {

    const updateProductToBuy = useUpdateProductToBuy();

    const customerOrder = useCustomerOrder();
    const { removeCustomerOrder } = useUpdateOrder();

    const user = useUser();

    const cancelOrder = () => {
        updateProductToBuy(false);
    }

    const handlePay = () => {
        console.log(customerOrder);
    }

    const totalCost = customerOrder.reduce((total, item) => total + (item.grand_total || item.price || 0), 0);

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
                {customerOrder.map((item) => (
                    <div key={item.slip_id} className="flex items-center justify-between">
                        <dt className="text-sm text-gray-600"> {item.slip_number} </dt>
                        <dd className="text-sm font-medium text-gray-900"> L¥ {item.grand_total || item.price} </dd>
                        <button onClick={() => removeCustomerOrder(item.slip_id)}>
                            <XCircleIcon className="h-5 w-5 text-red-500" />
                        </button>
                    </div>
                ))}
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="flex items-center text-sm text-gray-600">
                  <span> Total Cost </span>
                </dt>
                <dd className="text-sm font-medium text-gray-900"> L¥ {totalCost} </dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Balance</dt>
                <dd className="text-base font-medium text-gray-900"> L¥ {user.total_points - totalCost} </dd>
              </div>
            </dl>

            

            <div className="mt-6">
              <button
                onClick={handlePay}
                className="w-full rounded-md border border-transparent bg-[#b58150] px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-[#b58150] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
              >
                Pay
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