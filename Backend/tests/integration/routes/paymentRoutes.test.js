// tests/integration/routes/paymentRoutes.test.js
import request from 'supertest';
import express from 'express';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase, createTestPayment } from '../../setup.js';
import paymentRoutes from '../../../routes/paymentRoutes.js';
import { validatePaymentData } from '../../../utils/validation.js';
import { jest } from '@jest/globals';

// Mock external services completely for integration tests
const mockPaystackService = {
  initializePayment: jest.fn().mockResolvedValue({
    success: true,
    data: {
      authorization_url: 'https://checkout.paystack.com/test',
      access_code: 'test_access_code',
      reference: 'PAY_TEST123'
    }
  }),
  verifyPayment: jest.fn().mockResolvedValue({
    success: true,
    data: { status: 'completed', reference: 'PAY_TEST123' }
  })
};

const mockFlutterwaveService = {
  initializePayment: jest.fn().mockResolvedValue({
    success: true,
    data: {
      link: 'https://checkout.flutterwave.com/test',
      tx_ref: 'FLW_TEST123'
    }
  }),
  verifyPayment: jest.fn().mockResolvedValue({
    success: true,
    data: { status: 'completed', reference: 'FLW_TEST123' }
  })
};

// tests/integration/routes/paymentRoutes.test.js

// Mock external services for integration tests
jest.unstable_mockModule('../../../services/PaystackService.js', () => ({
    PaystackService: jest.fn().mockImplementation(() => mockPaystackService)
}));

jest.unstable_mockModule('../../../services/FlutterwaveService.js', () => ({
    FlutterwaveService: jest.fn().mockImplementation(() => mockFlutterwaveService)
}));

const { PaystackService } = await import('../../../services/PaystackService.js');
const { FlutterwaveService } = await import('../../../services/FlutterwaveService.js');

describe('Payment Routes Integration Tests', () => {
    let app;
    let paymentRepository;

    beforeAll(async () => {
        const testDb = await setupTestDatabase();
        paymentRepository = testDb.paymentRepository;

        // Setup Express app for testing
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        
        // Make repository available to routes
        app.locals.paymentRepository = paymentRepository;
        
        // Mount payment routes
        app.use('/api/payments', paymentRoutes);
    });

    afterAll(async () => {
        await teardownTestDatabase();
    });

    beforeEach(async () => {
        await clearTestDatabase();
        
        // Mock successful payment initialization
        jest.clearAllMocks();
    });

    describe('POST /api/payments', () => {
        it('should create payment with valid data', async () => {
            const testPaymentData = createTestPayment();

            const response = await request(app)
                .post('/api/payments')
                .send(testPaymentData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Payment created successfully');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('reference');
        });

        it('should create payment with different providers', async () => {
            const paystackData = createTestPayment({ currency: 'NGN' }); // Paystack for NGN
            const flutterwaveData = createTestPayment({ currency: 'USD' }); // Flutterwave for USD

            const paystackResponse = await request(app)
                .post('/api/payments')
                .send(paystackData)
                .expect(201);

            const flutterwaveResponse = await request(app)
                .post('/api/payments')
                .send(flutterwaveData)
                .expect(201);

            expect(paystackResponse.body.success).toBe(true);
            expect(flutterwaveResponse.body.success).toBe(true);
        });

        it('should handle missing required fields', async () => {
            const incompleteData = {
                email: 'test@example.com'
                // Missing amount, currency, etc.
            };

            const response = await request(app)
                .post('/api/payments')
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should reject payment with invalid amount', async () => {
            const invalidData = createTestPayment({ amount: -100 });

            const response = await request(app)
                .post('/api/payments')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toContain('Amount must be a positive number');
        });

        it('should reject payment with zero amount', async () => {
            const invalidData = createTestPayment({ amount: 0 });

            const response = await request(app)
                .post('/api/payments')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Amount must be a positive number');
        });

        it('should reject payment with invalid email format', async () => {
            const invalidData = createTestPayment({ email: 'invalid-email' });

            const response = await request(app)
                .post('/api/payments')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Please provide a valid email address');
        });

        it('should reject payment with empty email', async () => {
            const invalidData = createTestPayment({ email: '' });

            const response = await request(app)
                .post('/api/payments')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject payment with invalid currency', async () => {
            const invalidData = createTestPayment({ currency: 'INVALID' });

            const response = await request(app)
                .post('/api/payments')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject payment with unsupported provider', async () => {
            const invalidData = createTestPayment({ provider: 'unsupported' });

            const response = await request(app)
                .post('/api/payments')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should handle large amounts', async () => {
            const largeAmountData = createTestPayment({ amount: 1000000 }); // 10,000 NGN

            const response = await request(app)
                .post('/api/payments')
                .send(largeAmountData)
                .expect(201);

            expect(response.body.success).toBe(true);
        });

        it('should handle special characters in customer name', async () => {
            const specialCharData = createTestPayment({ 
                metadata: { customerName: 'Test User-OConnor Sons' }
            });

            const response = await request(app)
                .post('/api/payments')
                .send(specialCharData)
                .expect(201);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/payments/all', () => {
        beforeEach(async () => {
            // Create some test payments
            const payment1 = createTestPayment({ email: 'user1@test.com' });
            const payment2 = createTestPayment({ email: 'user2@test.com' });
            const payment3 = createTestPayment({ email: 'user3@test.com' });

            await request(app).post('/api/payments').send(payment1);
            await request(app).post('/api/payments').send(payment2);
            await request(app).post('/api/payments').send(payment3);
        });

        it('should get all payments with default pagination', async () => {
            const response = await request(app)
                .get('/api/payments/all')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.meta).toHaveProperty('total');
            expect(response.body.meta).toHaveProperty('limit');
            expect(response.body.meta).toHaveProperty('skip');
        });

        it('should get payments with custom pagination', async () => {
            const response = await request(app)
                .get('/api/payments/all?limit=2&skip=1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.meta.limit).toBe(2);
            expect(response.body.meta.skip).toBe(1);
            expect(response.body.data.length).toBeLessThanOrEqual(2);
        });

        it('should handle invalid pagination parameters', async () => {
            const response = await request(app)
                .get('/api/payments/all?limit=-5&skip=-1')
                .expect(400); // Your app correctly rejects invalid parameters

            expect(response.body.success).toBe(false);
            // Should reject invalid parameters
        });

        it('should handle large skip values', async () => {
            const response = await request(app)
                .get('/api/payments/all?limit=10&skip=1000')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    describe('GET /api/payments/verify/:reference', () => {
        it('should handle non-existent payment verification', async () => {
            const response = await request(app)
                .get('/api/payments/verify/NON_EXISTENT_REF')
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should handle empty reference', async () => {
            const response = await request(app)
                .get('/api/payments/verify/')
                .expect(404); // Route not found

            expect(response.status).toBe(404);
        });

        it('should handle reference with special characters', async () => {
            const response = await request(app)
                .get('/api/payments/verify/PAY_TEST-123_456')
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/payments/status/:status', () => {
        it('should get payments by valid status', async () => {
            const response = await request(app)
                .get('/api/payments/status/pending')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should get payments by different valid statuses', async () => {
            const statuses = ['pending', 'initialized', 'completed', 'failed'];
            
            for (const status of statuses) {
                const response = await request(app)
                    .get(`/api/payments/status/${status}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
            }
        });

        it('should reject invalid status', async () => {
            const response = await request(app)
                .get('/api/payments/status/invalid_status')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid status');
            expect(response.body.validStatuses).toEqual(['pending', 'initialized', 'completed', 'failed']);
        });

        it('should handle empty status', async () => {
            const response = await request(app)
                .get('/api/payments/status/')
                .expect(404);

            expect(response.status).toBe(404);
        });

        it('should handle status with special characters', async () => {
            const response = await request(app)
                .get('/api/payments/status/pending-test')
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should handle pagination for status endpoint', async () => {
            const response = await request(app)
                .get('/api/payments/status/pending?limit=5')
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/payments/user/:email', () => {
        it('should get payments by email', async () => {
            const email = 'test@example.com';
            
            const response = await request(app)
                .get(`/api/payments/user/${encodeURIComponent(email)}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should handle email with special characters', async () => {
            const email = 'test+special@example.com';
            
            const response = await request(app)
                .get(`/api/payments/user/${encodeURIComponent(email)}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should handle email with dots and underscores', async () => {
            const email = 'test.user_name@example.co.uk';
            
            const response = await request(app)
                .get(`/api/payments/user/${encodeURIComponent(email)}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should handle non-existent email', async () => {
            const email = 'nonexistent@example.com';
            
            const response = await request(app)
                .get(`/api/payments/user/${encodeURIComponent(email)}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });

        it('should handle invalid email format in URL', async () => {
            const response = await request(app)
                .get('/api/payments/user/invalid-email-format')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });

        it('should handle pagination for user payments', async () => {
            const email = 'test@example.com';
            
            const response = await request(app)
                .get(`/api/payments/user/${encodeURIComponent(email)}?limit=5`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/payments/:id', () => {
        it('should handle non-existent payment ID', async () => {
            const response = await request(app)
                .get('/api/payments/non-existent-id')
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should handle invalid ID format', async () => {
            const response = await request(app)
                .get('/api/payments/123-invalid-format')
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should handle empty ID', async () => {
            const response = await request(app)
                .get('/api/payments/')
                .expect(404); // This should return 404 as there's no handler for empty path

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/payments/callback', () => {
        it('should handle Paystack callback', async () => {
            const callbackData = {
                event: 'charge.success',
                data: {
                    reference: 'PAY_TEST123',
                    status: 'success',
                    amount: 100000
                }
            };

            const response = await request(app)
                .post('/api/payments/callback')
                .send(callbackData)
                .expect(400); // Expecting 400 since callback validation is strict

            expect(response.body.success).toBe(false);
        });

        it('should handle Flutterwave callback', async () => {
            const callbackData = {
                status: 'completed',
                tx_ref: 'FLW_TEST123',
                transaction_id: '12345'
            };

            const response = await request(app)
                .post('/api/payments/callback')
                .send(callbackData)
                .expect(400); // Expecting 400 since callback validation is strict

            expect(response.body.success).toBe(false);
        });

        it('should handle invalid callback data', async () => {
            const invalidCallbackData = {
                invalid: 'data'
            };

            const response = await request(app)
                .post('/api/payments/callback')
                .send(invalidCallbackData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should handle empty callback', async () => {
            const response = await request(app)
                .post('/api/payments/callback')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed JSON', async () => {
            const response = await request(app)
                .post('/api/payments')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}')
                .expect(400);

            // Express's JSON parsing middleware returns HTML error page, not JSON
            expect(response.status).toBe(400);
        });

        it('should handle missing Content-Type header', async () => {
            const testPaymentData = createTestPayment();

            const response = await request(app)
                .post('/api/payments')
                .send(JSON.stringify(testPaymentData))
                .expect(400); // Should fail validation due to missing parsing

            expect(response.status).toBe(400);
        });

        it('should handle very large payload', async () => {
            const largeData = createTestPayment({
                customerName: 'A'.repeat(10000) // Very long name
            });

            const response = await request(app)
                .post('/api/payments')
                .send(largeData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Route Priority', () => {
        it('should prioritize specific routes over dynamic routes', async () => {
            // Test that /api/payments/all doesn't get caught by /:id route
            const response = await request(app)
                .get('/api/payments/all')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should prioritize verify route over ID route', async () => {
            const response = await request(app)
                .get('/api/payments/verify/some-reference')
                .expect(400); // Should hit verify route, not ID route

            expect(response.body.success).toBe(false);
        });

        it('should prioritize status route over ID route', async () => {
            const response = await request(app)
                .get('/api/payments/status/pending')
                .expect(200); // Should hit status route, not ID route

            expect(response.body.success).toBe(true);
        });
    });
});