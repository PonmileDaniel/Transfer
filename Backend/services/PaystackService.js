import axios from 'axios';

export class PaystackService {
  constructor() {
    this.baseURL = 'https://api.paystack.co';
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
  }

  /**
   * Initialize payment with Paystack
   * @param {Payment} payment 
   * @returns {Object} { success: boolean, authorizationUrl?: string, reference?: string, error?: string }
   */
  async initializePayment(payment) {
    try {
      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        {
          email: payment.email,
          amount: payment.amount * 100, // Convert to kobo (Paystack expects kobo)
          currency: payment.currency,
          reference: payment.reference,
          metadata: {
            paymentId: payment.id,
            ...payment.metadata
          },
          callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === true) {
        return {
          success: true,
          data: {
            authorizationUrl: response.data.data.authorization_url,
            accessCode: response.data.data.access_code,
            reference: response.data.data.reference
          }
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Payment initialization failed'
        };
      }

    } catch (error) {
      console.error('PaystackService.initializePayment error:', error);
      
      if (error.response) {
        // Paystack API error
        return {
          success: false,
          error: error.response.data.message || 'Paystack API error'
        };
      } else if (error.request) {
        // Network error
        return {
          success: false,
          error: 'Network error - Unable to connect to Paystack'
        };
      } else {
        // Other error
        return {
          success: false,
          error: error.message || 'Unknown error occurred'
        };
      }
    }
  }

  /**
   * Verify payment with Paystack
   */
  async verifyPayment(reference) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === true) {
        const data = response.data.data;
        
        return {
          success: true,
          data: {
            status: data.status === 'success' ? 'completed' : 'failed',
            reference: data.reference,
            amount: data.amount / 100, // Convert from kobo back to naira
            currency: data.currency,
            paidAt: data.paid_at,
            channel: data.channel,
            fees: data.fees / 100, // Convert fees from kobo
            customer: {
              email: data.customer.email,
              phone: data.customer.phone
            },
            authorization: {
              authorizationCode: data.authorization.authorization_code,
              bin: data.authorization.bin,
              last4: data.authorization.last4,
              cardType: data.authorization.card_type,
              bank: data.authorization.bank
            }
          }
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Payment verification failed'
        };
      }

    } catch (error) {
      console.error('PaystackService.verifyPayment error:', error);
      
      if (error.response) {
        // Paystack API error
        return {
          success: false,
          error: error.response.data.message || 'Paystack verification error'
        };
      } else if (error.request) {
        // Network error
        return {
          success: false,
          error: 'Network error - Unable to connect to Paystack'
        };
      } else {
        // Other error
        return {
          success: false,
          error: error.message || 'Unknown error occurred'
        };
      }
    }
  }

  /**
   * List transactions from Paystack
   */
  async listTransactions(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        perPage: params.perPage || 50,
        page: params.page || 1,
        ...params
      });

      const response = await axios.get(
        `${this.baseURL}/transaction?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === true) {
        return {
          success: true,
          data: response.data.data,
          meta: response.data.meta
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to fetch transactions'
        };
      }

    } catch (error) {
      console.error('PaystackService.listTransactions error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get transaction details from Paystack
   */
  async getTransaction(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === true) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Transaction not found'
        };
      }

    } catch (error) {
      console.error('PaystackService.getTransaction error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Validate Paystack webhook signature
   */
  validateWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Process webhook from Paystack
   */
  async processWebhook(payload, signature) {
    try {
      // Validate webhook signature
      if (!this.validateWebhookSignature(payload, signature)) {
        return {
          success: false,
          error: 'Invalid webhook signature'
        };
      }

      const event = payload.event;
      const data = payload.data;

      switch (event) {
        case 'charge.success':
          return {
            success: true,
            event: 'payment_completed',
            data: {
              reference: data.reference,
              status: 'completed',
              amount: data.amount / 100,
              currency: data.currency,
              paidAt: data.paid_at
            }
          };

        case 'charge.failed':
          return {
            success: true,
            event: 'payment_failed',
            data: {
              reference: data.reference,
              status: 'failed',
              amount: data.amount / 100,
              currency: data.currency
            }
          };

        default:
          return {
            success: true,
            event: 'unhandled',
            data: payload
          };
      }

    } catch (error) {
      console.error('PaystackService.processWebhook error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}