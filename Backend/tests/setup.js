import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { PaymentRepository } from '../config/database.js';

let mongoServer;
let client;
let db;
let paymentRepository;

export const setupTestDatabase = async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  client = new MongoClient(mongoUri);
  await client.connect();
  
  db = client.db('test-payment-gateway');
  paymentRepository = new PaymentRepository(db);
  
  return { db, paymentRepository };
};

export const teardownTestDatabase = async () => {
  if (client) {
    await client.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

export const clearTestDatabase = async () => {
  if (db) {
    await db.collection('payments').deleteMany({});
  }
};

// Test data factory
export const createTestPayment = (overrides = {}) => {
  return {
    amount: 1000,
    currency: 'NGN',
    email: 'test@example.com',
    metadata: { customerName: 'Test User' },
    ...overrides
  };
};

export const createTestPaymentRecord = (overrides = {}) => {
  return {
    id: 'test-payment-123',
    reference: 'PAY_TEST123',
    status: 'pending',
    provider: 'paystack',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...createTestPayment(),
    ...overrides
  };
};