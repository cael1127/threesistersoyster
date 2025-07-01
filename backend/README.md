# Three Sisters Oyster Backend

A Node.js backend server for handling payments and email notifications for the Three Sisters Oyster mobile app.

## Features

- ✅ **Stripe Payment Processing** - Secure payment intent creation
- ✅ **Email Notifications** - SendGrid integration for order notifications
- ✅ **Webhook Handling** - Process Stripe webhook events
- ✅ **Security** - CORS, rate limiting, and helmet security headers
- ✅ **Error Handling** - Comprehensive error handling and logging
- ✅ **Health Checks** - Server health monitoring endpoint

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=orders@threesistersoyster.com

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,exp://localhost:19000

# Email Configuration
ADMIN_EMAIL=your-email@threesistersoyster.com
```

### 3. Get Your API Keys

#### Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Developers → API keys
3. Copy your **Secret key** (starts with `sk_test_` for testing)
4. For webhooks, go to Developers → Webhooks and create an endpoint

#### SendGrid Keys
1. Go to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Navigate to Settings → API Keys
3. Create a new API key with "Mail Send" permissions
4. Verify your sender email address in Settings → Sender Authentication

### 4. Start the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on port 3000 (or the port specified in your .env file).

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and environment information.

### Create Payment Intent
```
POST /create-payment-intent
```
Creates a Stripe payment intent for processing payments.

**Request Body:**
```json
{
  "amount": 99.99,
  "currency": "usd",
  "metadata": {
    "order_id": "TSO-123456"
  }
}
```

**Response:**
```json
{
  "id": "pi_1234567890",
  "client_secret": "pi_1234567890_secret_abc123",
  "amount": 9999,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

### Send Order Notification
```
POST /send-order-notification
```
Sends an email notification for new orders.

**Request Body:**
```json
{
  "orderId": "TSO-123456",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "shippingAddress": {
    "address": "123 Main St",
    "city": "Portland",
    "state": "OR",
    "zipCode": "97201"
  },
  "items": [
    {
      "name": "Pacific Oysters",
      "quantity": 2,
      "price": 25.00
    }
  ],
  "total": 50.00,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Stripe Webhook
```
POST /webhook
```
Handles Stripe webhook events for payment status updates.

## Testing

### Test the Health Endpoint
```bash
curl http://localhost:3000/health
```

### Test Payment Intent Creation
```bash
curl -X POST http://localhost:3000/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 25.00, "currency": "usd"}'
```

### Test Email Notification
```bash
curl -X POST http://localhost:3000/send-order-notification \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TSO-TEST-123",
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "customerPhone": "+1234567890",
    "shippingAddress": {
      "address": "123 Test St",
      "city": "Test City",
      "state": "OR",
      "zipCode": "97201"
    },
    "items": [
      {
        "name": "Test Oysters",
        "quantity": 1,
        "price": 25.00
      }
    ],
    "total": 25.00,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

## Integration with Mobile App

Update your mobile app's payment service to use the backend:

```typescript
// In services/paymentService.ts
static async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<PaymentIntent> {
  try {
    const response = await fetch('http://localhost:3000/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    throw new Error('Failed to create payment intent');
  }
}
```

## Security Features

- **CORS Protection** - Configurable allowed origins
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Helmet Security Headers** - Protection against common vulnerabilities
- **Input Validation** - Validates all incoming requests
- **Error Handling** - Secure error responses (no sensitive data in production)

## Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_your_production_key
SENDGRID_API_KEY=your_production_sendgrid_key
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Recommended Hosting Options
- **Heroku** - Easy deployment with automatic SSL
- **AWS EC2** - Full control over server configuration
- **DigitalOcean** - Simple VPS deployment
- **Railway** - Modern deployment platform

### SSL Certificate
Ensure your production server has a valid SSL certificate for secure HTTPS connections.

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check your `ALLOWED_ORIGINS` configuration
2. **Payment Intent Creation Fails**: Verify your Stripe secret key
3. **Email Not Sending**: Check SendGrid API key and sender verification
4. **Webhook Errors**: Verify webhook secret and endpoint URL

### Logs
Check the server console for detailed error messages and request logs.

## Support

For issues or questions, check the logs and ensure all environment variables are properly configured. 