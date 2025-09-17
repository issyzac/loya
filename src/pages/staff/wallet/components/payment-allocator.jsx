import { useState, useEffect } from 'react';
import { Button } from '../../../../components/button';
import { Input } from '../../../../components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/table';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  WalletIcon,
  ClipboardDocumentListIcon 
} from '@heroicons/react/16/solid';
import { formatTZS, validateTZSInput, subtractAmounts, addAmounts } from '../../../../utils/currency';

export default function PaymentAllocator({ 
  paymentAmountCents, 
  openSlips, 
  allocations, 
  onAllocationsChange 
}) {
  const [slipAllocations, setSlipAllocations] = useState({});
  const [walletAllocation, setWalletAllocation] = useState(0);
  const [errors, setErrors] = useState({});

  // Initialize allocations when props change
  useEffect(() => {
    if (allocations && allocations.length > 0) {
      const slipAllocs = {};
      let walletAlloc = 0;

      allocations.forEach(alloc => {
        if (alloc.type === 'slip') {
          slipAllocs[alloc.slip_id] = alloc.applied_cents;
        } else if (alloc.type === 'wallet') {
          walletAlloc = alloc.applied_cents;
        }
      });

      setSlipAllocations(slipAllocs);
      setWalletAllocation(walletAlloc);
    }
  }, [allocations]);

  // Calculate totals
  const totalSlipAllocations = Object.values(slipAllocations).reduce((sum, amount) => sum + (amount || 0), 0);
  const totalAllocated = addAmounts(totalSlipAllocations, walletAllocation);
  const remainingAmount = subtractAmounts(paymentAmountCents, totalAllocated);
  const isOverAllocated = remainingAmount < 0;

  // Update parent component when allocations change
  useEffect(() => {
    const allocationArray = [];

    // Add slip allocations
    Object.entries(slipAllocations).forEach(([slipId, amount]) => {
      if (amount > 0) {
        allocationArray.push({
          type: 'slip',
          slip_id: slipId,
          applied_cents: amount
        });
      }
    });

    // Add wallet allocation
    if (walletAllocation > 0) {
      allocationArray.push({
        type: 'wallet',
        applied_cents: walletAllocation
      });
    }

    onAllocationsChange(allocationArray);
  }, [slipAllocations, walletAllocation, onAllocationsChange]);

  const handleSlipAllocation = (slipId, inputValue) => {
    if (inputValue === '') {
      setSlipAllocations(prev => ({ ...prev, [slipId]: 0 }));
      setErrors(prev => ({ ...prev, [slipId]: null }));
      return;
    }

    const validation = validateTZSInput(inputValue);
    if (validation.isValid) {
      const slip = openSlips.find(s => s._id === slipId);
      const maxAmount = slip ? slip.totals?.remaining_cents || 0 : 0;
      
      if (validation.amount > maxAmount) {
        setErrors(prev => ({ 
          ...prev, 
          [slipId]: `Cannot exceed remaining amount of ${formatTZS(maxAmount)}` 
        }));
      } else {
        setSlipAllocations(prev => ({ ...prev, [slipId]: validation.amount }));
        setErrors(prev => ({ ...prev, [slipId]: null }));
      }
    } else {
      setErrors(prev => ({ ...prev, [slipId]: validation.error }));
    }
  };

  const handleWalletAllocation = (inputValue) => {
    if (inputValue === '') {
      setWalletAllocation(0);
      setErrors(prev => ({ ...prev, wallet: null }));
      return;
    }

    const validation = validateTZSInput(inputValue);
    if (validation.isValid) {
      setWalletAllocation(validation.amount);
      setErrors(prev => ({ ...prev, wallet: null }));
    } else {
      setErrors(prev => ({ ...prev, wallet: validation.error }));
    }
  };

  const autoAllocate = () => {
    let remainingPayment = paymentAmountCents;
    const newSlipAllocations = {};

    // First, allocate to open slips in order
    openSlips.forEach(slip => {
      if (remainingPayment <= 0) return;
      
      const slipRemaining = slip.totals?.remaining_cents || 0;
      const allocationAmount = Math.min(remainingPayment, slipRemaining);
      
      if (allocationAmount > 0) {
        newSlipAllocations[slip._id] = allocationAmount;
        remainingPayment = subtractAmounts(remainingPayment, allocationAmount);
      }
    });

    // Remaining amount goes to wallet
    setSlipAllocations(newSlipAllocations);
    setWalletAllocation(remainingPayment);
    setErrors({});
  };

  const clearAllocations = () => {
    setSlipAllocations({});
    setWalletAllocation(0);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-blue-600 font-medium">Payment Amount</p>
            <p className="text-xl font-bold text-blue-800">{formatTZS(paymentAmountCents)}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Total Allocated</p>
            <p className={`text-xl font-bold ${isOverAllocated ? 'text-red-600' : 'text-blue-800'}`}>
              {formatTZS(totalAllocated)}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Remaining</p>
            <p className={`text-xl font-bold ${
              isOverAllocated ? 'text-red-600' : remainingAmount === 0 ? 'text-green-600' : 'text-blue-800'
            }`}>
              {formatTZS(Math.abs(remainingAmount))}
              {isOverAllocated && ' (Over)'}
            </p>
          </div>
        </div>
        
        {isOverAllocated && (
          <div className="mt-3 flex items-center justify-center text-red-600">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Total allocation exceeds payment amount</span>
          </div>
        )}
      </div>

      {/* Auto Allocation Buttons */}
      <div className="flex gap-3 justify-center">
        <Button outline onClick={autoAllocate}>
          Auto Allocate
        </Button>
        <Button outline onClick={clearAllocations}>
          Clear All
        </Button>
      </div>

      {/* Credit Slips Allocation */}
      {openSlips.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 text-gray-600 mr-2" />
              <h4 className="font-medium text-gray-900">Allocate to Credit Slips</h4>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Slip Number</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Remaining Amount</TableHeader>
                  <TableHeader>Allocation</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {openSlips.map((slip) => {
                  const slipId = slip._id;
                  const remainingAmount = slip.totals?.remaining_cents || 0;
                  const currentAllocation = slipAllocations[slipId] || 0;
                  
                  return (
                    <TableRow key={slipId}>
                      <TableCell className="font-mono text-sm">
                        {slip.slip_number}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          slip.status === 'OPEN' 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {slip.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatTZS(remainingAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <Input
                            type="text"
                            placeholder="0"
                            value={currentAllocation > 0 ? formatTZS(currentAllocation, false) : ''}
                            onChange={(e) => handleSlipAllocation(slipId, e.target.value)}
                            className="text-right"
                          />
                          {errors[slipId] && (
                            <p className="mt-1 text-xs text-red-600">{errors[slipId]}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          outline
                          onClick={() => handleSlipAllocation(slipId, formatTZS(remainingAmount, false))}
                        >
                          Pay Full
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Wallet Allocation */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <WalletIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h4 className="font-medium text-gray-900">Allocate to Wallet Balance</h4>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter amount to add to wallet..."
                value={walletAllocation > 0 ? formatTZS(walletAllocation, false) : ''}
                onChange={(e) => handleWalletAllocation(e.target.value)}
              />
              {errors.wallet && (
                <p className="mt-1 text-sm text-red-600">{errors.wallet}</p>
              )}
            </div>
            <Button
              outline
              onClick={() => handleWalletAllocation(formatTZS(remainingAmount, false))}
              disabled={remainingAmount <= 0}
            >
              Add Remaining
            </Button>
          </div>
          
          {walletAllocation > 0 && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-sm text-green-800">
                  {formatTZS(walletAllocation)} will be added to customer's wallet balance
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Allocation Summary */}
      {totalAllocated > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Allocation Summary</h4>
          <div className="space-y-2 text-sm">
            {Object.entries(slipAllocations).map(([slipId, amount]) => {
              if (amount <= 0) return null;
              const slip = openSlips.find(s => s._id === slipId);
              return (
                <div key={slipId} className="flex justify-between">
                  <span className="text-gray-600">
                    Credit Slip {slip?.slip_number}:
                  </span>
                  <span className="font-medium">{formatTZS(amount)}</span>
                </div>
              );
            })}
            
            {walletAllocation > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Wallet Balance:</span>
                <span className="font-medium">{formatTZS(walletAllocation)}</span>
              </div>
            )}
            
            <hr className="border-gray-300" />
            <div className="flex justify-between font-semibold">
              <span>Total Allocated:</span>
              <span className={isOverAllocated ? 'text-red-600' : 'text-gray-900'}>
                {formatTZS(totalAllocated)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}