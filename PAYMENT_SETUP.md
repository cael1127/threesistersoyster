# Payment Setup Guide

## Current Implementation

The app currently uses a **mock payment system** for testing purposes. This allows you to test all the features (inventory management, email notifications, quantity selection) without processing real payments.

## Setting Up Real Payments

To enable real payment processing, you'll need to set up a backend server. Here are the steps:

### 1. Backend Server Setup

You can use any backend technology (Node.js, Python, PHP, etc.). Here's an example using Node.js with Express:

```javascript
// server.js
const express = require('express');
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY');
const app = express();

app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json(paymentIntent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 2. Update Payment Service

Replace the mock implementation in `services/paymentService.ts` with:

```typescript
static async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<PaymentIntent> {
  try {
    const response = await fetch('https://your-backend-url.com/create-payment-intent', {
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

### 3. Update CheckoutScreen

Remove the mock payment logic and use the real Stripe confirmation:

```typescript
// In CheckoutScreen.tsx, replace the mock payment logic with:
const { error, paymentIntent: confirmedPayment } = await confirmPayment(
  paymentIntent.client_secret,
  {
    paymentMethodType: 'Card',
    paymentMethodData: {
      billingDetails: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: {
          line1: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          postalCode: customerInfo.zipCode,
          country: 'US',
        },
      },
    },
  }
);

if (error) {
  Alert.alert("Payment Failed", error.message);
  return;
}

if (confirmedPayment?.status === 'Succeeded') {
  // Process order...
}
```

## Email Service Setup

The current email service logs emails to the console. To send real emails:

1. **Option 1: Use a service like SendGrid**
   ```javascript
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey('YOUR_SENDGRID_API_KEY');
   
   await sgMail.send({
     to: 'your-email@threesistersoyster.com',
     from: 'orders@threesistersoyster.com',
     subject: `New Order - ${orderId}`,
     html: emailContent,
   });
   ```

2. **Option 2: Use AWS SES**
3. **Option 3: Use Mailgun**

## Environment Variables

Create a `.env` file for your backend:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
SENDGRID_API_KEY=your_sendgrid_key_here
```

## Testing

- Use Stripe test cards: `4242 4242 4242 4242`
- Test different scenarios: insufficient funds, expired cards, etc.
- Monitor Stripe dashboard for test transactions

## Production Checklist

- [ ] Set up production Stripe keys
- [ ] Configure webhook endpoints for payment events
- [ ] Set up proper email service
- [ ] Implement order management system
- [ ] Add error handling and logging
- [ ] Set up SSL certificates
- [ ] Configure proper security headers
- [ ] Test all payment scenarios 