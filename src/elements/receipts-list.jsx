import React, { useState } from 'react';
import { useCustomerReceipts } from '../providers/UserProvider';
import moment from 'moment';
import { ShoppingBagIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function ReceiptsList() {
  const receiptData = useCustomerReceipts();
  const [showAll, setShowAll] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Sort receipts by date (most recent first)
  const sortedReceipts = [...receiptData].sort((a, b) => {
    const dateA = new Date(a.receipt_date);
    const dateB = new Date(b.receipt_date);
    return dateB - dateA;  
  });

  const displayedReceipts = showAll ? sortedReceipts : sortedReceipts.slice(0, 5);
  const hasMoreReceipts = sortedReceipts.length > 5;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBagIcon className="h-5 w-5 text-primary-600" />
            Recent Orders
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Your latest Enzi visits and purchases
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-lg font-bold text-primary-600">{sortedReceipts.length}</p>
        </div>
      </div>

      {sortedReceipts.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingBagIcon className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
          <p className="mt-1 text-sm text-gray-500">Your purchase history will appear here</p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-soft rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedReceipts.map((receipt, index) => (
                    <tr key={receipt._id || index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <ShoppingBagIcon className="h-4 w-4 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {receipt.line_items[0]?.item_name || 'Purchase'}
                            </div>
                            <div className="text-xs text-gray-500">
                              #{receipt.receipt_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {moment(receipt.receipt_date).format('MMM D, YYYY')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {moment(receipt.receipt_date).format('h:mm A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(receipt.total_money)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {receipt.points_earned > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                            +{receipt.points_earned}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {hasMoreReceipts && (
            <div className="text-center pt-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {showAll ? (
                  <>
                    <ChevronUpIcon className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="h-4 w-4" />
                    View All Orders ({sortedReceipts.length - 5} more)
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}