# Backend Setup Guide

This guide will help you set up the Node.js backend server for the Three Sisters Oyster app.

## Prerequisites

1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Stripe Account**
   - Sign up at: https://stripe.com/
   - Get your API keys from the dashboard

3. **SendGrid Account** (for email notifications)
   - Sign up at: https://sendgrid.com/
   - Get your API key and verify your sender email

## Quick Start

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your actual values
```

### 4. Start the Server
```bash
# Windows
start.bat

# Mac/Linux
chmod +x start.sh
./start.sh

# Or manually
npm run dev
```

## Detailed Configuration

### Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers → API keys**
3. Copy your **Secret key** (starts with `sk_test_` for testing)
4. For webhooks:
   - Go to **Developers → Webhooks**
   - Click **Add endpoint**
   - URL: `https://your-domain.com/webhook`
   - Events: Select `payment_intent.succeeded` and `payment_intent.payment_failed`
   - Copy the webhook secret (starts with `whsec_`)

### Step 2: Get SendGrid API Key

1. Go to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Navigate to **Settings → API Keys**
3. Click **Create API Key**
4. Name: "Three Sisters Oyster"
5. Permissions: Select **Mail Send**
6. Copy the API key
7. Verify your sender email:
   - Go to **Settings → Sender Authentication**
   - Verify your domain or single sender

### Step 3: Configure .env File

Edit the `.env` file with your actual values:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# SendGrid Configuration
SENDGRID_API_KEY=your_actual_sendgrid_api_key
SENDGRID_FROM_EMAIL=orders@yourdomain.com

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (add your app's URLs)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,exp://localhost:19000

# Email Configuration
ADMIN_EMAIL=your-email@yourdomain.com
```

## Testing the Backend

### 1. Health Check
```bash
curl http://localhost:3000/health
```
Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "development"
}
```

### 2. Test Payment Intent Creation
```bash
curl -X POST http://localhost:3000/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 25.00, "currency": "usd"}'
```

### 3. Test Email Notification
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

The mobile app is already configured to use the backend. The services will automatically connect to `http://localhost:3000` when running in development.

### For Production

Update the backend URL in these files:
- `services/paymentService.ts` - Line 10
- `services/emailService.ts` - Line 8

Change from:
```typescript
private static readonly BACKEND_URL = 'http://localhost:3000';
```

To:
```typescript
private static readonly BACKEND_URL = 'https://your-production-domain.com';
```

## Troubleshooting

### Common Issues

1. **"Module not found" errors**
   ```bash
   npm install
   ```

2. **CORS errors**
   - Check your `ALLOWED_ORIGINS` in `.env`
   - Add your app's URL to the list

3. **Payment intent creation fails**
   - Verify your Stripe secret key
   - Check Stripe dashboard for errors

4. **Email not sending**
   - Verify SendGrid API key
   - Check sender email verification
   - Check SendGrid dashboard for delivery status

5. **Port already in use**
   ```bash
   # Find process using port 3000
   lsof -i :3000  # Mac/Linux
   netstat -ano | findstr :3000  # Windows
   
   # Kill the process or change PORT in .env
   ```

### Logs

Check the server console for detailed error messages. The server logs:
- Payment intent creation
- Email sending attempts
- Webhook events
- Error details

## Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_your_production_key
SENDGRID_API_KEY=your_production_sendgrid_key
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Recommended Hosting

1. **Heroku**
   ```bash
   heroku create your-app-name
   heroku config:set NODE_ENV=production
   heroku config:set STRIPE_SECRET_KEY=sk_live_...
   git push heroku main
   ```

2. **Railway**
   - Connect your GitHub repository
   - Set environment variables in dashboard
   - Automatic deployment

3. **DigitalOcean App Platform**
   - Connect your repository
   - Configure environment variables
   - Automatic SSL certificates

### SSL Certificate

Ensure your production server has a valid SSL certificate for secure HTTPS connections.

## Security Checklist

- [ ] Environment variables are properly set
- [ ] CORS is configured for your domains only
- [ ] Rate limiting is enabled
- [ ] Helmet security headers are active
- [ ] Stripe webhook signature verification is working
- [ ] SendGrid sender authentication is complete
- [ ] SSL certificate is valid
- [ ] Error messages don't expose sensitive data

## Support

If you encounter issues:
1. Check the server logs
2. Verify all environment variables
3. Test individual endpoints
4. Check Stripe and SendGrid dashboards for errors 