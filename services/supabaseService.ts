import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://cyvjjodvdxunklglgbrw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dmpqb2R2ZHh1bmtsZ2xnYnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MzEyMjksImV4cCI6MjA2NzAwNzIyOX0.H5HlLXxt7Lxnq9eKg8ho_4HHzNSTe_c7TWt6nYU_p1w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  created_at?: string;
}

export interface InventoryItem {
  id?: string;
  name: string;
  type: 'nursery' | 'farm';
  count: number;
  description?: string;
  size?: string;
  age?: string;
  health?: string;
  pricePerDozen?: number;
  harvestReady?: boolean;
  location?: string;
  created_at?: string;
}

export interface Order {
  id?: string;
  customer_name: string;
  customer_email: string;
  items: any[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  created_at?: string;
}

export interface InventoryStatistics {
  total_nursery: number;
  total_farm: number;
  total_products: number;
}

class SupabaseService {
  // Debug function to check table structure
  async debugTableStructure(): Promise<void> {
    try {
      console.log('Checking inventory table structure...');
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .limit(1);

      if (error) {
        console.error('Error checking table structure:', error);
        return;
      }

      console.log('Sample inventory data:', data);
      if (data && data.length > 0) {
        console.log('Available fields in first record:', Object.keys(data[0]));
      }
    } catch (err) {
      console.error('Debug function error:', err);
    }
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  }

  async saveProduct(product: Product, inventory?: number): Promise<Product | null> {
    try {
      // If inventory is provided, store it as JSON in description
      let finalDescription = product.description;
      if (inventory !== undefined) {
        const additionalData = {
          originalDescription: product.description,
          inventory: inventory
        };
        finalDescription = JSON.stringify(additionalData);
      }

      const productData = {
        ...product,
        description: finalDescription
      };

      const { data, error } = await supabase
        .from('products')
        .upsert(productData)
        .select()
        .single();

      if (error) {
        console.error('Error saving product:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving product:', error);
      return null;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }

    return true;
  }

  // Inventory
  async getInventory(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }

    return data || [];
  }

  async getInventoryByType(type: 'nursery' | 'farm'): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory by type:', error);
      return [];
    }

    return data || [];
  }

  async saveInventoryItem(item: InventoryItem): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory')
      .upsert(item)
      .select()
      .single();

    if (error) {
      console.error('Error saving inventory item:', error);
      return null;
    }

    return data;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting inventory item:', error);
      return false;
    }

    return true;
  }

  async updateInventoryAfterPurchase(items: any[]): Promise<boolean> {
    for (const item of items) {
      const { error } = await supabase
        .from('inventory')
        .update({ count: item.newCount })
        .eq('id', item.id);

      if (error) {
        console.error('Error updating inventory after purchase:', error);
        return false;
      }
    }

    return true;
  }

  // Parse product inventory from JSON description
  getProductInventory(product: Product): number {
    try {
      if (product.description) {
        const parsed = JSON.parse(product.description);
        if (parsed.inventory !== undefined) {
          return parsed.inventory;
        }
      }
    } catch (e) {
      // If parsing fails, return 0 (no inventory)
      console.log('Could not parse product description as JSON, assuming no inventory');
    }
    return 0;
  }

  // Get original description from JSON
  getProductOriginalDescription(product: Product): string {
    try {
      if (product.description) {
        const parsed = JSON.parse(product.description);
        if (parsed.originalDescription) {
          return parsed.originalDescription;
        }
      }
    } catch (e) {
      // If parsing fails, return the description as-is
    }
    return product.description;
  }

  // Check stock availability for order items
  async checkStockAvailability(items: any[]): Promise<boolean> {
    for (const item of items) {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.id)
        .single();

      if (error) {
        console.error('Error checking stock for product:', item.id, error);
        return false;
      }

      const currentInventory = this.getProductInventory(product);
      if (currentInventory < item.quantity) {
        console.log(`Product ${item.name} has insufficient stock: ${currentInventory} available, ${item.quantity} requested`);
        return false;
      }
    }

    return true;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data || [];
  }

  async createOrder(orderData: {
    customer_name: string;
    customer_email: string;
    items: any[];
    total_amount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    payment_intent_id?: string;
    stripe_session_id?: string;
  }): Promise<Order | null> {
    try {
      // Add payment information to the items array as metadata
      const orderItems = orderData.items.map(item => ({
        ...item,
        payment_metadata: {
          payment_intent_id: orderData.payment_intent_id,
          stripe_session_id: orderData.stripe_session_id,
          order_timestamp: new Date().toISOString()
        }
      }));

      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          items: orderItems,
          total_amount: orderData.total_amount,
          status: orderData.status,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return false;
    }

    return true;
  }

  // Update product inventory after order
  async updateProductInventory(productId: string, quantity: number): Promise<boolean> {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('Error fetching product inventory:', fetchError);
      return false;
    }

    const currentInventory = this.getProductInventory(product);
    const newInventory = Math.max(0, currentInventory - quantity);
    const originalDescription = this.getProductOriginalDescription(product);

    // Create new JSON description with updated inventory
    const additionalData = {
      originalDescription: originalDescription,
      inventory: newInventory
    };
    const newDescription = JSON.stringify(additionalData);

    const { error: updateError } = await supabase
      .from('products')
      .update({ description: newDescription })
      .eq('id', productId);

    if (updateError) {
      console.error('Error updating product inventory:', updateError);
      return false;
    }

    return true;
  }

  // Extract payment information from order items metadata
  getOrderPaymentInfo(order: Order): { payment_intent_id?: string; stripe_session_id?: string } {
    if (!order.items || order.items.length === 0) {
      return {};
    }

    // Get payment info from the first item's metadata
    const firstItem = order.items[0];
    if (firstItem.payment_metadata) {
      return {
        payment_intent_id: firstItem.payment_metadata.payment_intent_id,
        stripe_session_id: firstItem.payment_metadata.stripe_session_id
      };
    }

    return {};
  }

  // Get orders by status
  async getOrdersByStatus(status: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders by status:', error);
      return [];
    }

    return data || [];
  }

  // Process order and update inventory
  async processOrder(orderId: string, items: any[]): Promise<boolean> {
    // Check stock availability for order items
    const stockAvailable = await this.checkStockAvailability(items);
    if (!stockAvailable) {
      return false;
    }

    // Update inventory for each item
    for (const item of items) {
      const success = await this.updateProductInventory(item.id, item.quantity);
      if (!success) {
        console.error(`Failed to update inventory for product ${item.id}`);
        return false;
      }
    }

    // Update order status to confirmed
    const success = await this.updateOrderStatus(orderId, 'confirmed');
    return success;
  }

  // Statistics
  async getInventoryStatistics(): Promise<InventoryStatistics> {
    const { data: nurseryData } = await supabase
      .from('inventory')
      .select('count')
      .eq('type', 'nursery');

    const { data: farmData } = await supabase
      .from('inventory')
      .select('count')
      .eq('type', 'farm');

    const { data: productsData } = await supabase
      .from('products')
      .select('id');

    const totalNursery = nurseryData?.reduce((sum, item) => sum + item.count, 0) || 0;
    const totalFarm = farmData?.reduce((sum, item) => sum + item.count, 0) || 0;
    const totalProducts = productsData?.length || 0;

    return {
      total_nursery: totalNursery,
      total_farm: totalFarm,
      total_products: totalProducts,
    };
  }

  // Initialize default data
  async initializeDefaultData(): Promise<void> {
    // Check if data already exists
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (existingProducts && existingProducts.length > 0) {
      console.log('Data already exists, skipping initialization');
      return;
    }

    console.log('Database is empty, ready for manual data entry');
  }
}

export const supabaseService = new SupabaseService(); 