import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { PaymentRepository } from './config/database.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_DB_URL = process.env.MONGO_DB_URL;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://transfer-w62h.vercel.app/'],
  credentials: true
}));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Main Application Logic
async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGO_DB_URL, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
    });
    await client.connect();
    const db = client.db("payment");
    const paymentRepository = new PaymentRepository(db);
    console.log('Connected to MongoDB Atlas successfully');

    // 2. Make repository available to the app
    app.locals.db = db;
    app.locals.paymentRepository = paymentRepository;

    // 3. Register Routes
    app.get('/', (req, res) => {
      res.json({ 
        message: 'Payment Gateway Service API',
        status: 'running',
        timestamp: new Date().toISOString()
      });
    });
    app.use('/api/payments', paymentRoutes);
    console.log('Payment routes registered at /api/payments');

    // 4. Register 404 and Error Handlers
    app.use((req, res) => {
      res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
    });
    app.use((error, req, res, next) => {
      console.error('Server Error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    });

    // 5. Start Listening for Requests
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Start the application
startServer();