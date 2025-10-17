import { render } from '@testing-library/react'
import { vi } from 'vitest'

// Mock UserProvider context
export const mockUserProvider = {
  useStaffUser: () => ({
    id: 'staff-123',
    name: 'Test Staff',
    role: 'staff',
    email: 'test@example.com'
  }),
  useStaffPermissions: () => ['wallet_access', 'customer_search'],
  useUpdateStaffToken: () => vi.fn(),
  useStaffAuthStatus: () => true,
}

// Custom render function with providers
export function renderWithProviders(ui, options = {}) {
  const { initialEntries = ['/'], ...renderOptions } = options

  function Wrapper({ children }) {
    return (
      <div data-testid="test-wrapper">
        {children}
      </div>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock wallet service responses
export const mockWalletResponses = {
  customerBalance: {
    success: true,
    data: {
      customer_id: 'CUST001',
      customer_name: 'John Doe',
      phone: '+255123456789',
      currency: 'TZS',
      balance_cents: 75000,
      wallet_cents: 75000,
      outstanding_cents: 0,
      open_slips_count: 0,
      account_status: 'ACTIVE'
    }
  },
  
  creditSlipCreation: {
    success: true,
    data: {
      slip_id: '65a1b2c3d4e5f6789012345',
      slip_number: 'CS-20240115103000-A1B2C3D4',
      grand_total_cents: 350000,
      items_count: 3,
      status: 'OPEN'
    }
  },
  
  paymentProcessing: {
    success: true,
    data: {
      payment_id: 'PAY-123456',
      applied_total: 500000,
      wallet_topup: 150000,
      allocations: []
    }
  },
  
  transactionHistory: {
    success: true,
    data: {
      entries: [
        {
          entry_id: 'TXN001',
          entry_type: 'PAYMENT',
          direction: 'CREDIT',
          amount_cents: 50000,
          description: 'Payment received',
          occurred_at: '2024-01-15T10:35:00Z',
          staff_member: 'Jane Smith'
        }
      ],
      pagination: {
        page: 1,
        per_page: 20,
        total_pages: 1,
        total_entries: 1
      }
    }
  },

  error: {
    success: false,
    error: {
      message: 'Test error message',
      code: 'TEST_ERROR',
      severity: 'error',
      isRetryable: false,
      timestamp: '2024-01-15T10:35:00Z'
    }
  }
}

// Mock axios instance
export const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
}

// Test data generators
export const generateMockCustomer = (overrides = {}) => ({
  customer_id: 'CUST001',
  customer_name: 'John Doe',
  phone: '+255123456789',
  email: 'john@example.com',
  ...overrides
})

export const generateMockCreditSlip = (overrides = {}) => ({
  slip_id: '65a1b2c3d4e5f6789012345',
  slip_number: 'CS-20240115103000-A1B2C3D4',
  customer_name: 'John Doe',
  status: 'OPEN',
  grand_total_cents: 350000,
  paid_cents: 0,
  remaining_cents: 350000,
  items_count: 3,
  created_at: '2024-01-15T10:30:00Z',
  ...overrides
})

export const generateMockTransaction = (overrides = {}) => ({
  entry_id: 'TXN001',
  entry_type: 'PAYMENT',
  direction: 'CREDIT',
  amount_cents: 50000,
  description: 'Payment received',
  occurred_at: '2024-01-15T10:35:00Z',
  staff_member: 'Jane Smith',
  ...overrides
})

// Wait for async operations
export const waitFor = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

// Mock form submission
export const mockFormSubmit = (formData) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, data: formData }), 100)
  })
}