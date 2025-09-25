import express from 'express';
import { PaymentController } from '../controllers/paymentControllers.js';
import { validatePaymentData } from '../utils/validation.js';


const router = express.Router();
const paymentController = new PaymentController();

// Route to create a new payment
router.post('/', validatePaymentData, paymentController.createPayment);

// Routes to get all payments and a specific payment by ID
router.get('/:id', paymentController.getPayment);

// Route to verify a payment by reference
router.get('/verify/:reference', paymentController.verifyPayment);

// Routes to get all payment with pagination
// router.get('/', paymentController.getAllPayments);

// Routes to get payment by email
router.get('/user/:email', paymentController.getPaymentsByEmail);

// Route to get payments by status
router.get('/status/:status', paymentController.getPaymentsByStatus);

// Routes to get payment callback from provider
router.post('/callback', paymentController.paymentCallback);

export default router;