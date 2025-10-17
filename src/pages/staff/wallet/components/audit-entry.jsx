import { 
  UserIcon, 
  ComputerDesktopIcon, 
  ClockIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/16/solid';
import { useState } from 'react';
import { formatTZS } from '../../../../utils/currency';
import { Button } from '../../../../components/button';

const OPERATION_TYPE_CONFIG = {
  CREDIT_SLIP_CREATED: {
    label: 'Credit Slip Created',
    color: 'orange',
    description: 'New credit slip was created'
  },
  PAYMENT_PROCESSED: {
    label: 'Payment Processed',
    color: 'green',
    description: 'Customer payment was processed'
  },
  CHANGE_STORED: {
    label: 'Change Stored',
    color: 'blue',
    description: 'Customer change was stored as wallet balance'
  },
  WALLET_APPLIED: {
    label: 'Wallet Applied',
    color: 'purple',
    description: 'Wallet balance was applied to credit slip'
  },
  BALANCE_ADJUSTMENT: {
    label: 'Balance Adjustment',
    color: 'yellow',
    description: 'Manual balance adjustment was made'
  }
};

export default function AuditEntry({ entry }) {
  const [expanded, setExpanded] = useState(false);

  if (!entry) return null;

  const config = OPERATION_TYPE_CONFIG[entry.operation_type] || {
    label: entry.operation_type,
    color: 'gray',
    description: 'Wallet operation performed'
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const timestamp = formatTimestamp(entry.timestamp);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Main Entry */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Left side - Operation info */}
          <div className="flex items-start space-x-3 flex-1">
            {/* Operation indicator */}
            <div className={`p-2 bg-${config.color}-100 rounded-lg flex-shrink-0`}>
              <div className={`w-3 h-3 bg-${config.color}-500 rounded-full`}></div>
            </div>

            {/* Operation details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-900">{config.label}</h4>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
                  {entry.operation_type}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">{config.description}</p>

              {/* Basic info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Customer:</span>
                  <span className="ml-1 text-gray-900">{entry.customer_id}</span>
                </div>
                
                {entry.amount_cents && (
                  <div>
                    <span className="font-medium text-gray-700">Amount:</span>
                    <span className="ml-1 text-gray-900 font-semibold">
                      {formatTZS(entry.amount_cents)}
                    </span>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700">Currency:</span>
                  <span className="ml-1 text-gray-900">{entry.currency}</span>
                </div>
              </div>

              {/* Staff and timestamp info */}
              <div className="flex items-center space-x-6 mt-3 text-xs text-gray-500">
                <div className="flex items-center">
                  <UserIcon className="h-3 w-3 mr-1" />
                  <span className="font-medium">{entry.user_id}</span>
                  <span className="ml-1 capitalize">({entry.user_role})</span>
                </div>
                
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  <span>{timestamp.date} at {timestamp.time}</span>
                </div>
                
                <div className="flex items-center">
                  <ComputerDesktopIcon className="h-3 w-3 mr-1" />
                  <span>{entry.request_info?.remote_addr || 'Unknown IP'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              size="sm"
              outline
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUpIcon className="h-3 w-3 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <EyeIcon className="h-3 w-3 mr-1" />
                  Details
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Operation Data */}
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-3">Operation Data</h5>
              <div className="bg-white rounded border p-3">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(entry.operation_data, null, 2)}
                </pre>
              </div>
            </div>

            {/* Request Information */}
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-3">Request Information</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Method:</span>
                  <span className="text-gray-900 font-mono">{entry.request_info?.method || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Endpoint:</span>
                  <span className="text-gray-900 font-mono text-xs">{entry.request_info?.endpoint || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">IP Address:</span>
                  <span className="text-gray-900 font-mono">{entry.request_info?.remote_addr || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">User Agent:</span>
                  <span className="text-gray-900 text-xs truncate max-w-xs" title={entry.request_info?.user_agent}>
                    {entry.request_info?.user_agent ? 
                      entry.request_info.user_agent.substring(0, 50) + '...' : 
                      'N/A'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Audit ID:</span>
                  <span className="text-gray-900 font-mono text-xs">{entry.audit_id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditEntrySkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-7 h-7 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="flex space-x-4">
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
        <div className="w-16 h-6 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}