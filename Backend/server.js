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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });

});

// Middleware
app.use(helmet());

// Dynamic CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URLL
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches Vercel pattern
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.log('CORS rejected origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
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