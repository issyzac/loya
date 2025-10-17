import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorDisplay, CompactErrorDisplay, NetworkStatusIndicator } from '../error-display';

describe('ErrorDisplay', () => {
  const mockError = {
    message: 'Something went wrong',
    isRetryable: true,
    severity: 'error',
    code: 'UNKNOWN_ERROR'
  };

  it('should render error message', () => {
    render(<ErrorDisplay error={mockError} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Unable to Load Data')).toBeInTheDocument();
  });

  it('should render retry button when error is retryable', () => {
    const onRetry = vi.fn();
    render(<ErrorDisplay error={mockError} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render retry button when error is not retryable', () => {
    const nonRetryableError = { ...mockError, isRetryable: false };
    render(<ErrorDisplay error={nonRetryableError} />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should show loading state when retrying', () => {
    const onRetry = vi.fn();
    render(<ErrorDisplay error={mockError} onRetry={onRetry} isRetrying={true} />);
    
    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    
    const retryButton = screen.getByRole('button', { name: /retrying/i });
    expect(retryButton).toBeDisabled();
  });

  it('should render authentication error styling', () => {
    const authError = {
      message: 'Please log in',
      isRetryable: false,
      severity: 'warning',
      code: 'CUSTOMER_ID_MISSING',
      requiresAuth: true
    };
    
    render(<ErrorDisplay error={authError} />);
    
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should render network error with appropriate icon and title', () => {
    const networkError = {
      message: 'Network connection failed',
      isRetryable: true,
      severity: 'error',
      code: 'NETWORK_ERROR'
    };
    
    render(<ErrorDisplay error={networkError} />);
    
    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ErrorDisplay error={mockError} />);
    
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
  });

  it('should not render when no error is provided', () => {
    const { container } = render(<ErrorDisplay error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should apply custom className', () => {
    render(<ErrorDisplay error={mockError} className="custom-error" />);
    
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveClass('custom-error');
  });

  it('should handle sign in button click', () => {
    // Mock window.location.href
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    const authError = {
      message: 'Please log in',
      requiresAuth: true,
      isRetryable: false
    };
    
    render(<ErrorDisplay error={authError} />);
    
    const signInButton = screen.getByText('Sign In');
    fireEvent.click(signInButton);
    
    expect(window.location.href).toBe('/login');
    
    // Restore original location
    window.location = originalLocation;
  });
});

describe('CompactErrorDisplay', () => {
  const mockError = {
    message: 'Compact error',
    isRetryable: true,
    severity: 'error'
  };

  it('should render with compact styling', () => {
    render(<CompactErrorDisplay error={mockError} />);
    
    expect(screen.getByText('Compact error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should not render when no error is provided', () => {
    const { container } = render(<CompactErrorDisplay error={null} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('NetworkStatusIndicator', () => {
  it('should not render when online', () => {
    const { container } = render(<NetworkStatusIndicator isOnline={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render offline message when offline', () => {
    render(<NetworkStatusIndicator isOnline={false} />);
    
    expect(screen.getByText(/You appear to be offline/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes when offline', () => {
    render(<NetworkStatusIndicator isOnline={false} />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-live', 'polite');
  });
});