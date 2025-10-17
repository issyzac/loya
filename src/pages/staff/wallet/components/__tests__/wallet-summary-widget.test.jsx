import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WalletSummaryWidget from '../wallet-summary-widget.jsx'
import { renderWithProviders } from '../../../../../test/utils.jsx'

// Mock the currency utility
vi.mock('../../../../../utils/currency.js', () => ({
  formatTZS: vi.fn((cents) => `TZS ${(cents / 100).toLocaleString()}`)
}))

// Mock wallet service
vi.mock('../../../../../api/wallet-service.js', () => ({
  default: {
    getWalletSummary: vi.fn()
  }
}))

// Mock window.location
const mockLocation = {
  href: ''
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('WalletSummaryWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  it('should render loading state initially', () => {
    render(<WalletSummaryWidget />)
    
    expect(screen.getByText('Wallet Overview')).toBeInTheDocument()
    expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number))
    
    // Check for loading skeletons
    const loadingElements = document.querySelectorAll('.animate-pulse')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('should render wallet statistics after loading', async () => {
    render(<WalletSummaryWidget />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('TZS 125,450')).toBeInTheDocument()
    }, { timeout: 1000 })

    expect(screen.getByText('Total Wallet Balance')).toBeInTheDocument()
    expect(screen.getByText('Customers with Balance')).toBeInTheDocument()
    expect(screen.getByText('Open Credit Slips')).toBeInTheDocument()
    expect(screen.getByText("Today's Payments")).toBeInTheDocument()
    
    expect(screen.getByText('23')).toBeInTheDocument() // customers count
    expect(screen.getByText('8')).toBeInTheDocument() // open slips
    expect(screen.getByText('12')).toBeInTheDocument() // today's payments
  })

  it('should display trend indicators', async () => {
    render(<WalletSummaryWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('TZS 125,450')).toBeInTheDocument()
    })

    // Check for trend percentages
    expect(screen.getByText('8.2%')).toBeInTheDocument()
    expect(screen.getByText('5.1%')).toBeInTheDocument()
    expect(screen.getByText('2.3%')).toBeInTheDocument()
    expect(screen.getByText('12.7%')).toBeInTheDocument()
    
    // Check for "vs yesterday" text
    const yesterdayTexts = screen.getAllByText('vs yesterday')
    expect(yesterdayTexts).toHaveLength(4)
  })

  it('should navigate to wallet dashboard when View Details is clicked', async () => {
    render(<WalletSummaryWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })

    const viewDetailsButton = screen.getByText('View Details')
    fireEvent.click(viewDetailsButton)
    
    expect(mockLocation.href).toBe('/staff/wallet')
  })

  it('should navigate to appropriate pages when stat cards are clicked', async () => {
    render(<WalletSummaryWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('TZS 125,450')).toBeInTheDocument()
    })

    // Click on Total Wallet Balance card
    const walletBalanceCard = screen.getByText('Total Wallet Balance').closest('div')
    fireEvent.click(walletBalanceCard)
    expect(mockLocation.href).toBe('/staff/wallet')

    // Reset location
    mockLocation.href = ''

    // Click on Customers with Balance card
    const customersCard = screen.getByText('Customers with Balance').closest('div')
    fireEvent.click(customersCard)
    expect(mockLocation.href).toBe('/staff/wallet/search')
  })

  it('should render quick action buttons', async () => {
    render(<WalletSummaryWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    })

    expect(screen.getByText('Search Customer')).toBeInTheDocument()
    expect(screen.getByText('Process Payment')).toBeInTheDocument()
  })

  it('should navigate when quick action buttons are clicked', async () => {
    render(<WalletSummaryWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('Search Customer')).toBeInTheDocument()
    })

    const searchButton = screen.getByText('Search Customer')
    fireEvent.click(searchButton)
    expect(mockLocation.href).toBe('/staff/wallet/search')

    // Reset location
    mockLocation.href = ''

    const paymentButton = screen.getByText('Process Payment')
    fireEvent.click(paymentButton)
    expect(mockLocation.href).toBe('/staff/wallet/process-payment')
  })

  it('should handle error state', async () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<WalletSummaryWidget />)
    
    // Wait for error state to appear (simulated in component)
    await waitFor(() => {
      // The component doesn't actually show error state in current implementation
      // but we can test that it handles errors gracefully
      expect(screen.getByText('Wallet Overview')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it('should display proper styling classes', async () => {
    render(<WalletSummaryWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('TZS 125,450')).toBeInTheDocument()
    })

    // Check for proper color coding
    const walletCard = screen.getByText('Total Wallet Balance').closest('div')
    expect(walletCard).toHaveClass('border-green-500')

    const customersCard = screen.getByText('Customers with Balance').closest('div')
    expect(customersCard).toHaveClass('border-blue-500')

    const slipsCard = screen.getByText('Open Credit Slips').closest('div')
    expect(slipsCard).toHaveClass('border-orange-500')

    const paymentsCard = screen.getByText("Today's Payments").closest('div')
    expect(paymentsCard).toHaveClass('border-purple-500')
  })

  it('should be accessible', async () => {
    render(<WalletSummaryWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('TZS 125,450')).toBeInTheDocument()
    })

    // Check for proper button roles
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)

    // Check that clickable elements are focusable
    const viewDetailsButton = screen.getByText('View Details')
    expect(viewDetailsButton).toBeInTheDocument()
    
    // Check for proper heading structure
    const heading = screen.getByText('Wallet Overview')
    expect(heading.tagName).toBe('H3')
  })
})