import { Payment } from '../models/Payment.js';
import { PaystackService } from './PaystackService.js';
import { FlutterwaveService } from './FlutterwaveService.js';

export class PaymentService {
  constructor(paymentRepository) {
    this.paymentRepository = paymentRepository;
    this.paystackService = new PaystackService();
    this.flutterwaveService = new FlutterwaveService();
  }

  /**
   * Create a new payment
   * Logic: NGN -> Paystack, Other currencies -> Flutterwave
   */
  async createPayment(paymentData) {
    try {
      // 1. Validate payment data
      const validation = Payment.validate(paymentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        };
      }

      // 2. Create payment object
      const payment = new Payment(paymentData);

      // 3. Determine payment provider based on currency
      const provider = this.selectPaymentProvider(payment.currency);
      payment.provider = provider;

      // 4. Save payment to database (status: pending)
      const saveResult = await this.paymentRepository.createPayment(payment.toJSON());
      if (!saveResult.success) {
        return {
          success: false,
          error: 'Failed to save payment to database',
          details: saveResult.error
        };
      }

      // 5. Initialize payment with selected provider
      let providerResponse;
      if (provider === 'paystack') {
        providerResponse = await this.paystackService.initializePayment(payment);
      } else {
        providerResponse = await this.flutterwaveService.initializePayment(payment);
      }

      // 6. Handle provider response
      if (!providerResponse.success) {
        // Update payment status to failed
        await this.paymentRepository.updatePayment(payment.id, {
          status: 'failed',
          error: providerResponse.error
        });

        return {
          success: false,
          error: 'Payment initialization failed',
          details: providerResponse.error
        };
      }

      // 7. Update payment with provider response data
      const updateData = {
        authorizationUrl: providerResponse.data.authorizationUrl,
        providerReference: providerResponse.data.reference || providerResponse.data.accessCode,
        status: 'initialized'
      };

      await this.paymentRepository.updatePayment(payment.id, updateData);

      // 8. Return success response
      return {
        success: true,
        data: {
          id: payment.id,
          reference: payment.reference,
          authorizationUrl: providerResponse.data.authorizationUrl,
          amount: payment.amount,
          currency: payment.currency,
          provider: payment.provider,
          status: 'initialized'
        }
      };

    } catch (error) {
      console.error('PaymentService.createPayment error:', error);
      return {
        success: false,
        error: 'Internal server error',
        details: error.message
      };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(reference) {
    try {
      // 1. Find payment in database
      const paymentResult = await this.paymentRepository.findPaymentByReference(reference);
      if (!paymentResult.success || !paymentResult.data) {
        return {
          success: false,
          error: 'Payment not found'
        };
      }

      const payment = paymentResult.data;

      // 2. Skip verification if already completed
      if (payment.status === 'completed') {
        return {
          success: true,
          data: {
            id: payment.id,
            reference: payment.reference,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            provider: payment.provider
          }
        };
      }

      // 3. Verify with payment provider
      let verificationResponse;
      if (payment.provider === 'paystack') {
        verificationResponse = await this.paystackService.verifyPayment(reference);
      } else {
        verificationResponse = await this.flutterwaveService.verifyPayment(reference);
      }

      // 4. Handle verification response
      if (!verificationResponse.success) {
        return {
          success: false,
          error: 'Payment verification failed',
          details: verificationResponse.error
        };
      }

      // 5. Update payment status in database
      const updateData = {
        status: verificationResponse.data.status,
        verifiedAt: new Date()
      };

      if (verificationResponse.data.paidAt) {
        updateData.paidAt = new Date(verificationResponse.data.paidAt);
      }

      await this.paymentRepository.updatePayment(payment.id, updateData);

      // 6. Return verification result
      return {
        success: true,
        data: {
          id: payment.id,
          reference: payment.reference,
          status: verificationResponse.data.status,
          amount: payment.amount,
          currency: payment.currency,
          provider: payment.provider,
          verifiedAt: updateData.verifiedAt,
          paidAt: updateData.paidAt
        }
      };

    } catch (error) {
      console.error('PaymentService.verifyPayment error:', error);
      return {
        success: false,
        error: 'Internal server error',
        details: error.message
      };
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId) {
    try {
      const result = await this.paymentRepository.findPaymentById(paymentId);
      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'Payment not found'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('PaymentService.getPayment error:', error);
      return {
        success: false,
        error: 'Internal server error',
        details: error.message
      };
    }
  }

  /**
   * Get all payments with pagination
   */
  async getAllPayments(limit = 10, skip = 0) {
    try {
      const result = await this.paymentRepository.getAllPayments(limit, skip);
      return result;
    } catch (error) {
      console.error('PaymentService.getAllPayments error:', error);
      return {
        success: false,
        error: 'Internal server error',
        details: error.message
      };
    }
  }

  /**
   * Select payment provider based on currency
   * NGN -> Paystack
   * Others -> Flutterwave
   */
  selectPaymentProvider(currency) {
    if (currency === 'NGN') {
      return 'paystack';
    }
    return 'flutterwave';
  }

  /**
   * Get payments by email
   */
  async getPaymentsByEmail(email, limit = 10) {
    try {
      const result = await this.paymentRepository.findPaymentsByEmail(email, limit);
      return result;
    } catch (error) {
      console.error('PaymentService.getPaymentsByEmail error:', error);
      return {
        success: false,
        error: 'Internal server error',
        details: error.message
      };
    }
  }

  /**
   * Get payments by status
   */
  async getPaymentsByStatus(status, limit = 10) {
    try {
      const result = await this.paymentRepository.findPaymentsByStatus(status, limit);
      return result;
    } catch (error) {
      console.error('PaymentService.getPaymentsByStatus error:', error);
      return {
        success: false,
        error: 'Internal server error',
        details: error.message
      };
    }
  }
}