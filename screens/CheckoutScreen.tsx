import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useStripe, CardField } from '@stripe/stripe-react-native'
import { useCart } from "../context/CartContext"
import { PaymentService } from "../services/paymentService"
import { InventoryService } from "../services/inventoryService"
import { EmailService } from "../services/emailService"
import { useInventoryEvents } from "../context/InventoryEvents"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function CheckoutScreen({ navigation }: any) {
  const { state, dispatch } = useCart()
  const { confirmPayment } = useStripe()
  const inventoryEvents = useInventoryEvents()
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  })
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const required = ["name", "email", "phone", "address", "city", "state", "zipCode"]
    for (const field of required) {
      if (!customerInfo[field as keyof typeof customerInfo].trim()) {
        Alert.alert("Missing Information", `Please fill in your ${field}.`)
        return false
      }
    }
    
    if (paymentMethod === "card" && !cardComplete) {
      Alert.alert("Invalid Card", "Please enter valid card information.")
      return false
    }
    
    return true
  }

  const processStripePayment = async () => {
    if (!validateForm()) return

    setIsProcessing(true)

    try {
      // Check stock availability before processing payment
      const stockCheck = await InventoryService.checkStockAvailability(state.items)
      if (!stockCheck.available) {
        Alert.alert(
          "Items Out of Stock", 
          `The following items are no longer available: ${stockCheck.unavailableItems.join(", ")}`
        )
        setIsProcessing(false)
        return
      }

      // Create payment intent
      const paymentIntent = await PaymentService.createPaymentIntent(state.total)

      // Confirm payment with Stripe
      const { error, paymentIntent: confirmedPayment } = await confirmPayment(
        paymentIntent.client_secret,
        {
          paymentMethodType: 'Card',
          paymentMethodData: {
            billingDetails: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: {
                line1: customerInfo.address,
                city: customerInfo.city,
                state: customerInfo.state,
                postalCode: customerInfo.zipCode,
                country: 'US',
              },
            },
          },
        }
      )

      if (error) {
        Alert.alert("Payment Failed", error.message)
        return
      }

      if (confirmedPayment?.status === 'Succeeded') {
        // Generate a unique order ID
        const orderId = `TSO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Update inventory
        const inventoryResult = await InventoryService.updateInventoryAfterPurchase(state.items)
        if (!inventoryResult.success) {
          console.error('Inventory update failed:', inventoryResult.error)
          // Don't fail the order if inventory update fails, just log it
        } else {
          // Emit inventory update event to refresh other screens
          inventoryEvents.emit()
        }
        
        // Save order to your backend here
        const saveResult = await saveOrder({
          orderId,
          paymentIntentId: paymentIntent.id,
          customerInfo,
          items: state.items,
          total: state.total,
          timestamp: new Date().toISOString(),
        })

        if (saveResult.success) {
          // Send email notification
          const emailResult = await EmailService.sendOrderNotification({
            orderId,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            shippingAddress: {
              address: customerInfo.address,
              city: customerInfo.city,
              state: customerInfo.state,
              zipCode: customerInfo.zipCode,
            },
            items: state.items,
            total: state.total,
            timestamp: new Date().toISOString(),
          })

          if (!emailResult.success) {
            console.error('Email notification failed:', emailResult.error)
            // Don't fail the order if email fails, just log it
          }

          // Navigate to success screen instead of showing alert
          navigation.navigate("PurchaseSuccess", {
            orderId,
            total: state.total,
            customerInfo,
            items: state.items,
          })
        } else {
          Alert.alert("Payment Failed", saveResult.error)
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      Alert.alert("Payment Failed", "There was an error processing your payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const saveOrder = async (orderData: any) => {
    try {
      // Save order locally using AsyncStorage
      const existingOrders = await AsyncStorage.getItem('orders')
      const orders = existingOrders ? JSON.parse(existingOrders) : []
      
      // Add new order to the beginning of the array
      orders.unshift(orderData)
      
      // Keep only the last 50 orders to prevent storage bloat
      const trimmedOrders = orders.slice(0, 50)
      
      await AsyncStorage.setItem('orders', JSON.stringify(trimmedOrders))
      
      console.log('Order saved locally:', orderData.orderId)
      return { success: true, orderId: orderData.orderId }
    } catch (error) {
      console.error('Order save failed:', error)
      // Don't fail the payment if order save fails, just log it
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {state.items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDetails}>
              Qty: {item.quantity} × ${item.price} = ${(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${state.total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={customerInfo.name}
          onChangeText={(value) => handleInputChange("name", value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={customerInfo.email}
          onChangeText={(value) => handleInputChange("email", value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={customerInfo.phone}
          onChangeText={(value) => handleInputChange("phone", value)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>

        <TextInput
          style={styles.input}
          placeholder="Street Address"
          value={customerInfo.address}
          onChangeText={(value) => handleInputChange("address", value)}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="City"
            value={customerInfo.city}
            onChangeText={(value) => handleInputChange("city", value)}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="State"
            value={customerInfo.state}
            onChangeText={(value) => handleInputChange("state", value)}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="ZIP Code"
          value={customerInfo.zipCode}
          onChangeText={(value) => handleInputChange("zipCode", value)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>

        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === "card" && styles.selectedPaymentOption]}
            onPress={() => setPaymentMethod("card")}
          >
            <Ionicons name="card" size={24} color="#0891b2" />
            <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
            {paymentMethod === "card" && <Ionicons name="checkmark-circle" size={20} color="#059669" />}
          </TouchableOpacity>
        </View>

        {paymentMethod === "card" && (
          <View style={styles.cardFieldContainer}>
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={styles.cardField}
              style={styles.cardFieldWrapper}
              onCardChange={(cardDetails) => {
                setCardComplete(cardDetails.complete)
              }}
            />
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
        onPress={processStripePayment}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Text style={styles.payButtonText}>Processing...</Text>
        ) : (
          <>
            <Ionicons name="lock-closed" size={24} color="#fff" />
            <Text style={styles.payButtonText}>Pay ${state.total.toFixed(2)} Securely</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark" size={20} color="#059669" />
        <Text style={styles.securityText}>Your payment information is encrypted and secure</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  section: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  orderItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: "#64748b",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#e2e8f0",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#059669",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  paymentOptions: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  selectedPaymentOption: {
    borderColor: "#0891b2",
    backgroundColor: "#f0f9ff",
  },
  paymentOptionText: {
    fontSize: 16,
    color: "#1e293b",
    marginLeft: 12,
    flex: 1,
  },
  cardFieldContainer: {
    marginTop: 16,
  },
  cardFieldWrapper: {
    height: 50,
  },
  cardField: {
    backgroundColor: '#FFFFFF',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
  },
  payButton: {
    backgroundColor: "#0891b2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  payButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  securityText: {
    fontSize: 14,
    color: "#059669",
    marginLeft: 8,
  },
})