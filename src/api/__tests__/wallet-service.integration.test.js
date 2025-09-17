import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import walletService from '../wallet-service.js'

// Mock axios for integration tests
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
}

vi.mock('../axios.jsx', () => ({
  default: mockAxiosInstance
}))

describe('WalletService Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('End-to-End Wallet Operations', () => {
    it('should complete a full customer credit slip workflow', async () => {
      // Step 1: Search for customer
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          customer: {
            customer_id: 'CUST001',
            customer_name: 'John Doe',
            phone: '+255123456789'
          }
        }
      })

      const customerResult = await walletService.searchCustomer('CUST001')
      expect(customerResult.success).toBe(true)
      expect(customerResult.customer.customer_id).toBe('CUST001')

      // Step 2: Get customer balance
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          balance: {
            customer_id: 'CUST001',
            wallet_cents: 50000,
            outstanding_cents: 0,
            open_slips_count: 0
          }
        }
      })

      const balanceResult = await walletService.getCustomerBalance('CUST001')
      expect(balanceResult.success).toBe(true)
      expect(balanceResult.balance.wallet_cents).toBe(50000)

      // Step 3: Create credit slip
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          slip_id: 'SLIP001',
          slip_number: 'CS-20240115-001',
          grand_total_cents: 150000
        }
      })

      const creditSlipData = {
        customer_id: 'CUST001',
        items: [
          { product_id: 'PROD001', quantity: 2, unit_price_cents: 75000 }
        ],
        currency: 'TZS'
      }

      const creditSlipResult = await walletService.createCreditSlip(creditSlipData)
      expect(creditSlipResult.success).toBe(true)
      expect(creditSlipResult.slip_id).toBe('SLIP001')

      // Step 4: Process payment
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          payment_id: 'PAY001',
          applied_total: 100000,
          wallet_topup: 0
        }
      })

      const paymentData = {
        customer_id: 'CUST001',
        amount_cents: 100000,
        payment_method: 'CASH',
        allocations: [
          { slip_id: 'SLIP001', amount_cents: 100000 }
        ]
      }

      const paymentResult = await walletService.processPayment(paymentData)
      expect(paymentResult.success).toBe(true)
      expect(paymentResult.applied_total).toBe(100000)

      // Step 5: Apply wallet balance to remaining slip amount
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          applied_cents: 50000,
          slip_status: 'CLOSED',
          remaining_slip_balance: 0
        }
      })

      const walletApplicationData = {
        slip_id: 'SLIP001',
        customer_id: 'CUST001',
        amount_cents: 50000
      }

      const walletResult = await walletService.applyWalletToSlip(walletApplicationData)
      expect(walletResult.success).toBe(true)
      expect(walletResult.slip_status).toBe('CLOSED')

      // Verify all API calls were made correctly
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2)
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3)
    })

    it('should handle change storage and wallet application workflow', async () => {
      // Step 1: Store customer change
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          wallet_added: 25000
        }
      })

      const changeData = {
        customer_id: 'CUST001',
        amount_cents: 25000,
        currency: 'TZS'
      }

      const changeResult = await walletService.storeChange(changeData)
      expect(changeResult.success).toBe(true)
      expect(changeResult.wallet_added).toBe(25000)

      // Step 2: Get updated balance
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          balance: {
            customer_id: 'CUST001',
            wallet_cents: 75000, // Previous 50000 + 25000
            outstanding_cents: 0,
            open_slips_count: 0
          }
        }
      })

      const updatedBalanceResult = await walletService.getCustomerBalance('CUST001')
      expect(updatedBalanceResult.success).toBe(true)
      expect(updatedBalanceResult.balance.wallet_cents).toBe(75000)

      // Step 3: Get transaction history
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          entries: [
            {
              entry_id: 'TXN001',
              entry_type: 'CHANGE_STORED',
              direction: 'CREDIT',
              amount_cents: 25000,
              description: 'Change stored as wallet balance',
              occurred_at: '2024-01-15T10:35:00Z'
            }
          ],
          pagination: {
            page: 1,
            per_page: 20,
            total_pages: 1,
            total_entries: 1
          }
        }
      })

      const historyResult = await walletService.getTransactionHistory('CUST001')
      expect(historyResult.success).toBe(true)
      expect(historyResult.entries).toHaveLength(1)
      expect(historyResult.entries[0].entry_type).toBe('CHANGE_STORED')
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        request: {}
      }

      mockAxiosInstance.get.mockRejectedValue(timeoutError)

      const result = await walletService.getCustomerBalance('CUST001')
      
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('TIMEOUT_ERROR')
      expect(result.error.isRetryable).toBe(true)
    })

    it('should handle server errors with retry logic', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      }

      // Mock the first call to fail, second to succeed
      mockAxiosInstance.get
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({
          data: {
            balance: {
              customer_id: 'CUST001',
              wallet_cents: 50000
            }
          }
        })

      const apiCall = () => walletService.getCustomerBalance('CUST001')
      const result = await walletService.executeWithRetry(apiCall, 1, 10)

      expect(result.success).toBe(true)
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2)
    })

    it('should handle validation errors appropriately', async () => {
      const validationError = {
        response: {
          status: 400,
          data: { message: 'VALIDATION_ERROR: Invalid customer ID format' }
        }
      }

      mockAxiosInstance.post.mockRejectedValue(validationError)

      const result = await walletService.createCreditSlip({
        customer_id: 'INVALID',
        items: []
      })

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.severity).toBe('warning')
      expect(result.error.isRetryable).toBe(false)
    })

    it('should handle insufficient balance errors', async () => {
      const insufficientBalanceError = {
        response: {
          status: 400,
          data: { message: 'INSUFFICIENT_WALLET_BALANCE' }
        }
      }

      mockAxiosInstance.post.mockRejectedValue(insufficientBalanceError)

      const result = await walletService.applyWalletToSlip({
        slip_id: 'SLIP001',
        customer_id: 'CUST001',
        amount_cents: 100000
      })

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('INSUFFICIENT_BALANCE')
      expect(result.error.message).toBe('Insufficient wallet balance for this operation')
    })
  })

  describe('API Response Formatting', () => {
    it('should format customer search response correctly', async () => {
      const mockResponse = {
        data: {
          customer: {
            customer_id: 'CUST001',
            customer_name: 'John Doe',
            phone: '+255123456789',
            email: 'john@example.com'
          }
        }
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await walletService.searchCustomer('CUST001')

      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        customer: mockResponse.data.customer
      })
    })

    it('should format payment response correctly', async () => {
      const mockResponse = {
        data: {
          payment_id: 'PAY001',
          applied_total: 150000,
          wallet_topup: 50000,
          allocations: [
            { slip_id: 'SLIP001', amount_cents: 100000 }
          ]
        }
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await walletService.processPayment({
        customer_id: 'CUST001',
        amount_cents: 150000
      })

      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        payment_id: 'PAY001',
        applied_total: 150000,
        wallet_topup: 50000
      })
    })

    it('should format transaction history response correctly', async () => {
      const mockResponse = {
        data: {
          entries: [
            {
              entry_id: 'TXN001',
              entry_type: 'PAYMENT',
              amount_cents: 50000
            }
          ],
          pagination: {
            page: 1,
            per_page: 20,
            total_pages: 1,
            total_entries: 1
          }
        }
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await walletService.getTransactionHistory('CUST001')

      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        entries: mockResponse.data.entries,
        pagination: mockResponse.data.pagination
      })
    })
  })

  describe('Audit Trail Integration', () => {
    it('should fetch audit trail with filters', async () => {
      const mockResponse = {
        data: {
          entries: [
            {
              entry_id: 'AUDIT001',
              operation_type: 'PAYMENT',
              customer_id: 'CUST001',
              amount_cents: 50000,
              staff_member: 'John Staff',
              timestamp: '2024-01-15T10:35:00Z'
            }
          ],
          pagination: {
            page: 1,
            per_page: 50,
            total_pages: 1,
            total_entries: 1
          }
        }
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const filters = {
        page: 1,
        perPage: 50,
        customerId: 'CUST001',
        operationType: 'PAYMENT',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      }

      const result = await walletService.getAuditTrail(filters)

      expect(result.success).toBe(true)
      expect(result.entries).toHaveLength(1)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/wallet/audit-trail', {
        params: {
          page: 1,
          per_page: 50,
          customer_id: 'CUST001',
          operation_type: 'PAYMENT',
          start_date: '2024-01-01',
          end_date: '2024-01-31'
        }
      })
    })
  })

  describe('Product Integration', () => {
    it('should fetch products for credit slip creation', async () => {
      const mockResponse = {
        data: {
          respBody: {
            items: [
              {
                product_id: 'PROD001',
                name: 'Espresso',
                price_cents: 300000,
                category: 'Coffee'
              },
              {
                product_id: 'PROD002',
                name: 'Cappuccino',
                price_cents: 450000,
                category: 'Coffee'
              }
            ]
          }
        }
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await walletService.getAllProducts()

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(2)
      expect(result.items[0].name).toBe('Espresso')
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/products/all')
    })

    it('should handle empty product list', async () => {
      const mockResponse = {
        data: {
          respBody: {
            items: []
          }
        }
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await walletService.getAllProducts()

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(0)
    })
  })
})