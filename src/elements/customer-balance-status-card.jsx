import { formatTZS } from '../utils/currency';
import { Button } from '../components/button';

/**
 * Determines the appropriate color scheme based on wallet balance and outstanding amounts
 * @param {number} walletCents - Available wallet credit in cents
 * @param {number} outstandingCents - Outstanding credit slip amount in cents
 * @returns {object} Color scheme configuration
 */
const getBalanceCardStyle = (walletCents, outstandingCents) => {
  const netBalance = walletCents - outstandingCents;

  if (outstandingCents > 0 && netBalance <= 0) {
    // Customer owes money - yellowish hue
    return {
      background: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      accent: 'text-yellow-600',
      icon: '<i class="fa-regular fa-exclamation-triangle text-yellow-600"></i>',
      statusText: 'Amount Owed'
    };
  } else if (walletCents > 0 && netBalance > 0) {
    // Customer has available credit - green hue
    return {
      background: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      accent: 'text-green-600',
      icon: '<i class="fa-regular fa-wallet text-green-600"></i>',
      statusText: 'Available Credit'
    };
  } else {
    // Neutral state - gray hue
    return {
      background: 'bg-gray-50 border-gray-200',
      text: 'text-gray-800',
      accent: 'text-gray-600',
      icon: '<i class="fa-regular fa-credit-card text-gray-600"></i>',
      statusText: 'Wallet Balance'
    };
  }
};

/**
 * Customer Balance Status Card Component
 * Displays wallet balance information with color-coded visual indicators
 * 
 * @param {object} props - Component props
 * @param {number} props.walletCents - Available wallet credit in cents
 * @param {number} props.outstandingCents - Outstanding credit slip amount in cents
 * @param {number} [props.openSlipsCount=0] - Number of open credit slips
 * @param {function} [props.onViewDetails] - Callback for viewing detailed balance information
 * @param {function} [props.onPayBills] - Callback for navigating to pay bills
 * @param {boolean} [props.loading=false] - Loading state
 * @param {string} [props.className] - Additional CSS classes
 */
export default function CustomerBalanceStatusCard({
  walletCents = 0,
  outstandingCents = 0,
  openSlipsCount = 0,
  onViewDetails,
  onPayBills,
  loading = false,
  className = ''
}) {
  // Calculate net balance
  const netBalance = walletCents - outstandingCents;

  // Get appropriate styling based on balance status
  const style = getBalanceCardStyle(walletCents, outstandingCents);

  // Format currency amounts
  const formattedWalletAmount = formatTZS(walletCents);
  const formattedOutstandingAmount = formatTZS(outstandingCents);
  const formattedNetBalance = formatTZS(Math.abs(netBalance));

  if (loading) {
    return (
      <div className={`rounded-lg border-2 border-dashed border-gray-300 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="flex space-x-2 mt-4">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-1 border-opacity-100 ${style.background} ${className}`}>
      <div className="p-6">
        {/* Header with icon and title */}
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl" role="img" aria-label="wallet status">
            <span dangerouslySetInnerHTML={{ __html: style.icon }}></span>
          </span>
          <h3 className={`roboto-serif-heading text-lg font-semibold ${style.text}`}>
            Your Wallet Balance
          </h3>
        </div>

        {/* Net Balance Display */}
        <div className="mb-4">
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-bold ${style.text}`}>
              {netBalance < 0 ? '-' : ''}{formattedNetBalance}
            </span>
            <span className={`text-sm font-medium ${style.accent}`}>
              Net Balance
            </span>
          </div>

          {/* Status indicator */}
          <div className={`text-sm font-medium mt-1 ${style.accent}`}>
            {netBalance > 0 && 'You have available credit'}
            {netBalance < 0 && 'You have outstanding bills'}
            {netBalance === 0 && 'Your account is balanced'}
          </div>
        </div>

        {/* Balance Breakdown */}
        <div className="border-t border-current border-opacity-20 border-gray-400 pt-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Available Credit */}
            <div>
              <div className={`text-sm font-medium ${style.accent} mb-1`}>
                Available Credit
              </div>
              <div className={`text-xl font-semibold ${style.text}`}>
                {formattedWalletAmount}
              </div>
            </div>

            {/* Amount Owed */}
            <div>
              <div className={`text-sm font-medium ${style.accent} mb-1`}>
                Amount Owed
              </div>
              <div className={`text-xl font-semibold ${style.text}`}>
                {formattedOutstandingAmount}
              </div>
              {openSlipsCount > 0 && (
                <div className={`text-xs ${style.accent} mt-1`}>
                  {openSlipsCount} pending {openSlipsCount === 1 ? 'bill' : 'bills'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {onViewDetails && (
            <Button
              onClick={onViewDetails}
              outline
              className="flex-1 text-sm"
            >
              View Details
            </Button>
          )}

          {onPayBills && outstandingCents > 0 && (
            <Button
              onClick={onPayBills}
              color={netBalance < 0 ? 'amber' : 'green'}
              className="flex-1 text-sm"
            >
              {openSlipsCount > 0 ? `Pay ${openSlipsCount} Bill${openSlipsCount === 1 ? '' : 's'}` : 'Pay Bills'}
            </Button>
          )}
        </div>

        {/* Additional Information */}
        {(walletCents === 0 && outstandingCents === 0) && (
          <div className="mt-4 p-3 bg-white bg-opacity-50 rounded border border-current border-opacity-20">
            <p className={`text-sm ${style.text}`}>
              Your wallet is empty. Add credit or make purchases to see your balance here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}