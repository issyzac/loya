import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  SparklesIcon,
  BanknotesIcon,
  CreditCardIcon,
  WalletIcon
} from '@heroicons/react/16/solid';

// Success animation component
export function SuccessAnimation({ 
  isVisible, 
  onComplete, 
  title, 
  message, 
  icon: CustomIcon,
  duration = 3000 
}) {
  const [stage, setStage] = useState('entering'); // entering, showing, exiting

  useEffect(() => {
    if (!isVisible) return;

    const timer1 = setTimeout(() => setStage('showing'), 100);
    const timer2 = setTimeout(() => setStage('exiting'), duration - 500);
    const timer3 = setTimeout(() => {
      onComplete?.();
      setStage('entering');
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  const IconComponent = CustomIcon || CheckCircleIcon;

  return (
    <div className={`
      fixed inset-0 flex items-center justify-center z-50 pointer-events-none
      transition-all duration-500 ease-out
      ${stage === 'entering' ? 'opacity-0 scale-95' : 
        stage === 'showing' ? 'opacity-100 scale-100' : 
        'opacity-0 scale-105'}
    `}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center border border-green-200">
        {/* Animated Icon */}
        <div className="relative mb-4">
          <div className={`
            inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100
            transition-all duration-700 ease-out
            ${stage === 'showing' ? 'animate-bounce' : ''}
          `}>
            <IconComponent className="w-8 h-8 text-green-600" />
          </div>
          
          {/* Sparkle effects */}
          {stage === 'showing' && (
            <>
              <SparklesIcon className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-ping" />
              <SparklesIcon className="w-3 h-3 text-yellow-400 absolute -bottom-1 -left-1 animate-ping delay-300" />
            </>
          )}
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{message}</p>

        {/* Progress bar */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-green-500 h-1 rounded-full transition-all duration-300 ease-linear"
            style={{ 
              width: stage === 'entering' ? '0%' : 
                     stage === 'showing' ? '100%' : '100%',
              animationDuration: `${duration}ms`
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Wallet-specific success animations
export function PaymentSuccessAnimation({ isVisible, onComplete, amount, customer }) {
  return (
    <SuccessAnimation
      isVisible={isVisible}
      onComplete={onComplete}
      title="Payment Processed!"
      message={`${amount} payment from ${customer} has been processed successfully`}
      icon={CreditCardIcon}
    />
  );
}

export function CreditSlipSuccessAnimation({ isVisible, onComplete, slipNumber, amount }) {
  return (
    <SuccessAnimation
      isVisible={isVisible}
      onComplete={onComplete}
      title="Credit Slip Created!"
      message={`Credit slip ${slipNumber} for ${amount} has been created`}
      icon={BanknotesIcon}
    />
  );
}

export function WalletSuccessAnimation({ isVisible, onComplete, amount, action }) {
  const messages = {
    applied: `${amount} applied from wallet successfully`,
    stored: `${amount} stored in wallet successfully`,
    added: `${amount} added to wallet successfully`
  };

  return (
    <SuccessAnimation
      isVisible={isVisible}
      onComplete={onComplete}
      title="Wallet Updated!"
      message={messages[action] || `Wallet operation completed successfully`}
      icon={WalletIcon}
    />
  );
}

// Loading state with progress
export function ProgressFeedback({ 
  isVisible, 
  steps, 
  currentStep, 
  title = 'Processing...',
  onComplete 
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isVisible && steps.length > 0) {
      const stepProgress = ((currentStep + 1) / steps.length) * 100;
      setProgress(stepProgress);
      
      if (currentStep >= steps.length - 1) {
        setTimeout(() => onComplete?.(), 1000);
      }
    }
  }, [isVisible, currentStep, steps.length, onComplete]);

  if (!isVisible) return null;

  const currentStepData = steps[currentStep] || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
        <div className="text-center">
          {/* Progress Circle */}
          <div className="relative w-16 h-16 mx-auto mb-4">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                className="text-blue-600 transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Title and Current Step */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-4">
            {currentStepData.label || `Step ${currentStep + 1} of ${steps.length}`}
          </p>

          {/* Step List */}
          <div className="text-left space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center text-sm">
                <div className={`
                  w-4 h-4 rounded-full mr-3 flex items-center justify-center
                  ${index < currentStep ? 'bg-green-500' :
                    index === currentStep ? 'bg-blue-500' : 'bg-gray-300'}
                `}>
                  {index < currentStep && (
                    <CheckCircleIcon className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className={
                  index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Interactive feedback for form fields
export function FieldFeedback({ type, message, animate = true }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [message]);

  if (!message) return null;

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          className: 'text-green-600 bg-green-50 border-green-200'
        };
      case 'error':
        return {
          icon: XCircleIcon,
          className: 'text-red-600 bg-red-50 border-red-200'
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          className: 'text-yellow-600 bg-yellow-50 border-yellow-200'
        };
      default:
        return {
          icon: InformationCircleIcon,
          className: 'text-blue-600 bg-blue-50 border-blue-200'
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  return (
    <div className={`
      flex items-center p-2 rounded border text-xs mt-1
      ${config.className}
      ${animate ? 'transition-all duration-300 ease-out' : ''}
      ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-1'}
    `}>
      <IconComponent className="w-3 h-3 mr-1 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// Pulse effect for important elements
export function PulseHighlight({ children, isActive, color = 'blue' }) {
  return (
    <div className={`
      ${isActive ? `animate-pulse ring-2 ring-${color}-300 ring-opacity-50` : ''}
      transition-all duration-300 rounded-lg
    `}>
      {children}
    </div>
  );
}

// Shake animation for errors
export function ShakeOnError({ children, hasError }) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (hasError) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  return (
    <div className={isShaking ? 'animate-shake' : ''}>
      {children}
    </div>
  );
}

// Add shake animation to CSS (you would add this to your global CSS)
export const shakeAnimation = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
`;