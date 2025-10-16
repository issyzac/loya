import customerWalletService from '../customer-wallet-service.js';
import walletService from '../wallet-service.js';

// Mock the wallet service
jest.mock('../wallet-service.js');

describe('CustomerWalletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    customerWalletService.setUser(null);
  });

  describe('Customer ID Resolution', () => {
    test('should resolve customer ID from user._id', () => {
      const user = { _id: '675ab2c25855c2ccc099e056', name: 'Test User' };
      customerWalletService.setUser(user);
      
      const result = customerWalletService.resolveCustomerId();
      
      expect(result.customerId).toBe('675ab2c25855c2ccc099e056');
      expect(result.error).toBeNull();
    });

    test('should resolve customer ID from user.customer_id', () => {
      const user = { customer_id: '675ab2c25855c2ccc099e056', name: 'Test User' };
      customerWalletService.setUser(user);
      
      const result = customerWalletService.resolveCustomerId();
      
      expect(result.customerId).toBe('675ab2c25855c2ccc099e056');
      expect(result.error).toBeNull();
    });

    test('should resolve customer ID from user.id', () => {
      const user = { id: '675ab2c25855c2ccc099e056', name: 'Test User' };
      customerWalletService.setUser(user);
      
      const result = customerWalletService.resolveCustomerId();
      
      expect(result.customerId).toBe('675ab2c25855c2ccc099e056');
      expect(result.error).toBeNull();
    });

    test('should resolve customer ID from user.user_id', () => {
      const user = { user_id: '675ab2c25855c2ccc099e056', name: 'Test User' };
      customerWalletService.setUser(user);
      
      const result = customerWalletService.resolveCustomerId();
      
      expect(result.customerId).toBe('675ab2c25855c2ccc099e056');
      expect(result.error).toBeNull();
    });

    test('should return error when no user is set', () => {
      const result = customerWalletService.resolveCustomerId();
      
      expect(result.customerId).toBeNull();
      expect(result.error).toBe('User not logged in');
    });

    test('should return error when user has no valid ID fields', () => {
      const user = { name: 'Test User', email: 'test@example.com' };
      customerWalletService.setUser(user);
      
      const result = customerWalletService.resolveCustomerId();
      
      expect(result.customerId).toBeNull();
      expect(result.error).toBe('Customer identification not available');
    });

    test('should validate customer ID format', () => {
      const user = { _id: 'invalid', name: 'Test User' };
      customerWalletService.setUser(user);
      
      const result = customerWalletService.resolveCustomerId();
      
      expect(result.customerId).toBeNull();
      expect(result.error).toBe('Customer identification not available');
    });

    test('should trim whitespace from customer ID', () => {
      const user = { _id: '  675ab2c25855c2ccc099e056  ', name: 'Test User' };
      customerWalletService.setUser(user);
      
      const result = customerWalletService.resolveCustomerId();
      
      expect(result.customerId).toBe('675ab2c25855c2ccc099e056');
      expect(result.error).toBeNull();
    });
  });

  describe('getMyBalance', () => {
    test('should return formatted balance when successful', async () => {
      const user = { _id: '675ab2c25855c2ccc099e056', name: 'Test User' };
      customerWalletService.setUser(user);

      const mockBalance = {
        wallet_cents: 150000,
        outstanding_cents: 50000,
        currency: 'TZS'
      };

      walletService.getCustomerBalance.mockResolvedValue({
        success: true,
        balance: mockBalance
      });

      const result = await customerWalletService.getMyBalance();

      expect(result.success).toBe(true);
      expect(result.balance.formatted_wallet_balance).toBe('TZS 1,500');
      expect(result.balance.formatted_outstanding_balance).toBe('TZS 500');
      expect(result.balance.formatted_net_balance).toBe('TZS 1,000');
      expect(result.balance.net_balance_cents).toBe(100000);
      expect(result.balance.has_available_credit).toBe(true);
      expect(result.balance.has_outstanding_bills).toBe(true);
    });

    test('should return error when customer ID is missing', async () => {
      const result = await customerWalletService.getMyBalance();

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CUSTOMER_ID_MISSING');
      expect(result.error.requiresAuth).toBe(true);
    });

    test('should handle wallet service errors', async () => {
      const user = { _id: '675ab2c25855c2ccc099e056', name: 'Test User' };
      customerWalletService.setUser(user);

      walletService.getCustomerBalance.mockResolvedValue({
        success: false,
        error: { message: 'Network error', code: 'NETWORK_ERROR' }
      });

      const result = await customerWalletService.getMyBalance();

      expect(result.success).toBe(false);
      expect(walletService.getCustomerBalance).toHaveBeenCalledWith('675ab2c25855c2ccc099e056', 'TZS');
    });
  });

  describe('getMyCreditSlipsSummary', () => {
    test('should return formatted credit slips summary', async () => {
      const user = { _id: '675ab2c25855c2ccc099e056', name: 'Test User' };
      customerWalletService.setUser(user);

      const mockSlips = [
        {
          slip_id: 'slip1',
          created_at: '2024-01-15T10:00:00Z',
          totals: { remaining_cents: 30000 }
        },
        {
          slip_id: 'slip2',
          created_at: '2024-01-16T10:00:00Z',
          totals: { remaining_cents: 20000 }
        }
      ];

      walletService.getOpenCreditSlips.mockResolvedValue({
        success: true,
        slips: mockSlips,
        slips_count: 2
      });

      const result = await customerWalletService.getMyCreditSlipsSummary();

      expect(result.success).toBe(true);
      expect(result.summary.count).toBe(2);
      expect(result.summary.total_amount_cents).toBe(50000);
      expect(result.summary.formatted_total_amount).toBe('TZS 500');
      expect(result.summary.has_outstanding_bills).toBe(true);
      expect(result.slips).toHaveLength(2);
      expect(result.slips[0].formatted_remaining_amount).toBe('TZS 300');
    });

    test('should handle empty credit slips', async () => {
      const user = { _id: '675ab2c25855c2ccc099e056', name: 'Test User' };
      customerWalletService.setUser(user);

      walletService.getOpenCreditSlips.mockResolvedValue({
        success: true,
        slips: [],
        slips_count: 0
      });

      const result = await customerWalletService.getMyCreditSlipsSummary();

      expect(result.success).toBe(true);
      expect(result.summary.count).toBe(0);
      expect(result.summary.total_amount_cents).toBe(0);
      expect(result.summary.has_outstanding_bills).toBe(false);
    });
  });

  describe('getBalanceStatus', () => {
    test('should return owed status when customer owes money', () => {
      const balance = {
        wallet_cents: 10000,
        outstanding_cents: 20000
      };

      const status = customerWalletService.getBalanceStatus(balance);

      expect(status.status).toBe('owed');
      expect(status.color).toBe('yellow');
      expect(status.priority).toBe('medium');
    });

    test('should return credit status when customer has available credit', () => {
      const balance = {
        wallet_cents: 20000,
        outstanding_cents: 10000
      };

      const status = customerWalletService.getBalanceStatus(balance);

      expect(status.status).toBe('credit');
      expect(status.color).toBe('green');
      expect(status.priority).toBe('low');
    });

    test('should return neutral status when balanced', () => {
      const balance = {
        wallet_cents: 10000,
        outstanding_cents: 10000
      };

      const status = customerWalletService.getBalanceStatus(balance);

      expect(status.status).toBe('neutral');
      expect(status.color).toBe('gray');
      expect(status.priority).toBe('low');
    });
  });

  describe('canAccessWallet', () => {
    test('should return true when customer ID is available', () => {
      const user = { _id: '675ab2c25855c2ccc099e056', name: 'Test User' };
      customerWalletService.setUser(user);

      expect(customerWalletService.canAccessWallet()).toBe(true);
    });

    test('should return false when customer ID is not available', () => {
      expect(customerWalletService.canAccessWallet()).toBe(false);
    });
  });

  describe('getCustomerInfo', () => {
    test('should return customer information when user is set', () => {
      const user = {
        _id: '675ab2c25855c2ccc099e056',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+255123456789'
      };
      customerWalletService.setUser(user);

      const info = customerWalletService.getCustomerInfo();

      expect(info.name).toBe('John Doe');
      expect(info.email).toBe('john@example.com');
      expect(info.phone).toBe('+255123456789');
      expect(info.isAuthenticated).toBe(true);
      expect(info.customerId).toBe('675ab2c25855c2ccc099e056');
    });

    test('should return guest information when no user is set', () => {
      const info = customerWalletService.getCustomerInfo();

      expect(info.name).toBe('Guest');
      expect(info.isAuthenticated).toBe(false);
    });
  });
});