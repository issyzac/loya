import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PromotionalMessageCard from '../promotional-message-card';

describe('PromotionalMessageCard', () => {
  const mockMessage = {
    id: 'test-message-1',
    title: 'Special Offer',
    content: 'Get 20% off your next purchase!',
    type: 'promotion',
    ctaText: 'Shop Now',
    ctaUrl: 'https://example.com/shop',
    dismissible: true
  };

  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    mockOnDismiss.mockClear();
    // Mock window.open
    global.open = vi.fn();
  });

  it('should render message title and content', () => {
    render(<PromotionalMessageCard message={mockMessage} onDismiss={mockOnDismiss} />);
    
    expect(screen.getByText('Special Offer')).toBeInTheDocument();
    expect(screen.getByText('Get 20% off your next purchase!')).toBeInTheDocument();
  });

  it('should render CTA button when ctaText is provided', () => {
    render(<PromotionalMessageCard message={mockMessage} onDismiss={mockOnDismiss} />);
    
    const ctaButton = screen.getByText('Shop Now');
    expect(ctaButton).toBeInTheDocument();
  });

  it('should open CTA URL when CTA button is clicked', () => {
    render(<PromotionalMessageCard message={mockMessage} onDismiss={mockOnDismiss} />);
    
    const ctaButton = screen.getByText('Shop Now');
    fireEvent.click(ctaButton);
    
    expect(global.open).toHaveBeenCalledWith(
      'https://example.com/shop',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('should render dismiss button when message is dismissible', () => {
    render(<PromotionalMessageCard message={mockMessage} onDismiss={mockOnDismiss} />);
    
    const dismissButton = screen.getByLabelText('Dismiss Special Offer');
    expect(dismissButton).toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button is clicked', async () => {
    render(<PromotionalMessageCard message={mockMessage} onDismiss={mockOnDismiss} />);
    
    const dismissButton = screen.getByLabelText('Dismiss Special Offer');
    fireEvent.click(dismissButton);
    
    // Wait for the animation delay
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith('test-message-1');
    }, { timeout: 300 });
  });

  it('should not render dismiss button when message is not dismissible', () => {
    const nonDismissibleMessage = { ...mockMessage, dismissible: false };
    render(<PromotionalMessageCard message={nonDismissibleMessage} onDismiss={mockOnDismiss} />);
    
    expect(screen.queryByLabelText('Dismiss Special Offer')).not.toBeInTheDocument();
  });

  it('should render promotional image when imageUrl is provided', async () => {
    const messageWithImage = { 
      ...mockMessage, 
      imageUrl: 'https://example.com/promo-image.jpg' 
    };
    render(<PromotionalMessageCard message={messageWithImage} onDismiss={mockOnDismiss} />);
    
    // In test environment, LazyImage shows placeholder initially, then loads image
    // Check for the image container first
    const imageContainer = screen.getByLabelText('Loading image...');
    expect(imageContainer).toBeInTheDocument();
    
    // Wait for the image to load (in test environment it should load immediately)
    await waitFor(() => {
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/promo-image.jpg');
      expect(image).toHaveAttribute('loading', 'lazy');
    }, { timeout: 100 });
  });

  it('should apply correct styling based on message type', () => {
    const { container } = render(<PromotionalMessageCard message={mockMessage} onDismiss={mockOnDismiss} />);
    
    const card = container.firstChild;
    expect(card).toHaveClass('border-blue-200');
    expect(card).toHaveClass('bg-gradient-to-br');
    expect(card).toHaveClass('from-blue-50');
  });

  it('should apply announcement styling for announcement type', () => {
    const announcementMessage = { ...mockMessage, type: 'announcement' };
    const { container } = render(<PromotionalMessageCard message={announcementMessage} onDismiss={mockOnDismiss} />);
    
    const card = container.firstChild;
    expect(card).toHaveClass('border-amber-200');
    expect(card).toHaveClass('bg-gradient-to-br');
    expect(card).toHaveClass('from-amber-50');
  });

  it('should apply info styling for info type', () => {
    const infoMessage = { ...mockMessage, type: 'info' };
    const { container } = render(<PromotionalMessageCard message={infoMessage} onDismiss={mockOnDismiss} />);
    
    const card = container.firstChild;
    expect(card).toHaveClass('border-slate-200');
    expect(card).toHaveClass('bg-gradient-to-br');
    expect(card).toHaveClass('from-slate-50');
  });

  it('should not render CTA button when ctaText is not provided', () => {
    const messageWithoutCta = { ...mockMessage, ctaText: undefined, ctaUrl: undefined };
    render(<PromotionalMessageCard message={messageWithoutCta} onDismiss={mockOnDismiss} />);
    
    expect(screen.queryByText('Shop Now')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<PromotionalMessageCard message={mockMessage} onDismiss={mockOnDismiss} />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-labelledby', 'promo-title-test-message-1');
    
    const title = screen.getByText('Special Offer');
    expect(title).toHaveAttribute('id', 'promo-title-test-message-1');
  });

  it('should return null when no message is provided', () => {
    const { container } = render(<PromotionalMessageCard message={null} onDismiss={mockOnDismiss} />);
    expect(container.firstChild).toBeNull();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PromotionalMessageCard 
        message={mockMessage} 
        onDismiss={mockOnDismiss} 
        className="custom-class" 
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});