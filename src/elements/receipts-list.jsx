import React from 'react';
import { useCustomerReceipts } from '../providers/UserProvider';
import moment from 'moment';



const people = [
    { name: 'Lindsay Walton', title: 'Front-end Developer', email: 'lindsay.walton@example.com', role: 'Member' },
    // More people...
  ]
  
  export default function ReceiptsList() {

    const receiptData = useCustomerReceipts();

    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold text-gray-900">Receipts</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of your enzi visits
            </p>
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      Item Bought
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {receiptData.map((receipt) => (
                    <tr key={receipt._id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        {receipt.line_items[0].item_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"> { moment(receipt.receipt_date).format('MMMM Do YYYY')} </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"> {receipt.total_money} </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }