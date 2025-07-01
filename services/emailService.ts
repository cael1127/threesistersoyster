// Email service for sending order notifications
// Note: In a production app, you would use a proper email service like SendGrid, Mailgun, or AWS SES

export interface OrderEmailData {
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: {
    address: string
    city: string
    state: string
    zipCode: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  timestamp: string
}

export class EmailService {
  // Backend server URL - update this to your actual backend URL
  private static readonly BACKEND_URL = 'https://back-oyster.vercel.app';
  // For production, use: 'https://your-backend-domain.com'

  static async sendOrderNotification(orderData: OrderEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/send-order-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send email notification');
      }

      const result = await response.json();
      console.log('Email notification sent successfully:', result.message);
      
      return { success: true };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  private static formatOrderEmail(orderData: OrderEmailData): string {
    const itemsList = orderData.items
      .map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>$${item.price.toFixed(2)}</td><td>$${(item.price * item.quantity).toFixed(2)}</td></tr>`)
      .join('')
    
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
            <p><strong>Phone:</strong> ${orderData.customerPhone}</p>
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
    `
  }
} 