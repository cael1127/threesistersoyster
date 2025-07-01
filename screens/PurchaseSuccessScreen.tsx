import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useCart } from "../context/CartContext"
import { StackScreenProps } from "@react-navigation/stack"

type RootStackParamList = {
  PurchaseSuccess: {
    orderId: string
    total: number
    customerInfo: any
    items: any[]
  }
}

type Props = StackScreenProps<RootStackParamList, "PurchaseSuccess">

export default function PurchaseSuccessScreen({ navigation, route }: Props) {
  const { dispatch } = useCart()
  const [countdown, setCountdown] = useState(5)
  const [canMakeNewPurchase, setCanMakeNewPurchase] = useState(false)
  
  const { orderId, total, customerInfo, items } = route.params

  useEffect(() => {
    // Clear the cart immediately
    dispatch({ type: "CLEAR_CART" })

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanMakeNewPurchase(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleContinueShopping = () => {
    navigation.navigate("OrderMain" as any)
  }

  const handleViewOrders = () => {
    // Navigate to orders history (you can implement this later)
    navigation.navigate("OrderMain" as any)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.successCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#059669" />
        </View>
        
        <Text style={styles.title}>Order Successful!</Text>
        <Text style={styles.subtitle}>Thank you for your purchase</Text>
        
        <View style={styles.orderDetails}>
          <Text style={styles.orderId}>Order ID: {orderId}</Text>
          <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <Text style={styles.infoText}>Name: {customerInfo.name}</Text>
          <Text style={styles.infoText}>Email: {customerInfo.email}</Text>
          <Text style={styles.infoText}>Phone: {customerInfo.phone}</Text>
          <Text style={styles.infoText}>Address: {customerInfo.address}</Text>
          <Text style={styles.infoText}>{customerInfo.city}, {customerInfo.state} {customerInfo.zipCode}</Text>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                Qty: {item.quantity} × ${item.price} = ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.nextSteps}>
          <Text style={styles.sectionTitle}>What's Next?</Text>
          <Text style={styles.nextStepsText}>
            • You will receive an email confirmation shortly{'\n'}
            • Your order will be processed within 24 hours{'\n'}
            • We'll contact you if there are any issues{'\n'}
            • Estimated delivery: 3-5 business days
          </Text>
        </View>

        {!canMakeNewPurchase && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              New purchase available in {countdown} seconds
            </Text>
            <View style={styles.countdownBar}>
              <View 
                style={[
                  styles.countdownProgress, 
                  { width: `${((5 - countdown) / 5) * 100}%` }
                ]} 
              />
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, !canMakeNewPurchase && styles.disabledButton]}
            onPress={handleContinueShopping}
            disabled={!canMakeNewPurchase}
          >
            <Ionicons name="cart" size={20} color="#fff" />
            <Text style={styles.buttonText}>Continue Shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleViewOrders}
          >
            <Ionicons name="receipt" size={20} color="#0891b2" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>View Orders</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            Contact us at:{'\n'}
            Phone: (555) 123-4567{'\n'}
            Email: orders@threesistersoyster.com
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  successCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  orderDetails: {
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0891b2",
    marginBottom: 4,
  },
  total: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#059669",
  },
  customerInfo: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 4,
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    flex: 1,
  },
  itemDetails: {
    fontSize: 14,
    color: "#64748b",
  },
  nextSteps: {
    marginBottom: 20,
  },
  nextStepsText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  countdownContainer: {
    backgroundColor: "#fef3c7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  countdownText: {
    fontSize: 14,
    color: "#92400e",
    fontWeight: "600",
    marginBottom: 8,
  },
  countdownBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#fde68a",
    borderRadius: 2,
    overflow: "hidden",
  },
  countdownProgress: {
    height: "100%",
    backgroundColor: "#f59e0b",
    borderRadius: 2,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: "#0891b2",
    borderColor: "#0891b2",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: "#0891b2",
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
    borderColor: "#94a3b8",
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: "#0891b2",
  },
  contactInfo: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
}) 