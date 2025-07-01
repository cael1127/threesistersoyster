import { StripeProvider } from '@stripe/stripe-react-native';

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Re5snHIi0O9tm0EHki3FBWzXjkgGfUx6UR6ubRr9Va2MUe4QQlr90PELVgsz2ThN3KIvShoLJBSYGC5NB9XFeKp00ZLLYKXb3'; // Replace with your actual key

export const stripeConfig = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  merchantIdentifier: 'merchant.com.threesistersoyster',
  urlScheme: 'three-sisters-oyster',
};