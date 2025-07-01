import { Alert } from 'react-native';

const STRIPE_SECRET_KEY = 'sk_test_51Re5snHIi0O9tm0E7Mwg3KZyiztanHmBwUHk1DubMe0lfMNAKvLro1Q5BmAm1bgCNsfqNKhzSfIq0ucUAjkD0ZFf00l9wgCfPG'; // Replace with your actual key
const STRIPE_API_URL = 'https://api.stripe.com/v1';

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export class PaymentService {
  // Backend server URL - update this to your actual backend URL
  private static readonly BACKEND_URL = 'http://localhost:3000';
  // For production, use: 'https://your-backend-domain.com'

  static async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/create-payment-intent`, {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const paymentIntent = await response.json();
      console.log('Payment intent created successfully:', paymentIntent.id);
      
      return paymentIntent;
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  // This method is not needed when using Stripe React Native SDK
  // The SDK handles payment confirmation internally
  static async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
    throw new Error('This method is not used with Stripe React Native SDK');
  }
}