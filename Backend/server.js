import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { PaymentRepository } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_DB_URL = process.env.MONGO_DB_URL;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());

let db;
let paymentRepository;

// Connecting to MongoDB
const client = new MongoClient(MONGO_DB_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  try {
    await client.connect();
    db = client.db("payment");
    paymentRepository = new PaymentRepository(db);
    
    console.log("Connected to MongoDB Atlas");
    
    // Make database repository available globally
    app.locals.db = db;
    app.locals.paymentRepository = paymentRepository;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

connectDB();

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Payment Gateway Service API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { db, paymentRepository };

