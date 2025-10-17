import { useState } from 'react';
import { Button } from '../../../../components/button';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/16/solid';

const DIALOG_TYPES = {
  warning: {
    icon: ExclamationTriangleIcon,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    confirmColor: 'yellow'
  },
  danger: {
    icon: XCircleIcon,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    confirmColor: 'red'
  },
  info: {
    icon: InformationCircleIcon,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    confirmColor: 'blue'
  },
  success: {
    icon: CheckCircleIcon,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    confirmColor: 'green'
  }
};

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  showCancel = true
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const config = DIALOG_TYPES[type] || DIALOG_TYPES.warning;
  const IconComponent = config.icon;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`p-2 ${config.bgColor} ${config.borderColor} border rounded-lg mr-3`}>
              <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {!loading && !isConfirming && (
            <Button
              size="sm"
              outline
              onClick={onClose}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">{message}</p>
          
          {details && (
            <div className={`p-4 ${config.bgColor} ${config.borderColor} border rounded-lg mb-4`}>
              <div className="text-sm">
                {Array.isArray(details) ? (
                  <ul className="space-y-1">
                    {details.map((detail, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{details}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          {showCancel && (
            <Button
              outline
              onClick={onClose}
              disabled={loading || isConfirming}
            >
              {cancelText}
            </Button>
          )}
          <Button
            color={config.confirmColor}
            onClick={handleConfirm}
            disabled={loading || isConfirming}
          >
            {isConfirming ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Specific confirmation dialogs for common wallet operations
export function PaymentConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  paymentAmount, 
  customer, 
  allocations,
  loading 
}) {
  const details = [
    `Customer: ${customer?.name}`,
    `Payment Amount: ${paymentAmount}`,
    ...(allocations?.map(alloc => 
      alloc.type === 'slip' 
        ? `Credit Slip: ${alloc.applied_cents}` 
        : `Wallet: ${alloc.applied_cents}`
    ) || [])
  ];

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirm Payment"
      message="Are you sure you want to process this payment?"
      details={details}
      type="info"
      confirmText="Process Payment"
      loading={loading}
    />
  );
}

export function CreditSlipConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  customer, 
  items, 
  total,
  loading 
}) {
  const details = [
    `Customer: ${customer?.name}`,
    `Items: ${items?.length} item${items?.length !== 1 ? 's' : ''}`,
    `Total Amount: ${total}`
  ];

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Create Credit Slip"
      message="Are you sure you want to create this credit slip?"
      details={details}
      type="warning"
      confirmText="Create Credit Slip"
      loading={loading}
    />
  );
}

export function WalletApplicationConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  customer, 
  amount, 
  slipNumber,
  loading 
}) {
  const details = [
    `Customer: ${customer?.name}`,
    `Amount to Apply: ${amount}`,
    `Credit Slip: ${slipNumber}`
  ];

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Apply Wallet Balance"
      message="Are you sure you want to apply wallet balance to this credit slip?"
      details={details}
      type="info"
      confirmText="Apply Wallet"
      loading={loading}
    />
  );
}

export function DeleteConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName,
  loading 
}) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirm Deletion"
      message={`Are you sure you want to delete ${itemName}? This action cannot be undone.`}
      type="danger"
      confirmText="Delete"
      loading={loading}
    />
  );
}