import axios from "axios";

export class FlutterwaveService {
    constructor() {
        this.baseUrl = 'https://api.flutterwave.com/v3';
        this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
        this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
        this.encryptionKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
    }

    /**
     * Initialize payment with Flutterwave
     * @param payment
     * @retun Object { success: boolean}
     */

    async initializePayment(payment) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/payments`,
                {
                    tx_ref: payment.reference,
                    amount: payment.amount,
                    currency: payment.currency,
                    redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
                    customer: {
                        email: payment.email,
                        name: payment.metadata.customerName || 'Customer'
                    },
                    customizations: {
                        title: "Payment Gateway Service",
                        description: "Payment for items in cart",
                        logo: process.env.COMPANY_LOGO || ""
                    },
                    meta: {
                        paymentId: payment.id,
                        ...payment.metadata
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response.data.status === 'success') {
                return {
                    success: true,
                    data: {
                        authorizationUrl: response.data.data.link,
                        reference: payment.reference,
                        flwRef: response.data.data.id
                    }
                }
            } else {
                return {
                    success: false,
                    error: response.data.message || 'Payment initialization failed'
                };
            }
        } catch (error) {
            console.error('FlutterwaveService.initializePayment error:', error);
            if (error.response) {
                return {
                    success: false,
                    error: error.response.data.message || 'Payment initialization failed'
                };
            } else if (error.request) {
                return {
                    success: false,
                    error: 'Network error - Unable to connect to Flutterwave'
                };
            } else {

                return {
                    success: false,
                    error: error.message || 'Unknown error occurred'
                };
            }
        }
    }
    /**
     * Verify payment with FLutterwave
     */
    async verifyPayment(reference) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/transactions/verify_by_reference?tx_ref=${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response.data.status === 'success') {
                const data = response.data.data;

                return {
                    success: true,
                    data: {
                        status: data.status === 'successful' ? 'completed' : 'failed',
                        reference: data.tx_ref,
                        flwRef: data.flw_ref,
                        amount: data.amount,
                        currency: data.currency,
                        paidAt: data.created_at,
                        channel: data.payment_type,
                        fees: data.app_fee,
                        processor: data.processor_response,
                        customer: {
                            email: data.customer.email,
                            name: data.customer.name,
                            phone: data.customer.phone_number
                        },
                        card: data.card ? {
                            first6: data.card.first_6digits,
                            last4: data.card.last_4digits,
                            issuer: data.card.issuer,
                            country: data.card.country,
                            type: data.card.type,
                            expiry: data.card.expiry
                        } : null
                    }
                }
            } else {
                return {
                    success: false,
                    error: response.data.message || 'Payment verification failed'
                };
            }
        } catch (error) {
            console.error('FlutterwaveService.verifyPayment error:', error);

            if (error.response) {
                return {
                    success: false,
                    error: error.response.data.message || 'Flutterwave verification error'
                }
            } else if (error.request) {
                return {
                    success: false,
                    error: 'Network error - Unable to connect to Flutterwave'
                };
            } else {
                return {
                    success: false,
                    error: error.message || 'Unknown error occurred'
                }
            } 
        }
    }

    /**
     * Get transaction details from flutterwave
     */
    async getTransaction(transactionId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/transactions/${transactionId}/verify`,
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'success') {
                return {
                    success: true,
                    data: response.data.data
                };
            } else {
                return {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }
        } catch (error) {
            console.error('FlutterwaveService.getTransaction error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            }; 
        }
    }
    /**
     * List transaction from Flutterwave
     */
    async listTransactions(params = {}) {
        try {
            const queryParams = new URLSearchParams({
                page: params.page || 1,
                ...params
            });
            const response = await axios.get(
                `${this.baseUrl}/transactions?${queryParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response.data.status === 'success') {
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
            console.error('FlutterwaveService.listTransactions error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
    /**
     * Validate Flutterwave webhook signature
     */
    validateWebhookSignature(payload, signature) {
        const crypto = require('crypto');
        const hash = crypto
            .createHash('sha256')
            .update(JSON.stringify(payload) + this.secretKey)
            .digest('hex');

        return hash === signature;
    }

    /**
     * Process webhook from flutterwave
     */
    async processWebhook(payload, signature) {
        try {
            // Validate webhook signature
            if(!this.validateWebhookSignature(payload, signature)) {
                return {
                    success: false,
                    error: 'Invalid webhook signature'
                };
            }

            const event = payload.event;
            const data = payload.data;

            switch (event) {
                case 'charge.completed':
                    return {
                        success: true,
                        event: 'payment_completed',
                        data: {
                            reference: data.tx_ref,
                            flwRef: data.flw_ref,
                            status: 'completed',
                            amount: data.amount,
                            currency: data.currency,
                            paidAt: data.created_at
                        }
                    };
                case 'charge.failed':
                    return {
                        success: true,
                        event: 'payment_failed',
                        data: {
                            reference: data.tx_ref,
                            flwRef: data.flw_ref,
                            status: "failed",
                            amount: data.amount,
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
            console.error('FlutterwaveService.processWebhook error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get supported currencies
     */
    getSupportedCurrencies() {
        return ['USD', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'XAF', 'XOF'];
    }

    /**
     * Get payment options for currency
     */
    getPaymentOptions(currency) {
        const options = {
            'USD': 'card',
            'GHS': 'card,mobilemoney',
            'KES': 'card,mobilemoney',
            'UGX': 'card,mobilemoney',
            'TZS': 'card,mobilemoney',
            'ZAR': 'card',
            'XAF': 'card,mobilemoney',
            'XOF': 'card,mobilemoney'
        };
        return options[currency] || 'card';   
    }

    /**
     * Create payment plan
     */
    async createPaymentPlan(planData) {
        try {
            const response = await axios.post(
                `${this.baseURL}/payment-plans`,
                planData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.secretKey}`
                    }
                }
            );
            return {
                success: response.data.status === 'success',
                data: response.data.data,
                error: response.data.status !== 'success' ? response.data.message : null
            };
        } catch (error) {
            console.error('FlutterwaveService.createPaymentPlan error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };  
        }
    }
}

