import express from 'express';
import { PaymentController } from '../controllers/paymentControllers.js';
import { validatePaymentData } from '../utils/validation.js';


const router = express.Router();
const paymentController = new PaymentController();

router.post('/', validatePaymentData, paymentController.createPayment);

router.get('/all', paymentController.getAllPayments);

router.get('/verify/:reference', paymentController.verifyPayment);


router.get('/status/:status', paymentController.getPaymentsByStatus);

router.post('/callback', paymentController.paymentCallback);

router.get('/:id', paymentController.getPayment);

export default router;