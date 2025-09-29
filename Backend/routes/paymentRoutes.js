import express from 'express';
import { PaymentController } from '../controllers/paymentControllers.js';
import { validatePaymentData } from '../utils/validation.js';


const router = express.Router();
const paymentController = new PaymentController();

// Route to create a new payment
router.post('/', validatePaymentData, paymentController.createPayment);

// Route to get all payments with pagination
router.get('/all', paymentController.getAllPayments);

// Route to verify a payment by reference
router.get('/verify/:reference', paymentController.verifyPayment);

// Routes to get payment by email
router.get('/user/:email', paymentController.getPaymentsByEmail);

// Route to get payments by status
router.get('/status/:status', paymentController.getPaymentsByStatus);

// Routes to get payment callback from provider
router.post('/callback', paymentController.paymentCallback);

// Routes to get a specific payment by ID (MUST be LAST)
router.get('/:id', paymentController.getPayment);

export default router;