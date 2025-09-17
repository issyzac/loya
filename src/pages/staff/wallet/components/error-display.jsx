import { ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/16/solid';
import { Button } from '../../../../components/button';

export default function ErrorDisplay({ error, onRetry, className = '' }) {
  if (!error) return null;

  // Get appropriate icon based on error type
  const getIcon = () => {
    switch (error.type) {
      case 'not-found':
        return <InformationCircleIcon className={`h-6 w-6 ${error.classes?.icon || 'text-blue-500'}`} />;
      case 'validation':
      case 'insufficient-funds':
        return <ExclamationTriangleIcon className={`h-6 w-6 ${error.classes?.icon || 'text-amber-500'}`} />;
      default:
        return <ExclamationCircleIcon className={`h-6 w-6 ${error.classes?.icon || 'text-red-500'}`} />;
    }
  };

  // Default classes based on error type if not provided
  const getDefaultClasses = () => {
    switch (error.type) {
      case 'not-found':
        return {
          container: 'bg-blue-50 border border-blue-200 shadow-sm',
          text: 'text-blue-700',
          icon: 'text-blue-500',
          button: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
        };
      case 'validation':
      case 'insufficient-funds':
        return {
          container: 'bg-amber-50 border border-amber-200 shadow-sm',
          text: 'text-amber-700',
          icon: 'text-amber-500',
          button: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
        };
      default:
        return {
          container: 'bg-red-50 border border-red-200 shadow-sm',
          text: 'text-red-700',
          icon: 'text-red-500',
          button: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
        };
    }
  };

  const classes = error.classes || getDefaultClasses();

  // Generate a helpful message based on error type
  const getHelpText = () => {
    switch (error.type) {
      case 'not-found':
        return "The requested resource couldn't be found. Check that the information is correct and try again.";
      case 'validation':
        return "Please check the information you've entered and correct any errors.";
      case 'insufficient-funds':
        return "There aren't enough funds available to complete this operation.";
      case 'auth':
        return "You don't have permission to perform this action or your session has expired.";
      case 'network':
        return "There was a problem connecting to the server. Check your internet connection and try again.";
      default:
        return "Something went wrong. Please try again or contact support if the problem persists.";
    }
  };

  return (
    <div className={`${classes.container} p-5 rounded-lg ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 p-2 rounded-full bg-white border border-gray-100 shadow-sm">
          {getIcon()}
        </div>
        <div className="ml-4 flex-1">
          <h3 className={`text-base font-medium ${classes.text}`}>
            {error.title || (error.type === 'network' ? 'Network Error' : 'Error')}
          </h3>
          <p className={`mt-1 text-sm ${classes.text} opacity-90`}>
            {error.message}
          </p>
          
          {!error.hideHelp && (
            <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border border-gray-100">
              <p className="text-sm text-gray-600">{error.helpText || getHelpText()}</p>
            </div>
          )}
          
          {error.canRetry && onRetry && (
            <div className="mt-4 flex">
              <Button 
                color="blue"
                size="sm"
                onClick={onRetry}
                className="flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoadingDisplay({ message = 'Loading...', subMessage = null, className = '' }) {
  return (
    <div className={`bg-blue-50 border border-blue-200 p-5 rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center">
        <div className="relative mr-4">
          <div className="w-10 h-10 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-blue-50"></div>
          </div>
        </div>
        <div>
          <p className="font-medium text-blue-800">{message}</p>
          {subMessage && <p className="text-sm text-blue-600 mt-1">{subMessage}</p>}
        </div>
      </div>
    </div>
  );
}

export function SuccessDisplay({ message, details = null, className = '', onDismiss = null }) {
  return (
    <div className={`bg-green-50 border border-green-200 p-5 rounded-lg shadow-sm ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <div className="p-2 bg-green-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-base font-medium text-green-800">Success</h3>
          <p className="mt-1 text-sm text-green-700">{message}</p>
          {details && (
            <div className="mt-3 p-3 bg-white bg-opacity-70 rounded border border-green-100">
              <p className="text-sm text-gray-600">{details}</p>
            </div>
          )}
          {onDismiss && (
            <div className="mt-4 flex justify-end">
              <button 
                type="button"
                onClick={onDismiss}
                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}