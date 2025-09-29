import { jest } from '@jest/globals';
import { validatePaymentData } from '../../../utils/validation.js';

describe('Payment Validation', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Create mock request object
    mockReq = {
      body: {},
      params: {},
      query: {},
      headers: {}
    };

    // Create mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Create mock next function
    mockNext = jest.fn();
  });

  describe('Valid data', () => {
    it('should pass validation with complete valid data', () => {
      mockReq.body = {
        amount: 1000,
        currency: 'NGN',
        email: 'test@example.com',
        metadata: { customerName: 'Test User' }
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should set default currency to NGN when not provided', () => {
      mockReq.body = {
        amount: 1000,
        email: 'test@example.com'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockReq.body.currency).toBe('NGN');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Invalid data', () => {
    it('should reject missing amount', () => {
      mockReq.body = {
        email: 'test@example.com'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining(['Amount is required'])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject negative amount', () => {
      mockReq.body = {
        amount: -100,
        email: 'test@example.com'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining(['Amount must be a positive number'])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid email', () => {
      mockReq.body = {
        amount: 1000,
        email: 'invalid-email'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining(['Please provide a valid email address'])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject unsupported currency', () => {
      mockReq.body = {
        amount: 1000,
        email: 'test@example.com',
        currency: 'EUR'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining(['\"currency\" must be one of [NGN, USD, GHS, KES]'])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple validation errors', () => {
      mockReq.body = {
        amount: -100,
        email: 'invalid-email'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          'Amount must be a positive number',
          'Please provide a valid email address'
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Currency validation', () => {
    it('should accept NGN currency', () => {
      mockReq.body = {
        amount: 1000,
        email: 'test@example.com',
        currency: 'NGN'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should accept USD currency', () => {
      mockReq.body = {
        amount: 1000,
        email: 'test@example.com',
        currency: 'USD'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should accept GHS currency', () => {
      mockReq.body = {
        amount: 1000,
        email: 'test@example.com',
        currency: 'GHS'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should accept KES currency', () => {
      mockReq.body = {
        amount: 1000,
        email: 'test@example.com',
        currency: 'KES'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request body', () => {
      mockReq.body = {};

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          'Amount is required',
          'Email is required'
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle zero amount', () => {
      mockReq.body = {
        amount: 0,
        email: 'test@example.com'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining(['Amount must be a positive number'])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle string amount', () => {
      mockReq.body = {
        amount: "not-a-number",
        email: 'test@example.com'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept optional metadata', () => {
      mockReq.body = {
        amount: 1000,
        email: 'test@example.com',
        metadata: {
          customerName: 'John Doe',
          orderId: '12345',
          customField: 'value'
        }
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should work without metadata', () => {
      mockReq.body = {
        amount: 1000,
        email: 'test@example.com'
      };

      validatePaymentData(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});