import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import walletService from '../wallet-service.js'
import { mockAxiosInstance, mockWalletResponses } from '../../test/utils.jsx'

// Mock axios
vi.mock('../axios.jsx', () => ({
  default: mockAxiosInstance
}))

describe('WalletService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createCreditSlip', () => {
    it('should create credit slip successfully', async () => {
      const mockResponse = {
        data: {
          slip_id: '65a1b2c3d4e5f6789012345',
          slip_number: 'CS-20240115103000-A1B2C3D4',
          grand_total_cents: 350000
        }
      }
      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const creditSlipData = {
        customer_id: 'CUST001',
        items: [
          { product_id: 'PROD001', quantity: 2, unit_price_cents: 150000 },
          { product_id: 'PROD002', quantity: 1, unit_price_cents: 50000 }
        ],
        currency: 'TZS'
      }

      const result = await walletService.createCreditSlip(creditSlipData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/wallet/credit-slips', creditSlipData)
      expect(result.success).toBe(true)
      expect(result.slip_id).toBe('65a1b2c3d4e5f6789012345')
      expect(result.slip_number).toBe('CS-20240115103000-A1B2C3D4')
      expect(result.grand_total_cents).toBe(350000)
    })

    it('should handle credit slip creation errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'VALIDATION_ERROR: Invalid customer ID' }
        }
      }
      mockAxiosInstance.post.mockRejectedValue(mockError)

      const result = await walletService.createCreditSlip({})

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.severity).toBe('warning')
    })
  })

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const mockResponse = {
        data: {
          payment_id: 'PAY-123456',
          applied_total: 500000,
          wallet_topup: 150000
        }
      }
      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const paymentData = {
        customer_id: 'CUST001',
        amount_cents: 500000,
        payment_method: 'CASH',
        allocations: []
      }

      const result = await walletService.processPayment(paymentData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/wallet/payments', paymentData)
      expect(result.success).toBe(true)
      expect(result.payment_id).toBe('PAY-123456')
      expect(result.applied_total).toBe(500000)
      expect(result.wallet_topup).toBe(150000)
    })

    it('should handle insufficient balance errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'INSUFFICIENT_WALLET_BALANCE' }
        }
      }
      mockAxiosInstance.post.mockRejectedValue(mockError)

      const result = await walletService.processPayment({})

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('INSUFFICIENT_BALANCE')
      expect(result.error.message).toBe('Insufficient wallet balance for this operation')
    })
  })

  describe('applyWalletToSlip', () => {
    it('should apply wallet to slip successfully', async () => {
      const mockResponse = {
        data: {
          applied_cents: 100000,
          slip_status: 'CLOSED',
          remaining_slip_balance: 0
        }
      }
      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const walletData = {
        slip_id: 'SLIP001',
        customer_id: 'CUST001',
        amount_cents: 100000
      }

      const result = await walletService.applyWalletToSlip(walletData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/wallet/apply-wallet', walletData)
      expect(result.success).toBe(true)
      expect(result.applied_cents).toBe(100000)
      expect(result.slip_status).toBe('CLOSED')
    })
  })

  describe('storeChange', () => {
    it('should store change successfully', async () => {
      const mockResponse = {
        data: {
          wallet_added: 50000
        }
      }
      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const changeData = {
        customer_id: 'CUST001',
        amount_cents: 50000,
        currency: 'TZS'
      }

      const result = await walletService.storeChange(changeData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/wallet/store-change', changeData)
      expect(result.success).toBe(true)
      expect(result.wallet_added).toBe(50000)
    })
  })

  describe('getCustomerBalance', () => {
    it('should get customer balance successfully', async () => {
      const mockResponse = {
        data: {
          balance: {
            customer_id: 'CUST001',
            wallet_cents: 75000,
            outstanding_cents: 0
          }
        }
      }
      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await walletService.getCustomerBalance('CUST001')

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/wallet/balance/CUST001', { params: { currency: 'TZS' } })
      expect(result.success).toBe(true)
      expect(result.balance.customer_id).toBe('CUST001')
    })

    it('should handle customer not found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'CUSTOMER_ACCOUNT_NOT_FOUND' }
        }
      }
      mockAxiosInstance.get.mockRejectedValue(mockError)

      const result = await walletService.getCustomerBalance('INVALID')

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('CUSTOMER_NOT_FOUND')
      expect(result.error.message).toBe('Customer not found')
    })
  })

  describe('getOpenCreditSlips', () => {
    it('should get open credit slips successfully', async () => {
      const mockResponse = {
        data: {
          slips: [
            {
              slip_id: 'SLIP001',
              slip_number: 'CS-001',
              remaining_cents: 100000
            }
          ],
          slips_count: 1
        }
      }
      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await walletService.getOpenCreditSlips('CUST001')

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/wallet/slips/CUST001', { params: { currency: 'TZS' } })
      expect(result.success).toBe(true)
      expect(result.slips).toHaveLength(1)
      expect(result.slips_count).toBe(1)
    })
  })

  describe('getTransactionHistory', () => {
    it('should get transaction history successfully', async () => {
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
            total_pages: 1
          }
        }
      }
      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await walletService.getTransactionHistory('CUST001', 'TZS', 1, 20)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/wallet/history/CUST001', {
        params: { currency: 'TZS', page: 1, per_page: 20 }
      })
      expect(result.success).toBe(true)
      expect(result.entries).toHaveLength(1)
      expect(result.pagination.page).toBe(1)
    })
  })

  describe('getAuditTrail', () => {
    it('should get audit trail successfully', async () => {
      const mockResponse = {
        data: {
          entries: [
            {
              entry_id: 'AUDIT001',
              operation_type: 'PAYMENT',
              staff_member: 'John Doe'
            }
          ],
          pagination: {
            page: 1,
            per_page: 50
          }
        }
      }
      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const filters = {
        page: 1,
        perPage: 50,
        customerId: 'CUST001'
      }

      const result = await walletService.getAuditTrail(filters)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/wallet/audit-trail', {
        params: {
          page: 1,
          per_page: 50,
          customer_id: 'CUST001'
        }
      })
      expect(result.success).toBe(true)
      expect(result.entries).toHaveLength(1)
    })
  })

  describe('searchCustomer', () => {
    it('should search customer successfully', async () => {
      const mockResponse = {
        data: {
          customer: {
            customer_id: 'CUST001',
            customer_name: 'John Doe'
          }
        }
      }
      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await walletService.searchCustomer('CUST001')

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/customers/search?id=CUST001')
      expect(result.success).toBe(true)
      expect(result.customer.customer_id).toBe('CUST001')
    })
  })

  describe('getAllProducts', () => {
    it('should get all products successfully', async () => {
      const mockResponse = {
        data: {
          respBody: {
            items: [
              { product_id: 'PROD001', name: 'Coffee', price_cents: 500 }
            ]
          }
        }
      }
      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await walletService.getAllProducts()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/products/all')
      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(1)
    })
  })

  describe('handleError', () => {
    it('should handle network errors', () => {
      const networkError = {
        request: {},
        code: 'ECONNABORTED'
      }

      const result = walletService.handleError(networkError, 'Default message')

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('TIMEOUT_ERROR')
      expect(result.error.isRetryable).toBe(true)
      expect(result.error.message).toBe('Request timeout. Please check your connection and try again')
    })

    it('should handle server errors', () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      }

      const result = walletService.handleError(serverError, 'Default message')

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('SERVER_ERROR')
      expect(result.error.isRetryable).toBe(true)
      expect(result.error.severity).toBe('error')
    })

    it('should handle authentication errors', () => {
      const authError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      }

      const result = walletService.handleError(authError, 'Default message')

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('SESSION_EXPIRED')
      expect(result.error.message).toBe('Your session has expired. Please log in again')
    })
  })

  describe('executeWithRetry', () => {
    it('should execute API call successfully on first try', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ success: true })

      const result = await walletService.executeWithRetry(mockApiCall, 3, 100)

      expect(mockApiCall).toHaveBeenCalledTimes(1)
      expect(result.success).toBe(true)
    })

    it('should retry on retryable errors', async () => {
      const retryableError = {
        response: { status: 500 }
      }
      const mockApiCall = vi.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue({ success: true })

      const result = await walletService.executeWithRetry(mockApiCall, 3, 10)

      expect(mockApiCall).toHaveBeenCalledTimes(3)
      expect(result.success).toBe(true)
    })

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = {
        response: { status: 400, data: { message: 'Bad request' } }
      }
      const mockApiCall = vi.fn().mockRejectedValue(nonRetryableError)

      await expect(walletService.executeWithRetry(mockApiCall, 3, 10)).rejects.toThrow()
      expect(mockApiCall).toHaveBeenCalledTimes(1)
    })

    it('should throw after max retries', async () => {
      const retryableError = {
        response: { status: 500 }
      }
      const mockApiCall = vi.fn().mockRejectedValue(retryableError)

      await expect(walletService.executeWithRetry(mockApiCall, 2, 10)).rejects.toThrow()
      expect(mockApiCall).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })
})