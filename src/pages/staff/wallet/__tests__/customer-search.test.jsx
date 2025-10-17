import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CustomerSearch from '../customer-search.jsx'
import { mockUserProvider, mockWalletResponses } from '../../../../test/utils.jsx'

// Mock dependencies
vi.mock('../../../../providers/UserProvider', () => mockUserProvider)

vi.mock('../../../../api/wallet-service.js', () => ({
  default: {
    searchCustomer: vi.fn(),
    getCustomerBalance: vi.fn(),
    getOpenCreditSlips: vi.fn(),
  }
}))

vi.mock('../../../../utils/api-response.js', () => ({
  formatCustomerData: vi.fn((customer) => customer),
  formatCustomerBalance: vi.fn((balance) => balance)
}))

vi.mock('../../../../utils/error-handler.js', () => ({
  createErrorDisplay: vi.fn((error) => ({ message: error.error?.message || 'Error occurred' })),
  createSuccessDisplay: vi.fn((message) => ({ message }))
}))

vi.mock('../../../../utils/currency.js', () => ({
  formatTZS: vi.fn((cents) => `TZS ${(cents / 100).toLocaleString()}`)
}))

// Mock components
vi.mock('../components/customer-balance-card.jsx', () => ({
  default: ({ customer, balance }) => (
    <div data-testid="customer-balance-card">
      <div>{customer.customer_name}</div>
      <div>{balance.wallet_cents}</div>
    </div>
  )
}))

vi.mock('../components/apply-wallet-modal.jsx', () => ({
  default: ({ isOpen, onClose, onSuccess }) => (
    isOpen ? (
      <div data-testid="apply-wallet-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSuccess({ message: 'Wallet applied successfully' })}>
          Apply
        </button>
      </div>
    ) : null
  )
}))

vi.mock('../components/error-display.jsx', () => ({
  default: ({ error, onRetry }) => (
    <div data-testid="error-display">
      <div>{error.message}</div>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  ),
  LoadingDisplay: ({ message }) => (
    <div data-testid="loading-display">{message}</div>
  ),
  SuccessDisplay: ({ message }) => (
    <div data-testid="success-display">{message}</div>
  )
}))

// Mock window.location
const mockLocation = {
  href: ''
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('CustomerSearch', () => {
  const mockWalletService = {
    searchCustomer: vi.fn(),
    getCustomerBalance: vi.fn(),
    getOpenCreditSlips: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
    
    // Import and assign mocked service
    const walletService = require('../../../../api/wallet-service.js').default
    Object.assign(walletService, mockWalletService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render search form', () => {
    render(<CustomerSearch />)
    
    expect(screen.getByText('Customer Search')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter customer ID or phone number...')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('should handle search input changes', async () => {
    const user = userEvent.setup()
    render(<CustomerSearch />)
    
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    await user.type(searchInput, 'CUST001')
    
    expect(searchInput.value).toBe('CUST001')
  })

  it('should disable search button when input is empty', () => {
    render(<CustomerSearch />)
    
    const searchButton = screen.getByText('Search')
    expect(searchButton).toBeDisabled()
  })

  it('should enable search button when input has value', async () => {
    const user = userEvent.setup()
    render(<CustomerSearch />)
    
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    const searchButton = screen.getByText('Search')
    
    await user.type(searchInput, 'CUST001')
    expect(searchButton).not.toBeDisabled()
  })

  it('should perform successful customer search', async () => {
    const user = userEvent.setup()
    
    const mockCustomer = {
      customer_id: 'CUST001',
      customer_name: 'John Doe',
      phone: '+255123456789'
    }
    
    const mockBalance = {
      wallet_cents: 75000,
      outstanding_cents: 0,
      open_slips_count: 0
    }

    mockWalletService.searchCustomer.mockResolvedValue({
      success: true,
      customer: mockCustomer
    })
    
    mockWalletService.getCustomerBalance.mockResolvedValue({
      success: true,
      balance: mockBalance
    })

    render(<CustomerSearch />)
    
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    const searchButton = screen.getByText('Search')
    
    await user.type(searchInput, 'CUST001')
    await user.click(searchButton)
    
    // Should show loading state
    expect(screen.getByText('Searching...')).toBeInTheDocument()
    
    // Wait for search to complete
    await waitFor(() => {
      expect(screen.getByTestId('customer-balance-card')).toBeInTheDocument()
    })
    
    expect(mockWalletService.searchCustomer).toHaveBeenCalledWith('CUST001')
    expect(mockWalletService.getCustomerBalance).toHaveBeenCalledWith('CUST001')
  })

  it('should handle customer not found', async () => {
    const user = userEvent.setup()
    
    mockWalletService.searchCustomer.mockResolvedValue({
      success: false,
      error: { message: 'Customer not found' }
    })

    render(<CustomerSearch />)
    
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    const searchButton = screen.getByText('Search')
    
    await user.type(searchInput, 'INVALID')
    await user.click(searchButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Customer not found')).toBeInTheDocument()
  })

  it('should show no results message when customer not found', async () => {
    const user = userEvent.setup()
    
    mockWalletService.searchCustomer.mockResolvedValue({
      success: false,
      error: { message: 'Customer not found' }
    })

    render(<CustomerSearch />)
    
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    const searchButton = screen.getByText('Search')
    
    await user.type(searchInput, 'NONEXISTENT')
    await user.click(searchButton)
    
    await waitFor(() => {
      expect(screen.getByText('Customer Not Found')).toBeInTheDocument()
    })
    
    expect(screen.getByText('No customer found with ID or phone number "NONEXISTENT"')).toBeInTheDocument()
  })

  it('should display quick actions when customer is found', async () => {
    const user = userEvent.setup()
    
    const mockCustomer = {
      customer_id: 'CUST001',
      customer_name: 'John Doe'
    }
    
    const mockBalance = {
      wallet_cents: 75000,
      outstanding_cents: 0,
      open_slips_count: 0
    }

    mockWalletService.searchCustomer.mockResolvedValue({
      success: true,
      customer: mockCustomer
    })
    
    mockWalletService.getCustomerBalance.mockResolvedValue({
      success: true,
      balance: mockBalance
    })

    render(<CustomerSearch />)
    
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    const searchButton = screen.getByText('Search')
    
    await user.type(searchInput, 'CUST001')
    await user.click(searchButton)
    
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Create Credit Slip')).toBeInTheDocument()
    expect(screen.getByText('Process Payment')).toBeInTheDocument()
    expect(screen.getByText('Store Change')).toBeInTheDocument()
    expect(screen.getByText('View History')).toBeInTheDocument()
  })

  it('should navigate to correct pages when quick actions are clicked', async () => {
    const user = userEvent.setup()
    
    const mockCustomer = {
      customer_id: 'CUST001',
      customer_name: 'John Doe'
    }
    
    const mockBalance = {
      wallet_cents: 75000,
      outstanding_cents: 0,
      open_slips_count: 0
    }

    mockWalletService.searchCustomer.mockResolvedValue({
      success: true,
      customer: mockCustomer
    })
    
    mockWalletService.getCustomerBalance.mockResolvedValue({
      success: true,
      balance: mockBalance
    })

    render(<CustomerSearch />)
    
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    const searchButton = screen.getByText('Search')
    
    await user.type(searchInput, 'CUST001')
    await user.click(searchButton)
    
    await waitFor(() => {
      expect(screen.getByText('Create Credit Slip')).toBeInTheDocument()
    })
    
    // Test Create Credit Slip navigation
    const createCreditButton = screen.getByText('Create Credit Slip')
    await user.click(createCreditButton)
    expect(mockLocation.href).toBe('/staff/wallet/create-credit?customer_id=CUST001')
    
    // Reset location
    mockLocation.href = ''
    
    // Test Process Payment navigation
    const processPaymentButton = screen.getByText('Process Payment')
    await user.click(processPaymentButton)
    expect(mockLocation.href).toBe('/staff/wallet/process-payment?customer_id=CUST001')
  })

  it('should display open credit slips when available', async () => {
    const user = userEvent.setup()
    
    const mockCustomer = {
      customer_id: 'CUST001',
      customer_name: 'John Doe'
    }
    
    const mockBalance = {
      wallet_cents: 75000,
      outstanding_cents: 0,
      open_slips_count: 1
    }
    
    const mockSlips = [
      {
        _id: 'slip1',
        slip_number: 'CS-001',
        status: 'OPEN',
        totals: {
          grand_total_cents: 100000,
          paid_cents: 0,
          remaining_cents: 100000
        },
        created_at: '2024-01-15T10:30:00Z'
      }
    ]

    mockWalletService.searchCustomer.mockResolvedValue({
      success: true,
      customer: mockCustomer
    })
    
    mockWalletService.getCustomerBalance.mockResolvedValue({
      success: true,
      balance: mockBalance
    })
    
    mockWalletService.getOpenCreditSlips.mockResolvedValue({
      success: true,
      slips: mockSlips
    })

    render(<CustomerSearch />)
    
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    const searchButton = screen.getByText('Search')
    
    await user.type(searchInput, 'CUST001')
    await user.click(searchButton)
    
    await waitFor(() => {
      expect(screen.getByText('Open Credit Slips')).toBeInTheDocument()
    })
    
    expect(screen.getByText('CS-001')).toBeInTheDocument()
    expect(screen.getByText('OPEN')).toBeInTheDocument()
    expect(screen.getByText('Apply Wallet')).toBeInTheDocument()
  })

  it('should open apply wallet modal when Apply Wallet is clicked', async () => {
    const user = userEvent.setup()
    
    const mockCustomer = {
      customer_id: 'CUST001',
      customer_name: 'John Doe'
    }
    
    const mockBalance = {
      wallet_cents: 75000,
      outstanding_cents: 0,
      open_slips_count: 1
    }
    
    const mockSlips = [
      {
        _id: 'slip1',
        slip_number: 'CS-001',
        status: 'OPEN',
        totals: {
          grand_total_cents: 100000,
          paid_cents: 0,
          remaining_cents: 100000
        },
        created_at: '2024-01-15T10:30:00Z'
      }
    ]

    mockWalletService.searchCustomer.mockResolvedValue({
      success: true,
      customer: mockCustomer
    })
    
    mockWalletService.getCustomerBalance.mockResolvedValue({
      success: true,
      balance: mockBalance
    })
    
    mockWalletService.getOpenCreditSlips.mockResolvedValue({
      success: true,
      slips: mockSlips
    })

    render(<CustomerSearch />)
    
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    const searchButton = screen.getByText('Search')
    
    await user.type(searchInput, 'CUST001')
    await user.click(searchButton)
    
    await waitFor(() => {
      expect(screen.getByText('Apply Wallet')).toBeInTheDocument()
    })
    
    const applyWalletButton = screen.getByText('Apply Wallet')
    await user.click(applyWalletButton)
    
    expect(screen.getByTestId('apply-wallet-modal')).toBeInTheDocument()
  })

  it('should handle back to wallet navigation', async () => {
    const user = userEvent.setup()
    render(<CustomerSearch />)
    
    const backButton = screen.getByText('Back to Wallet')
    await user.click(backButton)
    
    expect(mockLocation.href).toBe('/staff/wallet')
  })

  it('should handle retry functionality', async () => {
    const user = userEvent.setup()
    
    mockWalletService.searchCustomer.mockResolvedValue({
      success: false,
      error: { message: 'Network error' }
    })

    render(<CustomerSearch />)
    
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    const searchButton = screen.getByText('Search')
    
    await user.type(searchInput, 'CUST001')
    await user.click(searchButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument()
    })
    
    const retryButton = screen.getByText('Retry')
    await user.click(retryButton)
    
    expect(mockWalletService.searchCustomer).toHaveBeenCalledTimes(2)
  })

  it('should handle form submission with Enter key', async () => {
    const user = userEvent.setup()
    
    mockWalletService.searchCustomer.mockResolvedValue({
      success: true,
      customer: { customer_id: 'CUST001', customer_name: 'John Doe' }
    })
    
    mockWalletService.getCustomerBalance.mockResolvedValue({
      success: true,
      balance: { wallet_cents: 75000, outstanding_cents: 0, open_slips_count: 0 }
    })

    render(<CustomerSearch />)
    
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    
    await user.type(searchInput, 'CUST001')
    await user.keyboard('{Enter}')
    
    expect(mockWalletService.searchCustomer).toHaveBeenCalledWith('CUST001')
  })

  it('should be accessible', () => {
    render(<CustomerSearch />)
    
    // Check for proper form structure
    const searchForm = screen.getByRole('form')
    expect(searchForm).toBeInTheDocument()
    
    // Check for proper input labeling
    const searchInput = screen.getByPlaceholderText('Enter customer ID or phone number...')
    expect(searchInput).toBeInTheDocument()
    
    // Check for proper button roles
    const searchButton = screen.getByRole('button', { name: /search/i })
    expect(searchButton).toBeInTheDocument()
    
    // Check for proper heading structure
    const mainHeading = screen.getByRole('heading', { level: 1 })
    expect(mainHeading).toHaveTextContent('Customer Search')
  })
})