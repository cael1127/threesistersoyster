import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useStripe, CardField } from '@stripe/stripe-react-native'
import { useCart } from "../context/CartContext"
import { useInventoryEvents } from "../context/InventoryEvents"
import { colors } from "../config/colors"
import { supabaseService } from "../services/supabaseService"
import { sendOrderToDropshipper } from "../services/dropshippingService"

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
      const stockAvailable = await supabaseService.checkStockAvailability(state.items)
      if (!stockAvailable) {
        Alert.alert(
          "Items Out of Stock", 
          "Some items in your cart are no longer available. Please refresh and try again."
        )
        setIsProcessing(false)
        return
      }

      // Validate total amount
      if (!state.total || state.total <= 0) {
        console.error('Invalid total amount:', state.total);
        Alert.alert("Invalid Order", "Order total is invalid. Please check your cart and try again.");
        setIsProcessing(false);
        return;
      }

      console.log('Creating payment intent for amount:', state.total);
      console.log('Cart items:', state.items);
      console.log('Cart total:', state.total);

      // Create a real payment intent with Stripe
      const amountInCents = Math.round(state.total * 100);
      
      // Create body as a simple string to avoid URLSearchParams issues
      const body = `amount=${amountInCents}&currency=usd&description=${encodeURIComponent(`Three Sisters Oyster Order - ${state.items.map(item => item.name).join(', ')}`)}&metadata[customer_name]=${encodeURIComponent(customerInfo.name)}&metadata[customer_email]=${encodeURIComponent(customerInfo.email)}&metadata[items]=${encodeURIComponent(state.items.map(item => `${item.name} x${item.quantity}`).join(', '))}`;

      console.log('Payment intent body:', body);

      const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk_test_51Re5snHIi0O9tm0E7Mwg3KZyiztanHmBwUHk1DubMe0lfMNAKvLro1Q5BmAm1bgCNsfqNKhzSfIq0ucUAjkD0ZFf00l9wgCfPG',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body
      });

      const paymentIntent = await paymentIntentResponse.json();
      
      if (paymentIntent.error) {
        console.error('Payment intent creation failed:', paymentIntent.error);
        Alert.alert("Payment Error", "Failed to create payment. Please try again.");
        setIsProcessing(false);
        return;
      }

      console.log('Payment intent created:', paymentIntent.id);
      console.log('Client secret:', paymentIntent.client_secret);

      // Actually confirm the payment with the card details
      const { error: confirmError, paymentIntent: confirmedPayment } = await confirmPayment(paymentIntent.client_secret, {
        paymentMethodType: 'Card',
      });

      console.log('Payment confirmation result:', { confirmError, confirmedPayment });

      if (confirmError) {
        console.error('Payment confirmation failed:', confirmError);
        Alert.alert("Payment Failed", confirmError.message || "Payment failed. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (confirmedPayment?.status === 'Succeeded') {
        // Save order to Supabase first
        const orderData = {
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          items: state.items,
          total_amount: state.total,
          status: 'pending' as const,
          payment_intent_id: paymentIntent.id,
          stripe_session_id: paymentIntent.id, // Use payment intent ID as session ID
        }

        const savedOrder = await supabaseService.createOrder(orderData)

        if (savedOrder) {
          // Process the order and update inventory
          if (savedOrder.id) {
            const processResult = await supabaseService.processOrder(savedOrder.id, state.items)
            if (processResult) {
              // Emit inventory update event to refresh other screens
              inventoryEvents.emit()
              console.log('✅ Order processed and inventory updated')
            } else {
              console.error('❌ Failed to process order and update inventory')
            }
          }

          // Check if any items are merchandise (for dropshipping)
          const hasMerchandise = state.items.some((item: any) => 
            item.category === 'merchandise' || item.name.toLowerCase().includes('shirt') || 
            item.name.toLowerCase().includes('cap') || item.name.toLowerCase().includes('knife')
          )

          if (hasMerchandise) {
            // Send to dropshipping service
            try {
              await sendOrderToDropshipper({
                orderId: savedOrder.id,
                customerInfo,
                items: state.items,
                total: state.total,
              })
              console.log('✅ Order sent to dropshipping service')
            } catch (error) {
              console.error('❌ Dropshipping service error:', error)
            }
          }

          // Navigate to success screen
          navigation.navigate("PurchaseSuccess", {
            orderId: savedOrder.id,
            total: state.total,
            customerInfo,
            items: state.items,
          })
        } else {
          Alert.alert("Order Failed", "Failed to save order. Please try again.")
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      Alert.alert("Payment Failed", "There was an error processing your payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // This function is no longer needed since we're using Supabase directly
  // const saveOrder = async (orderData: any) => {
  //   // Removed - using supabaseService.createOrder instead
  // }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          returnKeyType="next"
          blurOnSubmit={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={customerInfo.email}
          onChangeText={(value) => handleInputChange("email", value)}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          blurOnSubmit={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={customerInfo.phone}
          onChangeText={(value) => handleInputChange("phone", value)}
          keyboardType="phone-pad"
          returnKeyType="next"
          blurOnSubmit={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>

        <TextInput
          style={styles.input}
          placeholder="Street Address"
          value={customerInfo.address}
          onChangeText={(value) => handleInputChange("address", value)}
          returnKeyType="next"
          blurOnSubmit={false}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="City"
            value={customerInfo.city}
            onChangeText={(value) => handleInputChange("city", value)}
            returnKeyType="next"
            blurOnSubmit={false}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="State"
            value={customerInfo.state}
            onChangeText={(value) => handleInputChange("state", value)}
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="ZIP Code"
          value={customerInfo.zipCode}
          onChangeText={(value) => handleInputChange("zipCode", value)}
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          blurOnSubmit={true}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>

        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === "card" && styles.selectedPaymentOption]}
            onPress={() => setPaymentMethod("card")}
          >
            <Ionicons name="card" size={24} color={colors.primary} />
            <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
            {paymentMethod === "card" && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
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
            <Ionicons name="lock-closed" size={24} color={colors.text.inverse} />
            <Text style={styles.payButtonText}>Pay ${state.total.toFixed(2)} Securely</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark" size={20} color={colors.success} />
        <Text style={styles.securityText}>Your payment information is encrypted and secure</Text>
      </View>
    </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  section: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: 16,
  },
  orderItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.success,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
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
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  selectedPaymentOption: {
    borderColor: colors.primary,
    backgroundColor: colors.purple[50],
  },
  paymentOptionText: {
    fontSize: 16,
    color: colors.text.primary,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
  },
  payButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  payButtonDisabled: {
    backgroundColor: colors.text.tertiary,
  },
  payButtonText: {
    color: colors.text.inverse,
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
    color: colors.success,
    marginLeft: 8,
  },
})