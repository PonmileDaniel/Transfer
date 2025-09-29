import { jest } from '@jest/globals';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase, createTestPayment } from '../../setup.js';

// Mock the PaymentService module
const mockCreatePayment = jest.fn();
const mockVerifyPayment = jest.fn();
const mockGetAllPayments = jest.fn();
const mockGetPaymentsByEmail = jest.fn();
const mockGetPaymentsByStatus = jest.fn();

// Mock PaymentService class
jest.unstable_mockModule('../../../services/PaymentService.js', () => ({
  PaymentService: jest.fn().mockImplementation(() => ({
    createPayment: mockCreatePayment,
    verifyPayment: mockVerifyPayment,
    getAllPayments: mockGetAllPayments,
    getPaymentsByEmail: mockGetPaymentsByEmail,
    getPaymentsByStatus: mockGetPaymentsByStatus,
  }))
}));

// Import modules after mocking
const { PaymentController } = await import('../../../controllers/paymentControllers.js');
const { PaymentService } = await import('../../../services/PaymentService.js');

describe('PaymentController', () => {
  let paymentController;
  let mockReq;
  let mockRes;
  let mockNext;
  let paymentRepository;

  beforeAll(async () => {
    const testDb = await setupTestDatabase();
    paymentRepository = testDb.paymentRepository;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    
    paymentController = new PaymentController();
    
    // Mock request and response objects
    mockReq = {
      body: {},
      params: {},
      query: {},
      app: {
        locals: {
          paymentRepository
        }
      }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const testPaymentData = createTestPayment();
      mockReq.body = testPaymentData;

      const mockServiceResponse = {
        success: true,
        data: {
          id: 'payment-123',
          reference: 'PAY_TEST123',
          authorizationUrl: 'https://checkout.paystack.com/test',
          amount: 1000,
          currency: 'NGN',
          provider: 'paystack',
          status: 'initialized'
        }
      };

      mockCreatePayment.mockResolvedValue(mockServiceResponse);

      await paymentController.createPayment(mockReq, mockRes);

      expect(mockCreatePayment).toHaveBeenCalledWith(testPaymentData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment created successfully',
        data: mockServiceResponse.data
      });
    });

    it('should handle payment creation failure', async () => {
      const testPaymentData = createTestPayment();
      mockReq.body = testPaymentData;

      const mockServiceResponse = {
        success: false,
        error: 'Payment initialization failed',
        details: 'Invalid API key'
      };

      mockCreatePayment.mockResolvedValue(mockServiceResponse);

      await paymentController.createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment initialization failed',
        details: 'Invalid API key'
      });
    });

    it('should handle internal server errors', async () => {
      const testPaymentData = createTestPayment();
      mockReq.body = testPaymentData;

      mockCreatePayment.mockRejectedValue(new Error('Database error'));

      await paymentController.createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Database error'
      });
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      mockReq.params = { reference: 'PAY_TEST123' };

      const mockServiceResponse = {
        success: true,
        data: {
          id: 'payment-123',
          reference: 'PAY_TEST123',
          status: 'completed',
          amount: 1000,
          currency: 'NGN',
          provider: 'paystack'
        }
      };

      mockVerifyPayment.mockResolvedValue(mockServiceResponse);

      await paymentController.verifyPayment(mockReq, mockRes);

      expect(mockVerifyPayment).toHaveBeenCalledWith('PAY_TEST123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment verified successfully',
        data: mockServiceResponse.data
      });
    });
  });

  describe('getAllPayments', () => {
    it('should get all payments with default pagination', async () => {
      mockReq.query = {};

      const mockServiceResponse = {
        success: true,
        data: [createTestPayment()],
        total: 1
      };

      mockGetAllPayments.mockResolvedValue(mockServiceResponse);

      await paymentController.getAllPayments(mockReq, mockRes);

      expect(mockGetAllPayments).toHaveBeenCalledWith(10, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should get all payments with custom pagination', async () => {
      mockReq.query = { limit: '20', skip: '10' };

      const mockServiceResponse = {
        success: true,
        data: [],
        total: 0
      };

      mockGetAllPayments.mockResolvedValue(mockServiceResponse);

      await paymentController.getAllPayments(mockReq, mockRes);

      expect(mockGetAllPayments).toHaveBeenCalledWith(20, 10);
    });
  });

  describe('getPaymentsByStatus', () => {
    it('should get payments by valid status', async () => {
      mockReq.params = { status: 'completed' };
      mockReq.query = { limit: '5' };

      const mockServiceResponse = {
        success: true,
        data: [createTestPayment()]
      };

      mockGetPaymentsByStatus.mockResolvedValue(mockServiceResponse);

      await paymentController.getPaymentsByStatus(mockReq, mockRes);

      expect(mockGetPaymentsByStatus).toHaveBeenCalledWith('completed', 5);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should reject invalid status', async () => {
      mockReq.params = { status: 'invalid_status' };

      await paymentController.getPaymentsByStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid status',
        validStatuses: ['pending', 'initialized', 'completed', 'failed']
      });
    });
  });

  describe('getPaymentsByEmail', () => {
    it('should get payments by email', async () => {
      mockReq.params = { email: 'test@example.com' };
      mockReq.query = { limit: '15' };

      const mockServiceResponse = {
        success: true,
        data: [createTestPayment()]
      };

      mockGetPaymentsByEmail.mockResolvedValue(mockServiceResponse);

      await paymentController.getPaymentsByEmail(mockReq, mockRes);

      expect(mockGetPaymentsByEmail).toHaveBeenCalledWith('test@example.com', 15);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});