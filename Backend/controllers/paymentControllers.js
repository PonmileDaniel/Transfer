import { PaymentService } from "../services/PaymentService.js";

export class PaymentController {
    constructor() {
        // PaymentService will be injected via middleware
    }

    /**
     * Create a new payment
     * POST /api/payments
     */
    async createPayment (req, res) {
        try {
            const { amount, currency, email, metadata } = req.body;

            // Get PaymentService intsance from app locals
            const paymentService = new PaymentService(req.app.locals.paymentRepository);

            // Create payment
            const result = await paymentService.createPayment({
                amount,
                currency,
                email,
                metadata
            });

            if (result.success) {
                return res.status(201).json({
                    success: true,
                    message: 'Payment created successfully',
                    data: result.data
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: result.error,
                    details: result.details
                });
            }
        } catch (error) {
            console.error('PaymentController.createPayment error:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    /**
     * Verify Payment 
     * GET /api/payments/verify/:reference
     */
    async verifyPayment (req, res) {
        try {
            const { reference } = req.params;

            // Get PaymentService instance from app locals
            const paymentService = new PaymentService(req.app.locals.paymentRepository);

            // Verify payment
            const result = await paymentService.verifyPayment(reference);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: 'Payment verified successfully',
                    data: result.data
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: result.error,
                    details: result.details
                });
            }
        } catch (error) {
            console.error('PaymentController.verifyPayment error:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message }); 
        }
    }

    /**
     * Get all payments with pagination
     * Get /api/payments?limit=10&skip=0
     */

    async getAllPayments (req, res) {
        try {
            const { limit = 10, skip = 0 } = req.query;

            // Get PaymentService instance
            const paymentService = new PaymentService(req.app.locals.paymentRepository);

            // Fetch payemnt
            const result = await paymentService.getAllPayments(
                parseInt(limit),
                parseInt(skip)
            );

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: 'Payments retrieved successfullly',
                    data: result.data,
                    meta: {
                        total: result.total,
                        limit: parseInt(limit),
                        skip: parseInt(skip),
                        hasMore: (parseInt(skip) + parseInt(limit)) < result.total
                    }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            console.error('PaymentController.getAllPayments error:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }


    /**
     * Get payment by email
     * GET /api/payments/user/:email
     */

    async getPaymentsByEmail (req, res) {
        try {
            const { email } = req.params;
            const { limit = 10 } = req.query;

            // Get PaymentService instance
            const paymentService = new PaymentService(req.app.locals.paymentRepository);

            // Fetch payments by email
            const result = await paymentService.getPaymentsByEmail(
                email,
                parseInt(limit)
            );

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: 'Payments retrieved successfully',
                    data: result.data
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            console.error('PaymentController.getPaymentsByEmail error:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    /**
     * Get payment by Status
     * GET /api/payments/status/:status
     */

    async getPaymentsByStatus (req, res) {
        try {
            const { status } = req.params;
            const { limit = 10 } = req.query;

            // Validate status
            const validStatuses = ['pending', 'initialized', 'completed', 'failed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status',
                    validStatuses: validStatuses
                });
            }

            // Get PaymentService instance
            const paymentService = new PaymentService(req.app.locals.paymentRepository);

            // Fetch payments by status
            const result = await paymentService.getPaymentsByStatus(
                status,
                parseInt(limit)
            );

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: `${status} Payments retrieved successfully`,
                    data: result.data
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            console.error('PaymentController.getPaymentsByStatus error:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }


    /**
     * Payment callback handler
     * GET /api/payments/callback
     */

    async paymentCallback (req, res) {
        try {
            const { reference, status } = req.query;

            if (!reference) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment reference is required'
                });
            }

            // Get PaymentService instance
            const paymentService = new PaymentService(req.app.locals.paymentRepository);

            // Verify the payment
            const result = await paymentService.verifyPayment(reference);

            if (result.success) {
                // Redirect to the fronted with success
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                return res.redirect(`${frontendUrl}/payment/success?reference=${reference}&status=${result.data.status}`);
            } else {
                // Redirect to frontend with failure
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                return res.redirect(`${frontendUrl}/payment/failed?reference=${reference}&error=${encodeURIComponent(result.error)}`);
            }
        } catch(error) {
            console.error('PaymentController.paymentCallback error:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    /**
     * Get payment by ID
     * GET /api/payments/:id
     */
    async getPayment(req, res) {
        try {
            const { id } = req.params;

            // Get PaymentService instance
            const paymentService = new PaymentService(req.app.locals.paymentRepository);

            // Get payment
            const result = await paymentService.getPayment(id);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: 'Payment retrieved successfully',
                    data: result.data
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: result.error
                });
            }

        } catch (error) {
            console.error('PaymentController.getPayment error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                details: error.message
            });
        }
    }
}