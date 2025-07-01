import AsyncStorage from "@react-native-async-storage/async-storage"

export interface Product {
  id: string
  name: string
  price: number
  type: "oyster" | "merch"
  description: string
  inStock: boolean
  inventory?: number
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  type: "oyster" | "merch"
  image?: string
}

export class InventoryService {
  // Update inventory when items are purchased
  static async updateInventoryAfterPurchase(items: CartItem[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current products
      const savedProducts = await AsyncStorage.getItem("admin_products")
      if (!savedProducts) {
        return { success: false, error: "No products found" }
      }

      const products: Product[] = JSON.parse(savedProducts)
      const updatedProducts = [...products]

      // Update inventory for each purchased item
      for (const cartItem of items) {
        const productIndex = updatedProducts.findIndex(p => p.id === cartItem.id)
        if (productIndex !== -1) {
          const product = updatedProducts[productIndex]
          if (product.inventory !== undefined) {
            const newInventory = product.inventory - cartItem.quantity
            updatedProducts[productIndex] = {
              ...product,
              inventory: Math.max(0, newInventory),
              inStock: newInventory > 0
            }
          }
        }
      }

      // Save updated products
      await AsyncStorage.setItem("admin_products", JSON.stringify(updatedProducts))
      
      console.log('Inventory updated after purchase:', items.map(item => `${item.name}: -${item.quantity}`))
      
      return { success: true }
    } catch (error) {
      console.error('Inventory update failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Check if items are available in stock
  static async checkStockAvailability(items: CartItem[]): Promise<{ available: boolean; unavailableItems: string[] }> {
    try {
      const savedProducts = await AsyncStorage.getItem("admin_products")
      if (!savedProducts) {
        return { available: false, unavailableItems: items.map(item => item.name) }
      }

      const products: Product[] = JSON.parse(savedProducts)
      const unavailableItems: string[] = []

      for (const cartItem of items) {
        const product = products.find(p => p.id === cartItem.id)
        if (!product) {
          unavailableItems.push(cartItem.name)
        } else if (product.inventory !== undefined && product.inventory < cartItem.quantity) {
          unavailableItems.push(cartItem.name)
        } else if (!product.inStock) {
          unavailableItems.push(cartItem.name)
        }
      }

      return {
        available: unavailableItems.length === 0,
        unavailableItems
      }
    } catch (error) {
      console.error('Stock check failed:', error)
      return { available: false, unavailableItems: items.map(item => item.name) }
    }
  }

  // Get current inventory levels
  static async getInventoryLevels(): Promise<Product[]> {
    try {
      const savedProducts = await AsyncStorage.getItem("admin_products")
      if (!savedProducts) {
        return []
      }
      return JSON.parse(savedProducts)
    } catch (error) {
      console.error('Failed to get inventory levels:', error)
      return []
    }
  }
} 