import { useState, useEffect } from "react"

import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch, Modal, ActivityIndicator, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAdminAuth } from "../context/AdminAuthContext"
import { useInventoryEvents } from "../context/InventoryEvents"
import { supabaseService, Product, InventoryItem } from "../services/supabaseService"
import React from "react";

interface AdminProduct {
  id: string
  name: string
  price: number
  type: "oyster" | "merch"
  description: string
  inStock: boolean
  inventory?: number
}

interface AdminInventory {
  id: string
  variety: string
  count: number
  size: string
  age?: string
  location?: string
  health?: "excellent" | "good" | "fair"
  harvestReady?: boolean
  pricePerDozen?: number
  type?: "nursery" | "farm"
}

export default function AdminScreen() {
  const { logout } = useAdminAuth()
  const { emit: emitInventoryUpdate } = useInventoryEvents()
  const [activeTab, setActiveTab] = useState<"products" | "inventory" | "orders">("products")
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [inventory, setInventory] = useState<AdminInventory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [editingInventory, setEditingInventory] = useState<AdminInventory | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [savingInventory, setSavingInventory] = useState(false)
  const [productModalVisible, setProductModalVisible] = useState(false)
  const [productError, setProductError] = useState<string | null>(null)
  const [savingProduct, setSavingProduct] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  useEffect(() => {
    loadAdminData()
  }, [])

  const handleLogout = () => {
    if (hasUnsavedChanges) {
      Alert.alert("Unsaved Changes", "You have unsaved changes. Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout Anyway",
          style: "destructive",
          onPress: logout,
        },
      ])
    } else {
      Alert.alert("Logout", "Are you sure you want to logout from the admin panel?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: logout,
        },
      ])
    }
  }

  const loadOrders = async () => {
    try {
      setIsLoadingOrders(true)
      const allOrders = await supabaseService.getOrders()
      setOrders(allOrders)
    } catch (error) {
      console.error("Failed to load orders:", error)
      setOrders([])
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const loadAdminData = async () => {
    setIsLoading(true)
    try {
      // Debug: Check table structure first
      await supabaseService.debugTableStructure();
      
      // Load products from Supabase
      const supabaseProducts = await supabaseService.getProducts()
      const convertedProducts: AdminProduct[] = supabaseProducts.map((product: Product) => ({
        id: product.id || '',
        name: product.name,
        price: product.price,
        type: product.category === 'oysters' ? 'oyster' : 'merch',
        description: supabaseService.getProductOriginalDescription(product),
        inStock: true, // Default to true
        inventory: supabaseService.getProductInventory(product),
      }))
      setProducts(convertedProducts)

      // Load inventory from Supabase
      const supabaseInventory = await supabaseService.getInventory()
      const convertedInventory: AdminInventory[] = supabaseInventory.map((item: InventoryItem) => {
        // Parse additional data from description field
        interface AdditionalData {
          size?: string;
          age?: string;
          health?: string;
          pricePerDozen?: number;
          harvestReady?: boolean;
          location?: string;
        }
        
        let additionalData: AdditionalData = {};
        try {
          if (item.description) {
            additionalData = JSON.parse(item.description);
          }
        } catch (e) {
          console.log('Could not parse description as JSON, using as string');
        }
        
        return {
          id: item.id || '',
          variety: item.name,
          count: item.count,
          size: additionalData.size || '',
          age: additionalData.age || '',
          health: additionalData.health as any,
          harvestReady: additionalData.harvestReady,
          pricePerDozen: additionalData.pricePerDozen,
          type: item.type,
          location: additionalData.location,
        };
      })
      setInventory(convertedInventory)

      // Load orders from Supabase
      await loadOrders()
    } catch (error) {
      console.error("Failed to load admin data:", error)
      Alert.alert("Connection Error", "Failed to load data from database. Please check your internet connection and try again.")
      // Fallback to empty arrays if Supabase fails
      setProducts([])
      setInventory([])
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const saveProduct = async (product: AdminProduct) => {
    try {
      const supabaseProduct: Product = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.type === 'oyster' ? 'oysters' : 'merchandise',
      }
      
      const savedProduct = await supabaseService.saveProduct(supabaseProduct, product.inventory || 0)
      if (savedProduct) {
        const updatedProducts = products.map((p) => (p.id === product.id ? product : p))
        setProducts(updatedProducts)
        emitInventoryUpdate()
        setEditingProduct(null)
        setHasUnsavedChanges(false)
        Alert.alert("Success", "Product saved successfully! Changes will appear instantly across all screens.")
      } else {
        Alert.alert("Error", "Failed to save product to database")
      }
    } catch (error) {
      console.error("Save failed:", error)
      Alert.alert("Error", "Failed to save product. Please check your internet connection and try again.")
    }
  }

  const saveInventory = async (item: AdminInventory) => {
    try {
      console.log("AdminScreen: Saving inventory item:", item)
      
      // Store additional fields as JSON in description
      const additionalData = {
        size: item.size,
        age: item.age,
        health: item.health,
        pricePerDozen: item.pricePerDozen,
        harvestReady: item.harvestReady,
        location: item.location,
      };
      
      const supabaseItem: InventoryItem = {
        id: item.id,
        name: item.variety,
        type: item.type || 'nursery',
        count: item.count,
        description: JSON.stringify(additionalData),
      }
      
      const savedItem = await supabaseService.saveInventoryItem(supabaseItem)
      if (savedItem) {
        const updatedInventory = inventory.map((i) => (i.id === item.id ? item : i))
        setInventory(updatedInventory)
        console.log("AdminScreen: Emitting inventory update event")
        emitInventoryUpdate()
        setEditingInventory(null)
        setHasUnsavedChanges(false)
        Alert.alert("Success", "Inventory saved successfully! Changes will appear instantly across all screens.")
      } else {
        Alert.alert("Error", "Failed to save inventory to database")
      }
    } catch (error) {
      console.error("Save failed:", error)
      Alert.alert("Error", "Failed to save inventory. Please check your internet connection and try again.")
    }
  }

  const startEditingProduct = (product: AdminProduct) => {
    if (editingProduct && hasUnsavedChanges) {
      Alert.alert("Unsaved Changes", "You have unsaved changes. Save or discard them first.", [{ text: "OK" }])
      return
    }
    setEditingProduct({ ...product })
    setHasUnsavedChanges(false)
    setProductError(null)
    setProductModalVisible(true)
  }

  const cancelEditProduct = () => {
    if (hasUnsavedChanges) {
      Alert.alert("Discard Changes", "Are you sure you want to discard your changes?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            setEditingProduct(null)
            setHasUnsavedChanges(false)
            setProductModalVisible(false)
            setProductError(null)
          },
        },
      ])
    } else {
      setEditingProduct(null)
      setProductModalVisible(false)
      setProductError(null)
    }
  }

  const startEditingInventory = (item: AdminInventory) => {
    if (editingInventory && hasUnsavedChanges) {
      Alert.alert("Unsaved Changes", "You have unsaved changes. Save or discard them first.", [{ text: "OK" }])
      return
    }
    setEditingInventory({ ...item })
    setHasUnsavedChanges(false)
    setInventoryError(null)
    setInventoryModalVisible(true)
  }

  const cancelEditInventory = () => {
    if (hasUnsavedChanges) {
      Alert.alert("Discard Changes", "Are you sure you want to discard your changes?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            setEditingInventory(null)
            setHasUnsavedChanges(false)
            setInventoryModalVisible(false)
            setInventoryError(null)
          },
        },
      ])
    } else {
      setEditingInventory(null)
      setInventoryModalVisible(false)
      setInventoryError(null)
    }
  }

  const updateEditingProduct = (field: keyof AdminProduct, value: any) => {
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, [field]: value })
      setHasUnsavedChanges(true)
    }
  }

  const updateEditingInventory = (field: keyof AdminInventory, value: any) => {
    if (editingInventory) {
      setEditingInventory({ ...editingInventory, [field]: value })
      setHasUnsavedChanges(true)
    }
  }

  const addNewProduct = () => {
    Alert.prompt("Add New Product", "Enter product name:", async (name) => {
      if (name) {
        const newProduct: AdminProduct = {
          name,
          price: 0,
          type: "merch",
          description: "",
          inStock: true,
          inventory: 0,
        } as AdminProduct;
        // Save to Supabase immediately to get the UUID
        const supabaseProduct: Product = {
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          category: newProduct.type === 'oyster' ? 'oysters' : 'merchandise',
        };
        const savedProduct = await supabaseService.saveProduct(supabaseProduct);
        if (savedProduct) {
          const adminProduct: AdminProduct = {
            id: savedProduct.id || '',
            name: savedProduct.name,
            price: savedProduct.price,
            type: savedProduct.category === 'oysters' ? 'oyster' : 'merch',
            description: savedProduct.description,
            inStock: true,
            inventory: 0,
          };
          setProducts((prev) => [...prev, adminProduct]);
          startEditingProduct(adminProduct);
        } else {
          Alert.alert("Error", "Failed to create product in database");
        }
      }
    });
  }

  const addNewInventoryItem = () => {
    Alert.prompt("Add New Inventory Item", "Enter variety name:", async (variety) => {
      if (variety) {
        const newItem: AdminInventory = {
          variety,
          count: 0,
          size: "Seed (5-10mm)",
          age: "2 months",
          health: "excellent",
          type: "nursery",
        } as AdminInventory;
        // Save to Supabase immediately to get the UUID
        const supabaseItem: InventoryItem = {
          name: newItem.variety,
          type: newItem.type || 'nursery',
          count: newItem.count,
          description: `${newItem.size} - ${newItem.age}`,
        };
        const savedItem = await supabaseService.saveInventoryItem(supabaseItem);
        if (savedItem) {
          const adminInventory: AdminInventory = {
            id: savedItem.id || '',
            variety: savedItem.name,
            count: savedItem.count,
            size: newItem.size,
            age: newItem.age,
            health: newItem.health,
            type: savedItem.type || 'nursery',
          };
          setInventory((prev) => [...prev, adminInventory]);
          startEditingInventory(adminInventory);
        } else {
          Alert.alert("Error", "Failed to create inventory item in database");
        }
      }
    });
  }

  const deleteProduct = (productId: string) => {
    Alert.alert("Delete Product", "Are you sure you want to delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const deleted = await supabaseService.deleteProduct(productId)
          if (deleted) {
            const updatedProducts = products.filter((p) => p.id !== productId)
            setProducts(updatedProducts)
            emitInventoryUpdate()

            if (editingProduct?.id === productId) {
              setEditingProduct(null)
              setHasUnsavedChanges(false)
            }
          } else {
            Alert.alert("Error", "Failed to delete product from database")
          }
        },
      },
    ])
  }

  const deleteInventoryItem = (inventoryId: string) => {
    Alert.alert("Delete Inventory Item", "Are you sure you want to delete this inventory item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const deleted = await supabaseService.deleteInventoryItem(inventoryId)
          if (deleted) {
            const updatedInventory = inventory.filter((i) => i.id !== inventoryId)
            setInventory(updatedInventory)
            emitInventoryUpdate()

            if (editingInventory?.id === inventoryId) {
              setEditingInventory(null)
              setHasUnsavedChanges(false)
            }
          } else {
            Alert.alert("Error", "Failed to delete inventory item from database")
          }
        },
      },
    ])
  }

  const validateInventory = (item: AdminInventory) => {
    if (!item.variety || !item.size) return "Variety and size are required."
    if (item.count == null || isNaN(item.count) || item.count < 0) return "Count must be 0 or greater."
    if (item.pricePerDozen != null && (isNaN(item.pricePerDozen) || item.pricePerDozen < 0)) return "Price per dozen must be 0 or greater."
    return null
  }

  const saveInventoryModal = async () => {
    if (!editingInventory) return
    const error = validateInventory(editingInventory)
    if (error) {
      setInventoryError(error)
      return
    }
    setSavingInventory(true)
    try {
      await saveInventory(editingInventory)
      setInventoryModalVisible(false)
      setEditingInventory(null)
      setInventoryError(null)
    } catch (e) {
      setInventoryError("Failed to save. Please try again.")
    } finally {
      setSavingInventory(false)
    }
  }

  const validateProduct = (product: AdminProduct) => {
    if (!product.name.trim()) return "Product name is required."
    if (product.price == null || isNaN(product.price) || product.price < 0) return "Price must be 0 or greater."
    if (product.inventory != null && (isNaN(product.inventory) || product.inventory < 0)) return "Inventory must be 0 or greater."
    return null
  }

  const saveProductModal = async () => {
    if (!editingProduct) return
    const error = validateProduct(editingProduct)
    if (error) {
      setProductError(error)
      return
    }
    setSavingProduct(true)
    try {
      await saveProduct(editingProduct)
      setProductModalVisible(false)
      setEditingProduct(null)
      setProductError(null)
    } catch (e) {
      setProductError("Failed to save. Please try again.")
    } finally {
      setSavingProduct(false)
    }
  }

  const renderProductCard = (product: AdminProduct) => {
    return (
      <View key={product.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{product.name}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => startEditingProduct(product)}>
              <Ionicons name="pencil" size={20} color="#0891b2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProduct(product.id)}>
              <Ionicons name="trash" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.stockRow}>
          <Text style={styles.stockText}>Price: ${product.price}</Text>
          <Text style={styles.stockText}>Type: {product.type}</Text>
          {product.inventory !== undefined && <Text style={styles.stockText}>Stock: {product.inventory}</Text>}
        </View>
        {product.description && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {product.description}
          </Text>
        )}
      </View>
    )
  }

  const renderInventoryCard = (item: AdminInventory) => {
    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.variety}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => startEditingInventory(item)}>
              <Ionicons name="pencil" size={20} color="#0891b2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteInventoryItem(item.id)}>
              <Ionicons name="trash" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.stockRow}>
          <Text style={styles.stockText}>Count: {item.count}</Text>
          {item.size && <Text style={styles.stockText}>Size: {item.size}</Text>}
          {item.pricePerDozen != null && <Text style={styles.stockText}>${item.pricePerDozen}/dozen</Text>}
        </View>
      </View>
    )
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const success = await supabaseService.updateOrderStatus(orderId, status)
      if (success) {
        // Reload orders to reflect the change
        await loadOrders()
        Alert.alert("Success", `Order status updated to ${status}`)
      } else {
        Alert.alert("Error", "Failed to update order status")
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
      Alert.alert("Error", "Failed to update order status")
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={activeTab === "products" ? addNewProduct : addNewInventoryItem}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={() => {
            setIsLoading(true)
            loadAdminData()
          }}>
            <Ionicons name="refresh" size={24} color="#0891b2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>

      {hasUnsavedChanges && (
        <View style={styles.unsavedBanner}>
          <Ionicons name="warning" size={16} color="#f59e0b" />
          <Text style={styles.unsavedText}>You have unsaved changes</Text>
        </View>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "products" && styles.activeTab]}
          onPress={() => setActiveTab("products")}
        >
          <Text style={[styles.tabText, activeTab === "products" && styles.activeTabText]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "inventory" && styles.activeTab]}
          onPress={() => setActiveTab("inventory")}
        >
          <Text style={[styles.tabText, activeTab === "inventory" && styles.activeTabText]}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "orders" && styles.activeTab]}
          onPress={() => setActiveTab("orders")}
        >
          <Text style={[styles.tabText, activeTab === "orders" && styles.activeTabText]}>Orders</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              setIsLoading(true)
              loadAdminData()
            }}
            colors={["#0891b2"]}
            tintColor="#0891b2"
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {activeTab === "products" && products.map(renderProductCard)}
            {activeTab === "inventory" && (
              <>
                <Text style={styles.sectionHeader}>Nursery Inventory</Text>
                {inventory.filter((item) => item.type === "nursery" || !item.type).map(renderInventoryCard)}
                <Text style={styles.sectionHeader}>Farm Inventory</Text>
                {inventory.filter((item) => item.type === "farm").map(renderInventoryCard)}
              </>
            )}
            {activeTab === "orders" && (
              <>
                {isLoadingOrders ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading orders...</Text>
                  </View>
                ) : orders.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={64} color="#94a3b8" />
                    <Text style={styles.emptyStateText}>No orders yet</Text>
                    <Text style={styles.emptyStateSubtext}>Customer orders will appear here</Text>
                  </View>
                ) : (
                  orders.map((order) => (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <Text style={styles.orderId}>Order #{order.id}</Text>
                        <View style={[
                          styles.statusBadge,
                          order.status === 'confirmed' && styles.statusConfirmed,
                          order.status === 'pending' && styles.statusPending,
                          order.status === 'cancelled' && styles.statusCancelled
                        ]}>
                          <Text style={styles.statusText}>{order.status}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.orderInfo}>
                        <Text style={styles.customerName}>{order.customer_name}</Text>
                        <Text style={styles.customerEmail}>{order.customer_email}</Text>
                        <Text style={styles.orderDate}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </Text>
                        <Text style={styles.orderTotal}>Total: ${order.total_amount}</Text>
                        {(() => {
                          const paymentInfo = supabaseService.getOrderPaymentInfo(order);
                          if (paymentInfo.payment_intent_id) {
                            return (
                              <Text style={styles.paymentInfo}>
                                Payment ID: {paymentInfo.payment_intent_id}
                              </Text>
                            );
                          }
                          return null;
                        })()}
                      </View>
                      
                      <View style={styles.orderItems}>
                        <Text style={styles.itemsTitle}>Items:</Text>
                        {order.items.map((item: any, index: number) => (
                          <Text key={index} style={styles.orderItem}>
                            • {item.name} (Qty: {item.quantity}) - ${(item.price * item.quantity).toFixed(2)}
                          </Text>
                        ))}
                      </View>
                      
                      <View style={styles.orderActions}>
                        {order.status === 'pending' && (
                          <>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.confirmButton]}
                              onPress={() => updateOrderStatus(order.id, 'confirmed')}
                            >
                              <Text style={styles.actionButtonText}>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.cancelButton]}
                              onPress={() => updateOrderStatus(order.id, 'cancelled')}
                            >
                              <Text style={styles.actionButtonText}>Cancel</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
      
      {/* Product Edit Modal */}
      <Modal
        visible={productModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Keyboard.dismiss()
          cancelEditProduct()
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView 
                style={styles.modalContent} 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
            <Text style={styles.modalTitle}>Edit Product</Text>
            {productError && <Text style={styles.errorText}>{productError}</Text>}
            {editingProduct && (
              <>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Name:</Text>
                  <TextInput
                    style={styles.inventoryInput}
                    value={editingProduct.name}
                    onChangeText={(text) => updateEditingProduct("name", text)}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Price: $</Text>
                  <TextInput
                    style={styles.inventoryInput}
                    value={editingProduct.price?.toString() || ""}
                    onChangeText={(text) => updateEditingProduct("price", parseFloat(text) || 0)}
                    keyboardType="numeric"
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Type:</Text>
                  <View style={styles.typeButtons}>
                    {["oyster", "merch"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          editingProduct.type === type && styles.activeTypeButton,
                        ]}
                        onPress={() => updateEditingProduct("type", type as "oyster" | "merch")}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            editingProduct.type === type && styles.activeTypeButtonText,
                          ]}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Stock:</Text>
                  <TextInput
                    style={styles.inventoryInput}
                    value={editingProduct.inventory?.toString() || ""}
                    onChangeText={(text) => updateEditingProduct("inventory", parseInt(text) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Description:</Text>
                </View>
                <TextInput
                  style={styles.descriptionInput}
                  value={editingProduct.description}
                  onChangeText={(text) => updateEditingProduct("description", text)}
                  multiline
                  numberOfLines={3}
                  placeholder="Product description..."
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  blurOnSubmit={true}
                />
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>In Stock:</Text>
                  <Switch
                    value={editingProduct.inStock}
                    onValueChange={(value) => updateEditingProduct("inStock", value)}
                    trackColor={{ false: "#f87171", true: "#10b981" }}
                    thumbColor="#ffffff"
                  />
                </View>
              </>
            )}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.saveButton, savingProduct && styles.disabledButton]}
                onPress={saveProductModal}
                disabled={savingProduct}
              >
                {savingProduct ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEditProduct}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Inventory Edit Modal */}
      <Modal
        visible={inventoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Keyboard.dismiss()
          cancelEditInventory()
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView 
                style={[styles.modalContent, { maxHeight: '90%' }]} 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Inventory</Text>
              {inventoryError && <Text style={styles.errorText}>{inventoryError}</Text>}
              {editingInventory && (
                <>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Type:</Text>
                    <View style={styles.typeButtons}>
                      {["nursery", "farm"].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.typeButton,
                            editingInventory.type === type && styles.activeTypeButton,
                          ]}
                          onPress={() => updateEditingInventory("type", type as "nursery" | "farm")}
                        >
                          <Text
                            style={[
                              styles.typeButtonText,
                              editingInventory.type === type && styles.activeTypeButtonText,
                            ]}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Variety:</Text>
                    <TextInput
                      style={styles.inventoryInput}
                      value={editingInventory.variety}
                      onChangeText={(text) => updateEditingInventory("variety", text)}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Count:</Text>
                    <TextInput
                      style={styles.inventoryInput}
                      value={editingInventory.count?.toString() || ""}
                      onChangeText={(text) => updateEditingInventory("count", parseInt(text) || 0)}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Size:</Text>
                    <TextInput
                      style={styles.inventoryInput}
                      value={editingInventory.size || ""}
                      onChangeText={(text) => updateEditingInventory("size", text)}
                      placeholder="e.g. Seed (5-10mm)"
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Age:</Text>
                    <TextInput
                      style={styles.inventoryInput}
                      value={editingInventory.age || ""}
                      onChangeText={(text) => updateEditingInventory("age", text)}
                      placeholder="e.g. 2 months"
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Health:</Text>
                    <View style={styles.healthButtons}>
                      {["excellent", "good", "fair"].map((health) => (
                        <TouchableOpacity
                          key={health}
                          style={[
                            styles.healthButton,
                            editingInventory.health === health && styles.activeHealthButton,
                          ]}
                          onPress={() => updateEditingInventory("health", health)}
                        >
                          <Text
                            style={[
                              styles.healthButtonText,
                              editingInventory.health === health && styles.activeHealthButtonText,
                            ]}
                          >
                            {health.charAt(0).toUpperCase() + health.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Price per Dozen only for farm */}
                  {editingInventory.type === 'farm' && (
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Price/Dozen:</Text>
                      <TextInput
                        style={styles.inventoryInput}
                        value={editingInventory.pricePerDozen?.toString() || ""}
                        onChangeText={(text) => updateEditingInventory("pricePerDozen", parseFloat(text) || 0)}
                        keyboardType="numeric"
                        placeholder="e.g. 24"
                      />
                    </View>
                  )}

                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Harvest Ready:</Text>
                    <Switch
                      value={!!editingInventory.harvestReady}
                      onValueChange={(value) => updateEditingInventory("harvestReady", value)}
                      trackColor={{ false: "#f87171", true: "#10b981" }}
                      thumbColor="#ffffff"
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Location:</Text>
                    <TextInput
                      style={styles.inventoryInput}
                      value={editingInventory.location || ""}
                      onChangeText={(text) => updateEditingInventory("location", text)}
                      placeholder="e.g. Bay Section A"
                    />
                  </View>
                </>
              )}
            </ScrollView>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.saveButton, savingInventory && styles.disabledButton]}
                onPress={saveInventoryModal}
                disabled={savingInventory}
              >
                {savingInventory ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEditInventory}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
              </KeyboardAvoidingView>
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
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  addButton: {
    backgroundColor: "#059669",
    padding: 8,
    borderRadius: 8,
  },
  refreshButton: {
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
  unsavedBanner: {
    backgroundColor: "#fef3c7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#fbbf24",
  },
  unsavedText: {
    color: "#92400e",
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#0891b2",
  },
  tabText: {
    fontSize: 16,
    color: "#64748b",
  },
  activeTabText: {
    color: "#0891b2",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    color: "#64748b",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editingCard: {
    borderWidth: 2,
    borderColor: "#0891b2",
    backgroundColor: "#f0f9ff",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    flex: 1,
    flexWrap: 'wrap',
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: "#059669",
    padding: 8,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: "#dc2626",
    padding: 8,
    borderRadius: 6,
  },
  editingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  editingText: {
    color: "#0891b2",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
    flexWrap: 'wrap',
  },
  stockText: {
    fontSize: 16,
    color: "#374151",
    flexShrink: 1,
    minWidth: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    color: "#374151",
    width: 100,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  inventoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
    marginBottom: 8,
  },
  disabledInput: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  activeTypeButton: {
    backgroundColor: "#0891b2",
    borderColor: "#0891b2",
  },
  disabledButton: {
    opacity: 0.6,
  },
  typeButtonText: {
    fontSize: 14,
    color: "#64748b",
  },
  activeTypeButtonText: {
    color: "#fff",
  },
  comingSoon: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
  },
  comingSoonNote: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    fontStyle: "italic",
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  healthButtons: {
    flexDirection: "row",
    flex: 1,
    gap: 8,
  },
  healthButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    flex: 1,
    alignItems: "center",
  },
  activeHealthButton: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  healthButtonText: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "capitalize",
  },
  activeHealthButtonText: {
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#64748b",
  },
  typeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  descriptionText: {
    color: "#64748b",
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
  },
  statusConfirmed: {
    backgroundColor: "#d1fae5",
  },
  statusPending: {
    backgroundColor: "#fef2f2",
  },
  statusCancelled: {
    backgroundColor: "#fef2f2",
  },
  statusText: {
    fontSize: 14,
    color: "#155e75",
    fontWeight: "bold",
  },
  orderInfo: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "bold",
  },
  customerEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  orderDate: {
    fontSize: 14,
    color: "#64748b",
  },
  orderTotal: {
    fontSize: 14,
    color: "#64748b",
  },
  orderItems: {
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  orderItem: {
    fontSize: 14,
    color: "#64748b",
  },
  orderActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#0891b2",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  confirmButton: {
    backgroundColor: "#10b981",
  },
  cancelButton: {
    backgroundColor: "#dc2626",
  },
  paymentInfo: {
    fontSize: 14,
    color: "#64748b",
  },
})
