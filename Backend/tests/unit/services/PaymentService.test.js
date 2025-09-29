import { jest } from '@jest/globals';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase, createTestPayment, createTestPaymentRecord } from '../../setup.js';

// Create mock instances that will be returned by the service constructors
const mockPaystackService = {
  initializePayment: jest.fn(),
  verifyPayment: jest.fn(),
};

const mockFlutterwaveService = {
  initializePayment: jest.fn(),
  verifyPayment: jest.fn(),
};

// Mock PaystackService
jest.unstable_mockModule('../../../services/PaystackService.js', () => ({
  PaystackService: jest.fn().mockImplementation(() => mockPaystackService)
}));

// Mock FlutterwaveService
jest.unstable_mockModule('../../../services/FlutterwaveService.js', () => ({
  FlutterwaveService: jest.fn().mockImplementation(() => mockFlutterwaveService)
}));

// Import after mocking
const { PaystackService } = await import('../../../services/PaystackService.js');
const { FlutterwaveService } = await import('../../../services/FlutterwaveService.js');
const { PaymentService } = await import('../../../services/PaymentService.js');

describe('PaymentService', () => {
  let paymentService;
  let paymentRepository;

  beforeAll(async () => {
    const testDb = await setupTestDatabase();
    paymentRepository = testDb.paymentRepository;
    paymentService = new PaymentService(paymentRepository);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create NGN payment using Paystack', async () => {
      const testPaymentData = createTestPayment({ currency: 'NGN' });

      // Mock repository save
      jest.spyOn(paymentRepository, 'createPayment').mockResolvedValue({
        success: true,
        id: 'payment-123'
      });

      jest.spyOn(paymentRepository, 'updatePayment').mockResolvedValue({
        success: true
      });

      // Mock Paystack response using the mock instance
      mockPaystackService.initializePayment.mockResolvedValue({
        success: true,
        data: {
          authorizationUrl: 'https://checkout.paystack.com/test',
          reference: 'PAY_TEST123',
          accessCode: 'access_code'
        }
      });

      const result = await paymentService.createPayment(testPaymentData);

      expect(result.success).toBe(true);
      expect(result.data.provider).toBe('paystack');
      expect(mockPaystackService.initializePayment).toHaveBeenCalled();
      expect(mockFlutterwaveService.initializePayment).not.toHaveBeenCalled();
    });

    it('should create USD payment using Flutterwave', async () => {
      const testPaymentData = createTestPayment({ currency: 'USD' });

      jest.spyOn(paymentRepository, 'createPayment').mockResolvedValue({
        success: true,
        id: 'payment-123'
      });

      jest.spyOn(paymentRepository, 'updatePayment').mockResolvedValue({
        success: true
      });

      // Mock Flutterwave response using the mock instance
      mockFlutterwaveService.initializePayment.mockResolvedValue({
        success: true,
        data: {
          authorizationUrl: 'https://checkout.flutterwave.com/test',
          reference: 'PAY_TEST123',
          flwRef: 'flw_ref'
        }
      });

      const result = await paymentService.createPayment(testPaymentData);

      expect(result.success).toBe(true);
      expect(result.data.provider).toBe('flutterwave');
      expect(mockFlutterwaveService.initializePayment).toHaveBeenCalled();
      expect(mockPaystackService.initializePayment).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const invalidPaymentData = { amount: -100, email: 'invalid-email' };

      const result = await paymentService.createPayment(invalidPaymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.details).toContain('Amount must be a positive number.');
    });

    it('should handle provider initialization failure', async () => {
      const testPaymentData = createTestPayment();

      jest.spyOn(paymentRepository, 'createPayment').mockResolvedValue({
        success: true,
        id: 'payment-123'
      });

      jest.spyOn(paymentRepository, 'updatePayment').mockResolvedValue({
        success: true
      });

      // Mock provider failure using the mock instance
      mockPaystackService.initializePayment.mockResolvedValue({
        success: false,
        error: 'Invalid API key'
      });

      const result = await paymentService.createPayment(testPaymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment initialization failed');
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      const testPayment = createTestPaymentRecord({ 
        reference: 'PAY_TEST123',
        provider: 'paystack',
        status: 'initialized' 
      });

      jest.spyOn(paymentRepository, 'findPaymentByReference').mockResolvedValue({
        success: true,
        data: testPayment
      });

      jest.spyOn(paymentRepository, 'updatePayment').mockResolvedValue({
        success: true
      });

      // Mock verification response using the mock instance
      mockPaystackService.verifyPayment.mockResolvedValue({
        success: true,
        data: {
          status: 'completed',
          reference: 'PAY_TEST123',
          amount: 1000,
          paidAt: '2023-01-01T00:00:00Z'
        }
      });

      const result = await paymentService.verifyPayment('PAY_TEST123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');
      expect(mockPaystackService.verifyPayment).toHaveBeenCalledWith('PAY_TEST123');
    });

    it('should return early if payment already completed', async () => {
      const testPayment = createTestPaymentRecord({ 
        reference: 'PAY_TEST123',
        status: 'completed' 
      });

      jest.spyOn(paymentRepository, 'findPaymentByReference').mockResolvedValue({
        success: true,
        data: testPayment
      });

      const result = await paymentService.verifyPayment('PAY_TEST123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');
      expect(mockPaystackService.verifyPayment).not.toHaveBeenCalled();
    });

    it('should handle payment not found', async () => {
      jest.spyOn(paymentRepository, 'findPaymentByReference').mockResolvedValue({
        success: false,
        data: null
      });

      const result = await paymentService.verifyPayment('NON_EXISTENT');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment not found');
    });
  });

  describe('selectPaymentProvider', () => {
    it('should select Paystack for NGN', () => {
      const provider = paymentService.selectPaymentProvider('NGN');
      expect(provider).toBe('paystack');
    });

    it('should select Flutterwave for USD', () => {
      const provider = paymentService.selectPaymentProvider('USD');
      expect(provider).toBe('flutterwave');
    });

    it('should select Flutterwave for GHS', () => {
      const provider = paymentService.selectPaymentProvider('GHS');
      expect(provider).toBe('flutterwave');
    });

    it('should select Flutterwave for KES', () => {
      const provider = paymentService.selectPaymentProvider('KES');
      expect(provider).toBe('flutterwave');
    });
  });
});