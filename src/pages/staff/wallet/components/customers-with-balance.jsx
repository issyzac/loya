import { useState, useEffect } from 'react';
import { Button } from '../../../../components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/table';
import { 
  UsersIcon, 
  EyeIcon, 
  WalletIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/16/solid';
import { formatTZS } from '../../../../utils/currency';
import { LoadingDisplay } from './error-display';
import walletService from '../../../../api/wallet-service';

export default function CustomersWithBalance({ limit = 5 }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCustomersWithBalance();
  }, [limit]);

  const loadCustomersWithBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await walletService.getCustomersWithBalance(limit);
      
      if (response.success && response.customers) {
        // Normalize the API response to match component expectations
        const normalizedCustomers = response.customers.map(customer => ({
          customer_id: customer.customer_id || customer.id,
          name: customer.name || customer.customer_name || 'Unknown Customer',
          phone_number: customer.phone_number || customer.phone || '',
          wallet_balance_cents: customer.wallet_balance_cents || customer.balance_cents || 0,
          outstanding_cents: customer.outstanding_cents || customer.credit_balance_cents || 0,
          last_transaction: customer.last_transaction || customer.last_transaction_date || new Date().toISOString()
        }));
        
        setCustomers(normalizedCustomers);
      } else {
        // Fallback to empty array if API fails
        setCustomers([]);
        console.warn('Failed to load customers with balance:', response.error?.message);
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('Failed to load customers with balance:', err);
      setError('Failed to load customers');
      setCustomers([]);
      setLoading(false);
    }
  };

  const handleViewCustomer = (customerId) => {
    window.location.href = `/staff/wallet/search?customer_id=${customerId}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Customers with Wallet Balance</h3>
        </div>
        <div className="p-6">
          <LoadingDisplay message="Loading customers..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Customers with Wallet Balance</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
            <span className="text-red-600">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Customers with Wallet Balance
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({customers.length} customers)
            </span>
          </h3>
          <Button 
            outline 
            href="/staff/wallet/search"
            size="sm"
          >
            <UsersIcon className="h-4 w-4 mr-1" />
            Search All
          </Button>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="p-12 text-center">
          <WalletIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Customers with Balance</h3>
          <p className="text-gray-600">No customers currently have wallet balance available.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Wallet Balance</TableHeader>
                <TableHeader>Outstanding</TableHeader>
                <TableHeader>Last Transaction</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.customer_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.customer_id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {customer.phone_number}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">
                      {formatTZS(customer.wallet_balance_cents)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {customer.outstanding_cents > 0 ? (
                      <span className="font-semibold text-red-600">
                        {formatTZS(customer.outstanding_cents)}
                      </span>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(customer.last_transaction)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      outline
                      onClick={() => handleViewCustomer(customer.customer_id)}
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}