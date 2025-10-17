import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSkeleton, CompactLoadingSkeleton, ButtonLoadingSpinner } from '../loading-skeleton';

describe('LoadingSkeleton', () => {
  it('should render default number of skeleton items', () => {
    render(<LoadingSkeleton />);
    
    // Should render 3 skeleton items by default
    const skeletonItems = screen.getAllByRole('status');
    expect(skeletonItems).toHaveLength(1); // Main container has role="status"
    
    // Check for skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements).toHaveLength(3);
  });

  it('should render custom number of skeleton items', () => {
    render(<LoadingSkeleton count={5} />);
    
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements).toHaveLength(5);
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingSkeleton count={2} />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-label', 'Loading 2 items');
  });

  it('should show header text when enabled', () => {
    render(<LoadingSkeleton showHeader={true} headerText="Loading bills..." />);
    
    expect(screen.getByText('Loading bills...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<LoadingSkeleton className="custom-class" />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveClass('custom-class');
  });
});

describe('CompactLoadingSkeleton', () => {
  it('should render loading spinner and text', () => {
    render(<CompactLoadingSkeleton />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<CompactLoadingSkeleton />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-label', 'Loading');
  });
});

describe('ButtonLoadingSpinner', () => {
  it('should render with default size', () => {
    render(<ButtonLoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  it('should render with custom size', () => {
    render(<ButtonLoadingSpinner size="lg" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-6', 'w-6');
  });

  it('should have proper accessibility attributes', () => {
    render(<ButtonLoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });
});