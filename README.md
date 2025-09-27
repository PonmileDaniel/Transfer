# Payment Gateway Service

A comprehensive payment processing platform that integrates with multiple payment providers using the adapter pattern. The service automatically routes payments to the appropriate provider based on currency and provides a unified API for payment management.

## 🚀 Features

### Payment Processing
- **Multi-Provider Support**: Integrates with Paystack and Flutterwave
- **Currency-Based Routing**: 
  - NGN (Nigerian Naira) → Paystack
  - USD, GHS, KES, etc. → Flutterwave
- **Payment Status Tracking**: Real-time status updates from pending to completed
- **Payment Verification**: Automatic and manual payment verification
- **Transaction History**: Complete payment history with search and filtering

### Security & Reliability
- **Rate Limiting**: Protection against abuse with configurable limits
- **Input Validation**: Comprehensive data validation using Joi
- **Error Handling**: Robust error handling with detailed error messages
- **CORS Support**: Configurable cross-origin resource sharing
- **Helmet Integration**: Security headers for protection

### Architecture
- **Adapter Pattern**: Clean abstraction for payment providers
- **Repository Pattern**: Consistent data access layer
- **Service Layer**: Business logic separation
- **RESTful API**: Clean and intuitive API endpoints

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database for payment records
- **Axios** - HTTP client for external API calls
- **Joi** - Data validation
- **Helmet** - Security middleware
- **dotenv** - Environment configuration

### Frontend
- **React** - User interface library
- **Vite** - Build tool and development server
- **Lucide React** - Icon library
- **Axios** - API client
- **CSS3** - Custom styling

### Payment Providers
- **Paystack** - Nigerian payment processing
- **Flutterwave** - African and international payments

## 📦 Project Structure

```
Transfer/
├── Backend/                 # Node.js API Server
│   ├── config/
│   │   └── database.js     # MongoDB connection & repository
│   ├── controllers/
│   │   └── paymentControllers.js # Request handlers
│   ├── middleware/
│   │   └── validation.js   # Input validation middleware
│   ├── models/
│   │   └── Payment.js      # Payment data model
│   ├── routes/
│   │   └── paymentRoutes.js # API route definitions
│   ├── services/
│   │   ├── PaymentService.js    # Main payment orchestrator
│   │   ├── PaystackService.js   # Paystack integration
│   │   └── FlutterwaveService.js # Flutterwave integration
│   ├── utils/
│   │   └── validation.js   # Validation utilities
│   ├── .env               # Environment variables
│   ├── .gitignore
│   ├── package.json
│   └── server.js          # Application entry point
└── Frontend/               # React Application
    ├── src/
    │   ├── components/
    │   │   ├── PaymentForm.jsx     # Payment creation form
    │   │   ├── PaymentHistory.jsx  # Transaction history
    │   │   ├── LoadingSpinner.jsx  # Loading component
    │   │   └── Navbar.jsx          # Navigation component
    │   ├── pages/
    │   │   ├── PaymentSuccess.jsx  # Success confirmation
    │   │   └── PaymentFailed.jsx   # Error handling
    │   ├── services/
    │   │   └── api.js             # API client
    │   ├── styles/
    │   │   └── globals.css        # Application styles
    │   ├── App.jsx               # Main application component
    │   └── main.jsx              # Application entry point
    ├── index.html
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Paystack Account** (for NGN transactions)
- **Flutterwave Account** (for other currencies)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PonmileDaniel/Transfer.git
   cd Transfer
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../Frontend
   npm install
   ```

### Environment Configuration

Create a `.env` file in the Backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_DB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=ClusterName

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Paystack API Keys (for NGN payments)
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key

# Flutterwave API Keys (for other currencies)
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_flutterwave_secret_key
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST-your_encryption_key

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5173
```

### Getting API Keys

#### Paystack (for NGN payments)
1. Visit [Paystack Dashboard](https://dashboard.paystack.com/settings/developers)
2. Sign up/Login to your account
3. Navigate to Settings → API Keys & Webhooks
4. Copy your **Public Key** and **Secret Key**

#### Flutterwave (for international payments)
1. Visit [Flutterwave Dashboard](https://dashboard.flutterwave.com/settings/apis)
2. Sign up/Login to your account
3. Navigate to Settings → API
4. Copy your **Public Key**, **Secret Key**, and **Encryption Key**

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd Backend
   npm run dev
   # Server runs on http://localhost:5000
   ```

2. **Start the Frontend Development Server**
   ```bash
   cd Frontend
   npm run dev
   # Application runs on http://localhost:5173
   ```

3. **Access the Application**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Create Payment
```http
POST /payments
Content-Type: application/json

{
  "amount": 1000,
  "currency": "NGN",
  "email": "user@example.com",
  "metadata": {
    "customerName": "John Doe"
  }
}
```

#### Get Payment by ID
```http
GET /payments/:id
```

#### Verify Payment
```http
GET /payments/verify/:reference
```

#### Get All Payments
```http
GET /payments/all?limit=10&skip=0
```

#### Get Payments by Email
```http
GET /payments/user/:email
```

#### Get Payments by Status
```http
GET /payments/status/:status
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "id": "payment_id",
    "reference": "PAY_REFERENCE",
    "authorizationUrl": "https://checkout.provider.com/pay/...",
    "amount": 1000,
    "currency": "NGN",
    "provider": "paystack",
    "status": "initialized"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Amount must be a positive number"]
}
```

## 🎯 Payment Flow

1. **User submits payment form** with amount, currency, and email
2. **System validates** input data
3. **Currency-based routing** selects appropriate provider:
   - NGN → Paystack
   - USD/GHS/KES → Flutterwave
4. **Payment record** created in database with status "pending"
5. **Provider API** called to initialize payment
6. **Status updated** to "initialized"
7. **User redirected** to payment provider's checkout
8. **User completes** payment on provider's platform
9. **Payment verification** updates status to "completed"
10. **User redirected** back to success/failure page

## 🧪 Testing

### Test Cards

**Paystack Test Cards:**
```
Card Number: 4084084084084081
Expiry: 12/25
CVV: 123
```

**Flutterwave Test Cards:**
```
Card Number: 4187427415564246
Expiry: 09/32
CVV: 828
```

### Manual Testing

1. **Create NGN Payment** - Should route to Paystack
2. **Create USD Payment** - Should route to Flutterwave
3. **Complete payment** on provider's checkout
4. **Verify payment status** updates correctly
5. **Check payment history** shows all transactions

### API Testing with curl

```bash
# Test payment creation
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "NGN",
    "email": "test@example.com"
  }'

# Test payment verification
curl http://localhost:5000/api/payments/verify/PAY_REFERENCE

# Test payment history
curl http://localhost:5000/api/payments/all
```

## 🔧 Configuration

### Supported Currencies

- **NGN** - Nigerian Naira (Paystack)
- **USD** - US Dollar (Flutterwave)
- **GHS** - Ghanaian Cedi (Flutterwave)
- **KES** - Kenyan Shilling (Flutterwave)

### Rate Limiting

Default configuration allows:
- **100 requests per 15 minutes** per IP address
- Configurable in `server.js`

### Database Collections

- **payments** - Stores all payment records
- Automatic indexing on `reference` and `email` fields

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGO_DB_URL=mongodb+srv://...
JWT_SECRET=your_production_jwt_secret
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-...
FLUTTERWAVE_SECRET_KEY=FLWSECK-...
FRONTEND_URL=https://your-domain.com
```

### Production Checklist

- [ ] Use production API keys
- [ ] Configure MongoDB Atlas
- [ ] Set up SSL certificates
- [ ] Configure domain names
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up webhook endpoints
- [ ] Test all payment flows

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Paystack** - Nigerian payment processing
- **Flutterwave** - African payment infrastructure
- **MongoDB** - Database platform
- **React** - User interface library
- **Express.js** - Web framework

## 📞 Support

For support and questions:

- **Email**: [support@yourapp.com](mailto:support@yourapp.com)
- **GitHub Issues**: [Create an issue](https://github.com/PonmileDaniel/Transfer/issues)
- **Documentation**: [API Docs](https://your-api-docs.com)

---

**Built with ❤️ by [PonmileDaniel](https://github.com/PonmileDaniel)**
