# Vercel Deployment Guide

This guide will help you deploy your Three Sisters Oyster backend to Vercel.

## Prerequisites

1. **GitHub Account** - Your code needs to be on GitHub
2. **Vercel Account** - Sign up at https://vercel.com
3. **Stripe Account** - For payment processing
4. **SendGrid Account** - For email notifications

## Step 1: Push Your Code to GitHub

If you haven't already, create a GitHub repository and push your code:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit with backend"

# Create repository on GitHub.com, then:
git remote add origin https://github.com/yourusername/threesistersoyster.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click **"New Project"**
   - Select your GitHub repository
   - Vercel will automatically detect it's a Node.js project

3. **Configure Project Settings**
   - **Framework Preset**: Node.js
   - **Root Directory**: `backend` (since your backend is in a subfolder)
   - **Build Command**: Leave empty (not needed for this setup)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

4. **Set Environment Variables**
   Before deploying, add these environment variables in the Vercel dashboard:

   ```
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=orders@yourdomain.com
   ADMIN_EMAIL=your-email@yourdomain.com
   ALLOWED_ORIGINS=https://your-app-domain.com,exp://localhost:19000
   NODE_ENV=production
   ```

5. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment to complete
   - Your URL will be: `https://your-project-name.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd backend
   vercel
   ```

4. **Follow the prompts**
   - Link to existing project or create new
   - Set environment variables when prompted

## Step 3: Configure Environment Variables

In your Vercel dashboard, go to your project settings and add these environment variables:

### Required Variables:
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=orders@yourdomain.com
ADMIN_EMAIL=your-email@yourdomain.com
```

### Optional Variables:
```
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
ALLOWED_ORIGINS=https://your-app-domain.com,exp://localhost:19000
NODE_ENV=production
```

## Step 4: Update Your Mobile App

Once deployed, update your mobile app to use the Vercel URL:

### Update Payment Service
In `services/paymentService.ts`, change line 10:
```typescript
private static readonly BACKEND_URL = 'https://your-project-name.vercel.app';
```

### Update Email Service
In `services/emailService.ts`, change line 8:
```typescript
private static readonly BACKEND_URL = 'https://your-project-name.vercel.app';
```

## Step 5: Test Your Deployment

### Test Health Endpoint
```bash
curl https://your-project-name.vercel.app/health
```

### Test Payment Intent Creation
```bash
curl -X POST https://your-project-name.vercel.app/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 25.00, "currency": "usd"}'
```

### Test Email Notification
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

## Step 6: Set Up Custom Domain (Optional)

1. **In Vercel Dashboard**
   - Go to your project settings
   - Click **"Domains"**
   - Add your custom domain

2. **Update DNS**
   - Add the CNAME record provided by Vercel
   - Wait for DNS propagation

3. **Update Mobile App**
   - Change the BACKEND_URL to your custom domain

## Troubleshooting

### Common Issues:

1. **"Module not found" errors**
   - Make sure all dependencies are in `package.json`
   - Check that `node_modules` is in `.gitignore`

2. **Environment variables not working**
   - Verify all variables are set in Vercel dashboard
   - Check for typos in variable names
   - Redeploy after adding variables

3. **CORS errors**
   - Update `ALLOWED_ORIGINS` in environment variables
   - Include your app's domain

4. **Payment intent creation fails**
   - Verify Stripe secret key is correct
   - Check Stripe dashboard for errors

### Vercel-Specific Issues:

1. **Function timeout**
   - Vercel has a 10-second timeout for free tier
   - Consider upgrading for longer timeouts

2. **Cold starts**
   - First request might be slow
   - Subsequent requests will be faster

3. **Environment variables not updating**
   - Redeploy after changing environment variables
   - Check Vercel dashboard for variable status

## Vercel Free Tier Limits

- **Bandwidth**: 100GB/month
- **Function Execution**: 100GB-hours/month
- **Function Duration**: 10 seconds (free tier)
- **Custom Domains**: Unlimited
- **HTTPS**: Included

## Next Steps

1. **Test thoroughly** with your mobile app
2. **Monitor logs** in Vercel dashboard
3. **Set up monitoring** for production use
4. **Consider upgrading** if you need more resources

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Check deployment logs** in Vercel dashboard for errors 