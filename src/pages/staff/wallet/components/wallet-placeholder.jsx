import { Button } from '../../../../components/button';
import { ArrowLeftIcon } from '@heroicons/react/16/solid';

export default function WalletPlaceholder({ title, description }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Button 
          outline 
          onClick={() => window.location.href = '/staff/wallet'}
          className="mb-4"
        >
          <ArrowLeftIcon />
          Back to Wallet
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            This feature is currently being implemented. Please check back soon.
          </p>
          <Button onClick={() => window.location.href = '/staff/wallet'}>
            Return to Wallet Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}