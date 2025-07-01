# Simple Setup Guide (No Webhooks)

This is a simplified setup guide for the Three Sisters Oyster backend without Stripe webhooks.

## Required API Keys

You only need these 2 API keys:

### 1. Stripe Secret Key
- Go to https://dashboard.stripe.com/
- Navigate to **Developers → API keys**
- Copy your **Secret key** (starts with `sk_test_`)

### 2. SendGrid API Key
- Go to https://app.sendgrid.com/
- Navigate to **Settings → API Keys**
- Create new API key with "Mail Send" permissions
- Copy the API key (starts with `SG.`)

## Deploy to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add backend for Vercel deployment"
git push origin main
```

### Step 2: Deploy on Vercel
1. Go to https://vercel.com/dashboard
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Node.js
   - **Root Directory**: `backend`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)

### Step 3: Add Environment Variables
In Vercel dashboard, add these environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_xxxxxxxxxxxxx` | Your Stripe secret key |
| `SENDGRID_API_KEY` | `SG.xxxxxxxxxxxxxxxxxxxxx` | Your SendGrid API key |
| `SENDGRID_FROM_EMAIL` | `orders@yourdomain.com` | Email to send from |
| `ADMIN_EMAIL` | `your-email@yourdomain.com` | Email to receive orders |
| `ALLOWED_ORIGINS` | `https://your-app-domain.com,exp://localhost:19000` | CORS origins |
| `NODE_ENV` | `production` | Environment setting |

### Step 4: Deploy
- Click **"Deploy"**
- Wait for deployment
- Your URL will be: `https://your-project-name.vercel.app`

## Update Mobile App

Once deployed, update these files in your mobile app:

### services/paymentService.ts
```typescript
private static readonly BACKEND_URL = 'https://your-project-name.vercel.app';
```

### services/emailService.ts
```typescript
private static readonly BACKEND_URL = 'https://your-project-name.vercel.app';
```

## Test Your Deployment

### Health Check
```bash
curl https://your-project-name.vercel.app/health
```

### Test Payment
```bash
curl -X POST https://your-project-name.vercel.app/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 25.00, "currency": "usd"}'
```

### Test Email
```bash
curl -X POST https://your-project-name.vercel.app/send-order-notification \
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

## What This Setup Includes

✅ **Payment Processing** - Create Stripe payment intents  
✅ **Email Notifications** - Send order emails via SendGrid  
✅ **Inventory Management** - Stock updates when orders are placed  
✅ **Quantity Selection** - Choose how many items to order  
✅ **Security** - CORS, rate limiting, input validation  
✅ **Error Handling** - Comprehensive error handling  

## What's Not Included (Optional)

❌ **Webhooks** - Real-time payment status updates  
❌ **Custom Domain** - Using Vercel's free subdomain  
❌ **Advanced Monitoring** - Basic logging only  

## Troubleshooting

### Common Issues:
1. **"Module not found"** - Make sure all dependencies are in package.json
2. **CORS errors** - Check ALLOWED_ORIGINS in environment variables
3. **Payment fails** - Verify Stripe secret key is correct
4. **Email not sending** - Check SendGrid API key and sender verification

### Vercel Limits:
- **Function timeout**: 10 seconds (free tier)
- **Cold starts**: First request might be slow
- **Bandwidth**: 100GB/month (free tier)

## Next Steps

1. **Test thoroughly** with your mobile app
2. **Monitor logs** in Vercel dashboard
3. **Consider upgrading** if you need more resources
4. **Add webhooks later** if you want real-time payment updates 