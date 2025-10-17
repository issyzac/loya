import { useState } from 'react';
import { Button } from '../../../../components/button';
import { 
  XMarkIcon, 
  WalletIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon 
} from '@heroicons/react/16/solid';
import { formatTZS, subtractAmounts } from '../../../../utils/currency';
import walletService from '../../../../api/wallet-service';
import { createErrorDisplay, createSuccessDisplay } from '../../../../utils/error-handler';
import ErrorDisplay, { LoadingDisplay } from './error-display';

export default function ApplyWalletModal({ 
  isOpen, 
  onClose, 
  customer, 
  customerBalance, 
  creditSlip, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !customer || !customerBalance || !creditSlip) {
    return null;
  }

  const walletBalanceCents = customerBalance.wallet_cents || 0;
  const slipRemainingCents = creditSlip.totals?.remaining_cents || 0;
  const canApplyWallet = walletBalanceCents > 0 && slipRemainingCents > 0;
  const applicationAmount = Math.min(walletBalanceCents, slipRemainingCents);
  const willFullyPay = applicationAmount >= slipRemainingCents;
  const newWalletBalance = subtractAmounts(walletBalanceCents, applicationAmount);
  const newSlipRemaining = subtractAmounts(slipRemainingCents, applicationAmount);

  const handleApplyWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      const walletApplicationData = {
        customer_id: customer.customer_id,
        slip_id: creditSlip._id || creditSlip.slip_id,
        currency: 'TZS'
      };

      const response = await walletService.applyWalletToSlip(walletApplicationData);

      if (response.success) {
        const successMessage = `Applied ${formatTZS(response.applied_cents)} from wallet to credit slip`;
        
        // Call success callback to refresh parent data
        if (onSuccess) {
          onSuccess({
            appliedAmount: response.applied_cents,
            slipStatus: response.slip_status,
            remainingBalance: response.remaining_slip_balance,
            message: successMessage
          });
        }
        
        // Close modal
        onClose();
      } else {
        setError(createErrorDisplay(response));
      }
    } catch (err) {
      console.error('Apply wallet error:', err);
      setError(createErrorDisplay({ error: { message: 'Failed to apply wallet balance' } }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <WalletIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Apply Wallet Balance</h3>
          </div>
          <Button
            size="sm"
            outline
            onClick={onClose}
            disabled={loading}
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <ErrorDisplay 
              error={error} 
              onRetry={() => setError(null)}
            />
          )}

          {/* Loading State */}
          {loading && (
            <LoadingDisplay message="Applying wallet balance..." />
          )}

          {/* Customer Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Customer</h4>
            <p className="text-sm text-gray-700">{customer.name}</p>
            <p className="text-xs text-gray-500">{customer.phone_number}</p>
          </div>

          {/* Credit Slip Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <ClipboardDocumentListIcon className="h-4 w-4 text-gray-600 mr-2" />
              <h4 className="font-medium text-gray-900">Credit Slip</h4>
            </div>
            <p className="text-sm text-gray-700 font-mono">{creditSlip.slip_number}</p>
            <p className="text-xs text-gray-500">
              Status: <span className="capitalize">{creditSlip.status?.toLowerCase()}</span>
            </p>
          </div>

          {/* Balance Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-medium text-blue-800 uppercase tracking-wide">
                  Wallet Balance
                </p>
                <p className="text-lg font-bold text-blue-600">
                  {formatTZS(walletBalanceCents)}
                </p>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs font-medium text-orange-800 uppercase tracking-wide">
                  Slip Remaining
                </p>
                <p className="text-lg font-bold text-orange-600">
                  {formatTZS(slipRemainingCents)}
                </p>
              </div>
            </div>

            {/* Application Preview */}
            {canApplyWallet && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                  <h4 className="font-medium text-green-900">Application Preview</h4>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Amount to Apply:</span>
                    <span className="font-semibold text-green-900">
                      {formatTZS(applicationAmount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-green-700">New Wallet Balance:</span>
                    <span className="font-semibold text-green-900">
                      {formatTZS(newWalletBalance)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-green-700">Remaining on Slip:</span>
                    <span className="font-semibold text-green-900">
                      {formatTZS(newSlipRemaining)}
                    </span>
                  </div>
                  
                  {willFullyPay && (
                    <div className="mt-3 p-2 bg-green-100 rounded border border-green-300">
                      <p className="text-xs text-green-800 font-medium">
                        ✓ This will fully pay the credit slip
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {!canApplyWallet && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Cannot Apply Wallet</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      {walletBalanceCents <= 0 
                        ? 'Customer has no wallet balance available'
                        : 'Credit slip has no remaining balance'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            outline
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            color="green"
            onClick={handleApplyWallet}
            disabled={loading || !canApplyWallet}
          >
            {loading ? 'Applying...' : `Apply ${formatTZS(applicationAmount)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}