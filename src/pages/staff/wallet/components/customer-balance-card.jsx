import { formatTZS, formatBalanceDisplay } from '../../../../utils/currency';
import { WalletIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/16/solid';

export default function CustomerBalanceCard({ balance, customer }) {
  if (!balance || !customer) {
    return null;
  }

  const walletDisplay = formatBalanceDisplay(balance.wallet_cents);
  const outstandingDisplay = formatBalanceDisplay(balance.outstanding_cents);
  const hasOutstanding = balance.outstanding_cents > 0;
  const hasWalletBalance = balance.wallet_cents > 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Customer Info Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{customer.name}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2">
              {customer.phone_number && (
                <p className="text-sm text-gray-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {customer.phone_number}
                </p>
              )}
              {customer.email && (
                <p className="text-sm text-gray-600 flex items-center mt-1 sm:mt-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {customer.email}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200">
              <p className="text-xs text-gray-500">Customer ID</p>
              <p className="text-sm font-mono text-gray-700">{customer.loyverse_id?.substring(0, 8) || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Information */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Wallet Balance */}
          <div className="relative overflow-hidden text-center p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 shadow-sm hover:shadow transition-all duration-200">
            <div className="absolute top-0 right-0 w-16 h-16 -mt-6 -mr-6 bg-green-200 rounded-full opacity-50"></div>
            <div className="relative">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <WalletIcon className="h-7 w-7 text-green-600" />
                </div>
              </div>
              <p className="text-xs font-medium text-green-800 uppercase tracking-wider mb-1">
                Wallet Balance
              </p>
              <p className={`text-3xl font-bold ${walletDisplay.className}`}>
                {walletDisplay.amount}
              </p>
              {hasWalletBalance ? (
                <p className="text-xs text-green-600 mt-2 font-medium">Available for Purchases</p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">No credit available</p>
              )}
            </div>
          </div>

          {/* Outstanding Amount */}
          <div className={`relative overflow-hidden text-center p-5 rounded-lg border shadow-sm hover:shadow transition-all duration-200 ${
            hasOutstanding 
              ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <div className={`absolute top-0 right-0 w-16 h-16 -mt-6 -mr-6 rounded-full opacity-50 ${
              hasOutstanding ? 'bg-red-200' : 'bg-gray-200'
            }`}></div>
            <div className="relative">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  {hasOutstanding ? (
                    <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />
                  ) : (
                    <CheckCircleIcon className="h-7 w-7 text-gray-400" />
                  )}
                </div>
              </div>
              <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                hasOutstanding ? 'text-red-800' : 'text-gray-600'
              }`}>
                Outstanding
              </p>
              <p className={`text-3xl font-bold ${
                hasOutstanding ? 'text-red-600' : 'text-gray-500'
              }`}>
                {formatTZS(balance.outstanding_cents)}
              </p>
              {hasOutstanding ? (
                <p className="text-xs text-red-600 mt-2 font-medium">Amount Due</p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">No outstanding balance</p>
              )}
            </div>
          </div>

          {/* Open Credit Slips */}
          <div className="relative overflow-hidden text-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm hover:shadow transition-all duration-200">
            <div className="absolute top-0 right-0 w-16 h-16 -mt-6 -mr-6 bg-blue-200 rounded-full opacity-50"></div>
            <div className="relative">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <div className="h-7 w-7 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {balance.open_slips_count}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs font-medium text-blue-800 uppercase tracking-wider mb-1">
                Open Credit Slips
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {balance.open_slips_count}
              </p>
              <p className="text-xs text-blue-600 mt-2 font-medium">
                {balance.open_slips_count === 0 
                  ? 'No open credit slips' 
                  : balance.open_slips_count === 1 
                    ? '1 Credit Slip' 
                    : `${balance.open_slips_count} Credit Slips`}
              </p>
            </div>
          </div>
        </div>

        {/* Account Status & Visit Count */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center mb-3 sm:mb-0">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              balance.account_status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {balance.account_status}
            </span>
            <span className="ml-2 text-sm text-gray-600">Account Status</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {customer.total_visits > 0 && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Total Visits</p>
                  <p className="text-sm font-semibold text-gray-800">{customer.total_visits}</p>
                </div>
              </div>
            )}
            
            {customer.total_spent > 0 && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Total Spent</p>
                  <p className="text-sm font-semibold text-gray-800">{formatTZS(customer.total_spent)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Message */}
        <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 shadow-sm">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-gray-700 leading-relaxed">
              {hasWalletBalance && hasOutstanding ? (
                <>This customer has <span className="font-semibold text-green-600">{formatTZS(balance.wallet_cents)}</span> available credit and owes <span className="font-semibold text-red-600">{formatTZS(balance.outstanding_cents)}</span>. Consider settling the outstanding amount first.</>
              ) : hasWalletBalance ? (
                <>This customer has <span className="font-semibold text-green-600">{formatTZS(balance.wallet_cents)}</span> available credit which can be used for purchases.</>
              ) : hasOutstanding ? (
                <>This customer owes <span className="font-semibold text-red-600">{formatTZS(balance.outstanding_cents)}</span>. Payment should be collected.</>
              ) : (
                <>This customer's account is clear with no outstanding balance or available credit.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}