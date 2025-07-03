const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Initialize Stripe with your secret key
const stripe = Stripe('sk_test_51Re5snHIi0O9tm0E7Mwg3KZyiztanHmBwUHk1DubMe0lfMNAKvLro1Q5BmAm1bgCNsfqNKhzSfIq0ucUAjkD0ZFf00l9wgCfPG');

// Initialize Supabase client
const supabase = createClient(
  'https://cyvjjodvdxunklglgbrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dmpqb2R2ZHh1bmtsZ2xnYnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQzMTIyOSwiZXhwIjoyMDY3MDA3MjI5fQ.bIVsJ00nnhcvBWTR4dPIgKn-1RNYb-jXByidvbKnAA4'
);

const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));

app.post('/webhook', async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    // Get the webhook secret from Stripe CLI output
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      'whsec_a9b11be7b59497ebbde0bba7f3917a131a38a28ab6dc671f7843365a804fc63e'
    );
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return response.sendStatus(400);
  }

  console.log('✅ Received event:', event.type);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('💰 Payment received! Session:', session.id);
      
      // Update order status in Supabase
      try {
        // Find orders that contain this payment intent in their items metadata
        const { data: orders, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'pending');
        
        if (fetchError) {
          console.error('❌ Error fetching orders:', fetchError);
          break;
        }

        // Find the order that matches this payment intent
        const matchingOrder = orders.find(order => {
          return order.items.some(item => 
            item.payment_metadata && 
            (item.payment_metadata.payment_intent_id === session.payment_intent ||
             item.payment_metadata.stripe_session_id === session.id)
          );
        });

        if (matchingOrder) {
          // Update the order status
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'confirmed' })
            .eq('id', matchingOrder.id);
          
          if (updateError) {
            console.error('❌ Error updating order in Supabase:', updateError);
          } else {
            console.log('✅ Order status updated in Supabase for order:', matchingOrder.id);
          }
        } else {
          console.log('⚠️ No matching order found for payment intent:', session.payment_intent);
        }
      } catch (error) {
        console.error('❌ Error updating order:', error);
      }
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('💳 Payment succeeded:', paymentIntent.id);
      
      // Update order status in Supabase when payment succeeds
      try {
        // Find orders that contain this payment intent in their items metadata
        const { data: orders, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'pending');
        
        if (fetchError) {
          console.error('❌ Error fetching orders:', fetchError);
          break;
        }

        // Find the order that matches this payment intent
        const matchingOrder = orders.find(order => {
          return order.items.some(item => 
            item.payment_metadata && 
            item.payment_metadata.payment_intent_id === paymentIntent.id
          );
        });

        if (matchingOrder) {
          // Update the order status to confirmed
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'confirmed' })
            .eq('id', matchingOrder.id);
          
          if (updateError) {
            console.error('❌ Error updating order in Supabase:', updateError);
          } else {
            console.log('✅ Order status updated to confirmed for order:', matchingOrder.id);
          }
        } else {
          console.log('⚠️ No matching order found for payment intent:', paymentIntent.id);
        }
      } catch (error) {
        console.error('❌ Error updating order:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ Payment failed:', failedPayment.id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  response.json({ received: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Stripe webhook server is running' });
});

const PORT = 4242;
app.listen(PORT, () => {
  console.log(`🚀 Stripe webhook server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
}); 