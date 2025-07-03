"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Keyboard, TouchableWithoutFeedback } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useCart } from "../context/CartContext"
import { useFocusEffect } from "@react-navigation/native"
import { useInventoryEvents } from "../context/InventoryEvents"
import { colors } from "../config/colors"
import { supabaseService, Product as SupabaseProduct } from "../services/supabaseService"

interface Product {
  id: string
  name: string
  price: number
  type: "oyster" | "merch"
  description: string
  inStock: boolean
  inventory?: number
}

export default function OrderScreen({ navigation }: any) {
  const { state, dispatch } = useCart()
  const [activeTab, setActiveTab] = useState<"oysters" | "merch">("oysters")
  const [products, setProducts] = useState<Product[]>([])
  const { subscribe } = useInventoryEvents()
  const [quantityModalVisible, setQuantityModalVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState("1")

  // Load products when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadProducts()
    }, []),
  )

  // Subscribe to real-time product updates
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      loadProducts()
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const loadProducts = async () => {
    try {
      console.log("OrderScreen: Loading products from Supabase...")
      const supabaseProducts = await supabaseService.getProducts()
      
      // Convert Supabase products to the expected format
      const convertedProducts: Product[] = supabaseProducts.map((product: SupabaseProduct) => {
        const inventory = supabaseService.getProductInventory(product);
        return {
          id: product.id || '',
          name: product.name,
          price: product.price,
          type: product.category === 'oysters' ? 'oyster' : 'merch',
          description: supabaseService.getProductOriginalDescription(product),
          inStock: inventory > 0, // Show as in stock if inventory > 0
          inventory: inventory, // Use actual inventory from JSON
        };
      });
      
      console.log("OrderScreen: Products loaded:", convertedProducts.length)
      setProducts(convertedProducts)
    } catch (error) {
      console.error("OrderScreen: Failed to load products:", error)
      // Fallback to empty array if Supabase fails
      setProducts([])
    }
  }

  const showQuantityModal = (product: Product) => {
    if (!product.inStock) {
      Alert.alert("Out of Stock", "This item is currently unavailable.")
      return
    }

    if (product.inventory !== undefined && product.inventory <= 0) {
      Alert.alert("Out of Stock", "This item is currently out of stock.")
      return
    }

    setSelectedProduct(product)
    setQuantity("1")
    setQuantityModalVisible(true)
  }

  const addToCart = () => {
    if (!selectedProduct) return

    const quantityNum = parseInt(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid quantity.")
      return
    }

    if (selectedProduct.inventory !== undefined && quantityNum > selectedProduct.inventory) {
      Alert.alert("Insufficient Stock", `Only ${selectedProduct.inventory} items available.`)
      return
    }

    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        type: selectedProduct.type,
        quantity: quantityNum,
      },
    })

    setQuantityModalVisible(false)
    setSelectedProduct(null)
    Alert.alert("Added to Cart", `${quantityNum}x ${selectedProduct.name} has been added to your cart.`)
  }

  const oysterProducts = products.filter((p) => p.type === "oyster")
  const merchProducts = products.filter((p) => p.type === "merch")

  const renderProduct = (product: Product) => (
    <View key={product.id} style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDescription}>{product.description}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>${product.price}</Text>
          {product.inventory !== undefined && (
            <Text
              style={[
                styles.inventoryText,
                product.inventory <= 10 && styles.lowInventoryText,
                product.inventory === 0 && styles.outOfStockText,
              ]}
            >
              Stock: {product.inventory}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addButton, !product.inStock && styles.addButtonDisabled]}
        onPress={() => showQuantityModal(product)}
        disabled={!product.inStock || (product.inventory !== undefined && product.inventory <= 0)}
      >
        <Ionicons
          name={
            product.inStock && (product.inventory === undefined || product.inventory > 0)
              ? "add-circle"
              : "close-circle"
          }
          size={24}
          color={product.inStock && (product.inventory === undefined || product.inventory > 0) ? "#fff" : "#94a3b8"}
        />
        <Text style={[styles.addButtonText, !product.inStock && styles.addButtonTextDisabled]}>
          {product.inStock && (product.inventory === undefined || product.inventory > 0)
            ? "Add to Cart"
            : "Out of Stock"}
        </Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Products</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.refreshButton} onPress={loadProducts}>
            <Ionicons name="refresh" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate("Cart")}>
            <Ionicons name="basket" size={24} color="#0891b2" />
            {state.items.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{state.items.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "oysters" && styles.activeTab]}
          onPress={() => setActiveTab("oysters")}
        >
          <Text style={[styles.tabText, activeTab === "oysters" && styles.activeTabText]}>
            Bulk Oysters ({oysterProducts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "merch" && styles.activeTab]}
          onPress={() => setActiveTab("merch")}
        >
          <Text style={[styles.tabText, activeTab === "merch" && styles.activeTabText]}>
            Merchandise ({merchProducts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "oysters" ? oysterProducts.map(renderProduct) : merchProducts.map(renderProduct)}

        {((activeTab === "oysters" && oysterProducts.length === 0) ||
          (activeTab === "merch" && merchProducts.length === 0)) && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Products Available</Text>
            <Text style={styles.emptyText}>
              {activeTab === "oysters" ? "No oyster products available" : "No merchandise available"}
            </Text>
            <TouchableOpacity style={styles.refreshEmptyButton} onPress={loadProducts}>
              <Ionicons name="refresh" size={20} color="#0891b2" />
              <Text style={styles.refreshEmptyText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Quantity Selection Modal */}
      <Modal
        visible={quantityModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss()
          setQuantityModalVisible(false)
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Quantity</Text>
                <Text style={styles.modalProductName}>{selectedProduct?.name}</Text>
                <Text style={styles.modalPrice}>${selectedProduct?.price}</Text>
                
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Quantity:</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="1"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    blurOnSubmit={true}
                  />
                </View>
                
                {selectedProduct?.inventory !== undefined && (
                  <Text style={styles.stockInfo}>
                    Available: {selectedProduct.inventory} items
                  </Text>
                )}
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButtonCancel}
                    onPress={() => {
                      Keyboard.dismiss()
                      setQuantityModalVisible(false)
                    }}
                  >
                    <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButtonConfirm}
                    onPress={() => {
                      Keyboard.dismiss()
                      addToCart()
                    }}
                  >
                    <Text style={styles.modalButtonTextConfirm}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshButton: {
    padding: 8,
  },
  cartButton: {
    position: "relative",
    padding: 8,
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.success,
  },
  inventoryText: {
    fontSize: 14,
    color: colors.text.secondary,
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lowInventoryText: {
    backgroundColor: colors.warning + '20',
    color: colors.warning,
  },
  outOfStockText: {
    backgroundColor: colors.error + '20',
    color: colors.error,
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: colors.gray[100],
  },
  addButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  addButtonTextDisabled: {
    color: colors.text.tertiary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 16,
  },
  refreshEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.turquoise[50],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  refreshEmptyText: {
    color: colors.secondary,
    fontSize: 14,
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  modalProductName: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 4,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.success,
    textAlign: "center",
    marginBottom: 20,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: "600",
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 100,
    textAlign: "center",
    backgroundColor: colors.surface,
  },
  stockInfo: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: colors.gray[100],
    padding: 8,
    borderRadius: 6,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: colors.gray[100],
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonTextCancel: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextConfirm: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
})
