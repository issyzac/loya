import React, { useState, useMemo } from 'react';
import { useCustomerReceipts } from '../providers/UserProvider';
import moment from 'moment';
import { ShoppingBagIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import useMediaQuery from '../util/useMediaQuery';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ReceiptsList() {
  const receiptData = useCustomerReceipts();
  const [showAll, setShowAll] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const sortedReceipts = useMemo(() => {
    return [...receiptData].sort((a, b) => {
      const dateA = new Date(a.receipt_date);
      const dateB = new Date(b.receipt_date);
      return dateB - dateA;
    });
  }, [receiptData]);

  const displayedReceipts = useMemo(() => {
    return showAll ? sortedReceipts : sortedReceipts.slice(0, 5);
  }, [showAll, sortedReceipts]);
  const hasMoreReceipts = sortedReceipts.length > 5;

  if (isMobile) {
    return (
      <div className="space-y-2">
        {displayedReceipts.map((receipt) => (
          <div key={receipt._id} className="bg-white shadow-soft rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 flex justify-between items-center cursor-pointer" onClick={() => handleRowClick(receipt._id)}>
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
              <div className="flex items-center">
                {receipt.points_earned > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                    +{receipt.points_earned}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 ml-2 transform transition-transform ${expandedRow === receipt._id ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {expandedRow === receipt._id && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="text-gray-900 font-medium">{moment(receipt.receipt_date).format('MMM D, YYYY')}</p>
                    <p className="text-gray-500 text-xs">{moment(receipt.receipt_date).format('h:mm A')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="text-gray-900 font-medium">{formatCurrency(receipt.total_money)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
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
      </div>
    )
  }

  return (
    <div className="space-y-4">
      

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