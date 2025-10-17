import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WalletActivityWidget from '../wallet-activity-widget.jsx'

// Mock the currency utility
vi.mock('../../../../../utils/currency.js', () => ({
  formatTZS: vi.fn((cents) => `TZS ${(cents / 100).toLocaleString()}`)
}))

// Mock window.location
const mockLocation = {
  href: ''
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('WalletActivityWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  it('should render loading state initially', () => {
    render(<WalletActivityWidget />)
    
    expect(screen.getByText('Recent Wallet Activity')).toBeInTheDocument()
    
    // Check for loading skeletons
    const loadingElements = document.querySelectorAll('.animate-pulse')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('should render activity list after loading', async () => {
    render(<WalletActivityWidget />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Payment received')).toBeInTheDocument()
    }, { timeout: 1000 })

    expect(screen.getByText('Credit slip created')).toBeInTheDocument()
    expect(screen.getByText('Change stored as wallet balance')).toBeInTheDocument()
    expect(screen.getByText('Wallet balance applied to credit slip')).toBeInTheDocument()
    
    // Check customer names
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Mike Johnson')).toBeInTheDocument()
    expect(screen.getByText('Sarah Wilson')).toBeInTheDocument()
  })

  it('should display formatted amounts with correct signs', async () => {
    render(<WalletActivityWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('+TZS 15,000')).toBeInTheDocument()
    })

    expect(screen.getByText('-TZS 8,500')).toBeInTheDocument()
    expect(screen.getByText('+TZS 2,500')).toBeInTheDocument()
    expect(screen.getByText('-TZS 12,000')).toBeInTheDocument()
  })

  it('should show relative time stamps', async () => {
    render(<WalletActivityWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('5m ago')).toBeInTheDocument()
    })

    expect(screen.getByText('12m ago')).toBeInTheDocument()
    expect(screen.getByText('25m ago')).toBeInTheDocument()
    expect(screen.getByText('35m ago')).toBeInTheDocument()
  })

  it('should navigate to history page when View All is clicked', async () => {
    render(<WalletActivityWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('View All')).toBeInTheDocument()
    })

    const viewAllButton = screen.getByText('View All')
    fireEvent.click(viewAllButton)
    
    expect(mockLocation.href).toBe('/staff/wallet/history')
  })

  it('should navigate to history when activity items are clicked', async () => {
    render(<WalletActivityWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('Payment received')).toBeInTheDocument()
    })

    const activityItem = screen.getByText('Payment received').closest('div')
    fireEvent.click(activityItem)
    
    expect(mockLocation.href).toBe('/staff/wallet/history')
  })

  it('should display proper icons for different activity types', async () => {
    render(<WalletActivityWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('Payment received')).toBeInTheDocument()
    })

    // Check that icons are rendered (they should be SVG elements)
    const svgElements = document.querySelectorAll('svg')
    expect(svgElements.length).toBeGreaterThan(4) // At least one icon per activity + header icon
  })

  it('should show refresh functionality', async () => {
    render(<WalletActivityWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })

    const refreshButton = screen.getByText('Refresh')
    expect(refreshButton).toBeInTheDocument()
    
    // Click refresh button
    fireEvent.click(refreshButton)
    
    // Should trigger a re-render (loading state briefly)
    expect(screen.getByText('Recent Wallet Activity')).toBeInTheDocument()
  })

  it('should display last updated timestamp', async () => {
    render(<WalletActivityWidget />)
    
    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })

    const lastUpdatedText = screen.getByText(/Last updated:/)
    expect(lastUpdatedText).toBeInTheDocument()
  })

  it('should handle empty activity state', async () => {
    // Mock empty response
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ activities: [] })
    })

    render(<WalletActivityWidget />)
    
    // Wait for component to handle empty state
    await waitFor(() => {
      // The component should still show the header
      expect(screen.getByText('Recent Wallet Activity')).toBeInTheDocument()
    })

    global.fetch = originalFetch
  })

  it('should apply correct styling for credit and debit transactions', async () => {
    render(<WalletActivityWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('+TZS 15,000')).toBeInTheDocument()
    })

    // Check credit transaction styling (green)
    const creditAmount = screen.getByText('+TZS 15,000')
    expect(creditAmount).toHaveClass('text-green-600')

    // Check debit transaction styling (red)
    const debitAmount = screen.getByText('-TZS 8,500')
    expect(debitAmount).toHaveClass('text-red-600')
  })

  it('should be accessible', async () => {
    render(<WalletActivityWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('Recent Wallet Activity')).toBeInTheDocument()
    })

    // Check for proper heading
    const heading = screen.getByText('Recent Wallet Activity')
    expect(heading.tagName).toBe('H3')

    // Check for clickable elements
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)

    // Check that activity items are clickable
    const activityItems = document.querySelectorAll('[class*="cursor-pointer"]')
    expect(activityItems.length).toBeGreaterThan(0)
  })

  it('should handle error state gracefully', async () => {
    // Mock console.error to avoid noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock fetch to throw error
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<WalletActivityWidget />)
    
    // Component should handle error gracefully
    await waitFor(() => {
      expect(screen.getByText('Recent Wallet Activity')).toBeInTheDocument()
    })

    global.fetch = originalFetch
    consoleSpy.mockRestore()
  })

  describe('getTimeAgo function', () => {
    it('should format time correctly', async () => {
      render(<WalletActivityWidget />)
      
      await waitFor(() => {
        // Check various time formats are displayed
        const timeElements = screen.getAllByText(/ago$/)
        expect(timeElements.length).toBeGreaterThan(0)
      })
    })
  })
})