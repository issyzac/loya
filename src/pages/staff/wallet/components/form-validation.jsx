import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/16/solid';

// Enhanced Input component with validation
export function ValidatedInput({ 
  label, 
  error, 
  success, 
  required = false, 
  helpText,
  className = '',
  ...props 
}) {
  const hasError = !!error;
  const hasSuccess = !!success && !hasError;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          {...props}
          className={`
            w-full rounded-lg border px-3 py-2 text-sm transition-colors
            ${hasError 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : hasSuccess
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            focus:outline-none focus:ring-1
            disabled:bg-gray-50 disabled:text-gray-500
          `}
        />
        
        {/* Validation Icon */}
        {(hasError || hasSuccess) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {hasError ? (
              <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      {helpText && !error && !success && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center">
          <ExclamationCircleIcon className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}

      {/* Success Message */}
      {success && !error && (
        <p className="mt-1 text-xs text-green-600 flex items-center">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          {success}
        </p>
      )}
    </div>
  );
}

// Form validation utilities
export class FormValidator {
  constructor() {
    this.rules = {};
    this.errors = {};
  }

  // Add validation rule
  addRule(field, validator, message) {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    this.rules[field].push({ validator, message });
    return this;
  }

  // Required field validation
  required(field, message = 'This field is required') {
    return this.addRule(field, (value) => {
      return value !== null && value !== undefined && value.toString().trim() !== '';
    }, message);
  }

  // Minimum length validation
  minLength(field, min, message) {
    return this.addRule(field, (value) => {
      return !value || value.toString().length >= min;
    }, message || `Must be at least ${min} characters`);
  }

  // Maximum length validation
  maxLength(field, max, message) {
    return this.addRule(field, (value) => {
      return !value || value.toString().length <= max;
    }, message || `Must be no more than ${max} characters`);
  }

  // Email validation
  email(field, message = 'Please enter a valid email address') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.addRule(field, (value) => {
      return !value || emailRegex.test(value);
    }, message);
  }

  // Phone number validation
  phone(field, message = 'Please enter a valid phone number') {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return this.addRule(field, (value) => {
      return !value || (phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10);
    }, message);
  }

  // Positive number validation
  positiveNumber(field, message = 'Must be a positive number') {
    return this.addRule(field, (value) => {
      const num = parseFloat(value);
      return !value || (!isNaN(num) && num > 0);
    }, message);
  }

  // Custom validation
  custom(field, validator, message) {
    return this.addRule(field, validator, message);
  }

  // Validate all fields
  validate(data) {
    this.errors = {};
    let isValid = true;

    Object.keys(this.rules).forEach(field => {
      const fieldRules = this.rules[field];
      const value = data[field];

      for (const rule of fieldRules) {
        if (!rule.validator(value)) {
          this.errors[field] = rule.message;
          isValid = false;
          break; // Stop at first error for this field
        }
      }
    });

    return { isValid, errors: this.errors };
  }

  // Get error for specific field
  getError(field) {
    return this.errors[field];
  }

  // Check if field has error
  hasError(field) {
    return !!this.errors[field];
  }

  // Clear errors
  clearErrors() {
    this.errors = {};
  }

  // Clear error for specific field
  clearError(field) {
    delete this.errors[field];
  }
}

// Wallet-specific validators
export const walletValidators = {
  // TZS amount validation
  tzsAmount: (value) => {
    if (!value) return true;
    const cleanValue = value.toString().replace(/[^\d.]/g, '');
    const num = parseFloat(cleanValue);
    return !isNaN(num) && num > 0 && num <= 999999999;
  },

  // Customer ID validation
  customerId: (value) => {
    if (!value) return true;
    return value.toString().trim().length >= 3;
  },

  // Quantity validation
  quantity: (value) => {
    const num = parseInt(value);
    return !isNaN(num) && num > 0 && num <= 1000;
  }
};

// Pre-configured validators for wallet forms
export const createWalletValidator = () => {
  return new FormValidator();
};

export const createPaymentValidator = () => {
  return new FormValidator()
    .required('customer_id', 'Please select a customer')
    .required('amount', 'Please enter payment amount')
    .custom('amount', walletValidators.tzsAmount, 'Please enter a valid amount')
    .required('method', 'Please select payment method');
};

export const createCreditSlipValidator = () => {
  return new FormValidator()
    .required('customer_id', 'Please select a customer')
    .custom('items', (items) => items && items.length > 0, 'Please add at least one item');
};

export const createChangeValidator = () => {
  return new FormValidator()
    .required('customer_id', 'Please select a customer')
    .required('amount', 'Please enter change amount')
    .custom('amount', walletValidators.tzsAmount, 'Please enter a valid amount');
};

// Form field highlighting utility
export const getFieldClasses = (hasError, hasSuccess = false) => {
  if (hasError) {
    return 'border-red-300 focus:border-red-500 focus:ring-red-500';
  }
  if (hasSuccess) {
    return 'border-green-300 focus:border-green-500 focus:ring-green-500';
  }
  return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
};

// Form submission helper
export const handleFormSubmission = async (
  formData, 
  validator, 
  submitFunction, 
  onSuccess, 
  onError
) => {
  // Validate form
  const validation = validator.validate(formData);
  if (!validation.isValid) {
    onError(validation.errors);
    return { success: false, errors: validation.errors };
  }

  try {
    // Submit form
    const result = await submitFunction(formData);
    if (result.success) {
      onSuccess(result);
      return { success: true, data: result };
    } else {
      onError(result.error?.message || 'Submission failed');
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error.message || 'An unexpected error occurred';
    onError(errorMessage);
    return { success: false, error: errorMessage };
  }
};