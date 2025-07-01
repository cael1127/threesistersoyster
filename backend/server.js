require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3000', 'http://localhost:19006', 'exp://localhost:19000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Create payment intent endpoint
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid amount. Amount must be greater than 0.' 
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        created_at: new Date().toISOString()
      }
    });

    console.log(`Payment intent created: ${paymentIntent.id} for amount: $${amount}`);

    res.json({
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send order notification email endpoint
app.post('/send-order-notification', async (req, res) => {
  try {
    const {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      total,
      timestamp
    } = req.body;

    // Validate required fields
    if (!orderId || !customerName || !customerEmail || !items || !total) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Format email content
    const emailContent = formatOrderEmail({
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      total,
      timestamp
    });

    // Send email
    const msg = {
      to: process.env.ADMIN_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `New Order Received - ${orderId}`,
      html: emailContent,
    };

    await sgMail.send(msg);

    console.log(`Order notification email sent for order: ${orderId}`);

    res.json({ 
      success: true, 
      message: 'Order notification email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending order notification:', error);
    res.status(500).json({ 
      error: 'Failed to send order notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Stripe webhook endpoint for payment events (optional)
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  // Skip webhook processing if no webhook secret is configured
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('Webhook endpoint called but no webhook secret configured - skipping');
    return res.json({ received: true, message: 'Webhook processing disabled' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`Payment succeeded: ${paymentIntent.id}`);
      // Handle successful payment
      break;
    
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`Payment failed: ${failedPayment.id}`);
      // Handle failed payment
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Helper function to format order email
function formatOrderEmail(orderData) {
  const itemsList = orderData.items
    .map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>$${item.price.toFixed(2)}</td><td>$${(item.price * item.quantity).toFixed(2)}</td></tr>`)
    .join('');
  
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0891b2;">New Order Received</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p><strong>Date:</strong> ${new Date(orderData.timestamp).toLocaleString()}</p>
          <p><strong>Total:</strong> $${orderData.total.toFixed(2)}</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${orderData.customerName}</p>
          <p><strong>Email:</strong> ${orderData.customerEmail}</p>
          <p><strong>Phone:</strong> ${orderData.customerPhone || 'Not provided'}</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Shipping Address</h3>
          <p>${orderData.shippingAddress.address}</p>
          <p>${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #e2e8f0;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #cbd5e1;">Item</th>
                <th style="padding: 10px; text-align: center; border-bottom: 1px solid #cbd5e1;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #cbd5e1;">Price</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #cbd5e1;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          <div style="text-align: right; margin-top: 20px; font-weight: bold; font-size: 18px;">
            Total: $${orderData.total.toFixed(2)}
          </div>
        </div>
      </body>
    </html>
  `;
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Three Sisters Oyster backend server running on port ${PORT}`);
  console.log(`📧 Email notifications will be sent to: ${process.env.ADMIN_EMAIL}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
}); 