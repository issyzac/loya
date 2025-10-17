import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import CustomerBalanceStatusCard from '../customer-balance-status-card';

describe('CustomerBalanceStatusCard', () => {
  it('renders loading state correctly', () => {
    render(<CustomerBalanceStatusCard loading={true} />);
    
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays available credit with green styling when wallet has positive balance', () => {
    render(
      <CustomerBalanceStatusCard 
        walletCents={50000} // 500 TZS
        outstandingCents={0}
      />
    );
    
    expect(screen.getByText('You have available credit')).toBeInTheDocument();
    expect(document.querySelector('.bg-green-50')).toBeInTheDocument();
  });

  it('displays amount owed with yellow styling when customer has outstanding bills', () => {
    render(
      <CustomerBalanceStatusCard 
        walletCents={0}
        outstandingCents={30000} // 300 TZS
        openSlipsCount={2}
      />
    );
    
    expect(screen.getByText('You have outstanding bills')).toBeInTheDocument();
    expect(screen.getByText('2 pending bills')).toBeInTheDocument();
    expect(document.querySelector('.bg-yellow-50')).toBeInTheDocument();
  });

  it('displays net balance correctly when both wallet and outstanding amounts exist', () => {
    render(
      <CustomerBalanceStatusCard 
        walletCents={80000} // 800 TZS
        outstandingCents={30000} // 300 TZS
        openSlipsCount={1}
      />
    );
    
    // Net balance should be 500 TZS (800 - 300)
    expect(screen.getByText('You have available credit')).toBeInTheDocument();
    // Check for individual amounts in their respective sections
    expect(screen.getAllByText('TZS 500')).toHaveLength(1); // Net balance
    expect(screen.getAllByText('TZS 800')).toHaveLength(1); // Available credit
    expect(screen.getAllByText('TZS 300')).toHaveLength(1); // Amount owed
  });

  it('displays balanced state when net balance is zero but shows yellow due to outstanding bills', () => {
    render(
      <CustomerBalanceStatusCard 
        walletCents={50000} // 500 TZS
        outstandingCents={50000} // 500 TZS
      />
    );
    
    expect(screen.getByText('Your account is balanced')).toBeInTheDocument();
    // When net balance is zero but there are outstanding bills, it should show yellow (outstanding bills take precedence)
    expect(document.querySelector('.bg-yellow-50')).toBeInTheDocument();
  });

  it('shows empty wallet message when both amounts are zero', () => {
    render(
      <CustomerBalanceStatusCard 
        walletCents={0}
        outstandingCents={0}
      />
    );
    
    expect(screen.getByText('Your wallet is empty. Add credit or make purchases to see your balance here.')).toBeInTheDocument();
  });

  it('calls onViewDetails when View Details button is clicked', () => {
    const mockOnViewDetails = vi.fn();
    
    render(
      <CustomerBalanceStatusCard 
        walletCents={50000}
        outstandingCents={0}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    fireEvent.click(screen.getByText('View Details'));
    expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
  });

  it('calls onPayBills when Pay Bills button is clicked', () => {
    const mockOnPayBills = vi.fn();
    
    render(
      <CustomerBalanceStatusCard 
        walletCents={0}
        outstandingCents={30000}
        openSlipsCount={2}
        onPayBills={mockOnPayBills}
      />
    );
    
    fireEvent.click(screen.getByText('Pay 2 Bills'));
    expect(mockOnPayBills).toHaveBeenCalledTimes(1);
  });

  it('does not show Pay Bills button when no outstanding amount', () => {
    render(
      <CustomerBalanceStatusCard 
        walletCents={50000}
        outstandingCents={0}
        onPayBills={() => {}}
      />
    );
    
    expect(screen.queryByText(/Pay.*Bills?/)).not.toBeInTheDocument();
  });

  it('formats currency amounts correctly with TZS', () => {
    render(
      <CustomerBalanceStatusCard 
        walletCents={123456} // 1,234.56 TZS
        outstandingCents={78900} // 789 TZS
      />
    );
    
    // Check for the actual formatted amounts that would be displayed
    expect(screen.getByText('TZS 445.56')).toBeInTheDocument(); // Net balance (1234.56 - 789)
    expect(screen.getByText('TZS 1,234.56')).toBeInTheDocument(); // Available credit
    expect(screen.getByText('TZS 789')).toBeInTheDocument(); // Amount owed
  });

  it('handles single vs plural bills text correctly', () => {
    const { rerender } = render(
      <CustomerBalanceStatusCard 
        walletCents={0}
        outstandingCents={30000}
        openSlipsCount={1}
        onPayBills={() => {}}
      />
    );
    
    expect(screen.getByText('1 pending bill')).toBeInTheDocument();
    expect(screen.getByText('Pay 1 Bill')).toBeInTheDocument();
    
    rerender(
      <CustomerBalanceStatusCard 
        walletCents={0}
        outstandingCents={30000}
        openSlipsCount={3}
        onPayBills={() => {}}
      />
    );
    
    expect(screen.getByText('3 pending bills')).toBeInTheDocument();
    expect(screen.getByText('Pay 3 Bills')).toBeInTheDocument();
  });
});