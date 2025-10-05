import express from 'express';
import { PaymentController } from '../controllers/paymentControllers.js';
import { validatePaymentData, validatePaymentReference, validatePaymentId } from '../utils/validation.js';


const router = express.Router();
const paymentController = new PaymentController();

router.post('/', validatePaymentData, paymentController.createPayment);

router.get('/all', paymentController.getAllPayments);

router.get('/verify/:reference', validatePaymentReference, paymentController.verifyPayment);

router.get('/:id', validatePaymentId, paymentController.getPayment);

router.get('/status/:status', paymentController.getPaymentsByStatus);

router.post('/callback', paymentController.paymentCallback);


export default router;