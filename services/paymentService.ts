// Payment service for handling Stripe payments
// This service communicates with the backend server for payment processing

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export class PaymentService {
  // Backend server URL - update this to your actual backend URL
  private static readonly BACKEND_URL = 'https://back-oyster.vercel.app';
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