import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ClipboardDocumentListIcon,
  CreditCardIcon,
  BanknotesIcon,
  WalletIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/16/solid';
import { formatTZS, formatTransactionAmount } from '../../../../utils/currency';

const ENTRY_TYPE_CONFIG = {
  SALE_ON_CREDIT: {
    icon: ClipboardDocumentListIcon,
    label: 'Credit Slip',
    color: 'orange'
  },
  PAYMENT: {
    icon: CreditCardIcon,
    label: 'Payment',
    color: 'green'
  },
  DEPOSIT: {
    icon: BanknotesIcon,
    label: 'Deposit',
    color: 'blue'
  },
  CHANGE_TO_BALANCE: {
    icon: WalletIcon,
    label: 'Change Stored',
    color: 'purple'
  },
  BALANCE_CONSUMPTION: {
    icon: ArrowsRightLeftIcon,
    label: 'Wallet Applied',
    color: 'indigo'
  }
};

export default function TransactionItem({ transaction, showCustomer = false }) {
  if (!transaction) return null;

  const config = ENTRY_TYPE_CONFIG[transaction.entry_type] || {
    icon: ArrowsRightLeftIcon,
    label: transaction.entry_type,
    color: 'gray'
  };

  const amountDisplay = formatTransactionAmount(transaction.amount_cents, transaction.direction);
  const IconComponent = config.icon;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const occurredDate = formatDate(transaction.occurred_at);
  const createdDate = formatDate(transaction.created_at);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Left side - Icon and details */}
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`p-2 bg-${config.color}-100 rounded-lg flex-shrink-0`}>
            <IconComponent className={`h-5 w-5 text-${config.color}-600`} />
          </div>

          {/* Transaction details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900">{config.label}</h4>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                transaction.direction === 'CREDIT' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {transaction.direction === 'CREDIT' ? (
                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                )}
                {transaction.direction}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-2">{transaction.description}</p>

            {/* Source information */}
            {transaction.source && (
              <div className="text-xs text-gray-500 space-y-1">
                {transaction.source.type === 'slip' && (
                  <div>
                    <span className="font-medium">Slip:</span> {String(transaction.source.slip_number || '')}
                  </div>
                )}
                {transaction.source.type === 'payment' && (
                  <div>
                    <span className="font-medium">Payment ID:</span> {String(transaction.source.payment_id || '')}
                  </div>
                )}
                {transaction.source.store_id && (
                  <div>
                    <span className="font-medium">Store:</span> {String(transaction.source.store_id)}
                  </div>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
              <div>
                <span className="font-medium">Occurred:</span> {occurredDate.date} at {occurredDate.time}
              </div>
              {transaction.occurred_at !== transaction.created_at && (
                <div>
                  <span className="font-medium">Recorded:</span> {createdDate.date} at {createdDate.time}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Amount */}
        <div className="text-right flex-shrink-0">
          <div className={`text-lg font-bold ${amountDisplay.className}`}>
            {amountDisplay.displayAmount}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Entry ID: {String(transaction.entry_id).slice(-8)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TransactionItemSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="h-6 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}