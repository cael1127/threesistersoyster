// Simple test script for the backend
const https = require('https');

const BASE_URL = 'https://back-oyster.vercel.app';

// Test health endpoint
async function testHealth() {
  console.log('Testing health endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check passed:', data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

// Test payment intent creation
async function testPaymentIntent() {
  console.log('\nTesting payment intent creation...');
  try {
    const response = await fetch(`${BASE_URL}/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 25.00,
        currency: 'usd'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Payment intent failed:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Payment intent created:', data);
  } catch (error) {
    console.log('❌ Payment intent failed:', error.message);
  }
}

// Test email notification
async function testEmail() {
  console.log('\nTesting email notification...');
  try {
    const response = await fetch(`${BASE_URL}/send-order-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 'TSO-TEST-123',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        shippingAddress: {
          address: '123 Test St',
          city: 'Test City',
          state: 'OR',
          zipCode: '97201'
        },
        items: [
          {
            name: 'Test Oysters',
            quantity: 1,
            price: 25.00
          }
        ],
        total: 25.00,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Email test failed:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Email test passed:', data);
  } catch (error) {
    console.log('❌ Email test failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing Three Sisters Oyster Backend\n');
  console.log('URL:', BASE_URL);
  console.log('='.repeat(50));
  
  await testHealth();
  await testPaymentIntent();
  await testEmail();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Testing complete!');
}

runTests(); 