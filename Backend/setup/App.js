import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { MongoClient, ServerApiVersion, Timestamp } from "mongodb";
import { PaymentRepository } from "../config/database.js";
import paymentRoutes from "../routes/paymentRoutes.js";

dotenv.config();

export class App {
    constructor() {
        this.app  = express();
        this.port = process.env.PORT || 5000;
        this.mongoUrl = process.env.MONGO_DB_URL;

        this.configureMiddleware();
        this.configureSecurity()
        
    
    }

    configureMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true}))


        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development'
            })
        })
    }

    configureSecurity() {
        this.app.use(helmet());

        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            process.env.FRONTEND_URL,
            process.env.FRONTEND_URLL
        ].filter(Boolean);

        this.app.use(
            cors({
                origin: (origin, callback) => {
                    if (!origin) return callback(null, true);

                    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
                        return callback(null, true);
                    }

                    console.log('CORS rejected origin:', origin);
                    return callback(new Error('Not allowed by CORS'));
                },
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
                optionsSuccessStatus: 200

            })
        );

        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100
        });

        this.app.use(limiter)
    }

    configureRoutes() {
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Payment Gateway Service API',
                status: 'running',
                timestamp: new Date().toISOString()
            });
        });

        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                message: `Route ${req.method} ${req.originalUrl} not found`
            })
        })

        this.app.use((error, req, res, next) => {
            console.error('Server Error', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            })
        })
    }

    async connectDatabase() {
        console.log('Connecting to Database...');

        const client = new MongoClient(this.mongoUrl, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true
            }
        });

        await client.connect();
        const db = client.db('payment');
        const paymentRepository = new PaymentRepository(db);

        console.log('Connected to MongoDB Atlas successfully');
        this.app.locals.db = db;
        this.app.locals.paymentRepository = paymentRepository;

        this.app.use('/api/payments', paymentRoutes);
        console.log('Payment routes registered at /api/payments');

    }

    async start() {
        try{
            await this.connectDatabase();
            this.app.listen(this.port, () => {
                console.log(`Server running on port ${this.port}`);
            });
        } catch (error) {
            console.error('Error starting server:', error);
            process.exit(1);
        }
    }
}

