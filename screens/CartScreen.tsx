import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useCart, type CartItem } from "../context/CartContext"
import { colors } from "../config/colors"

export default function CartScreen({ navigation }: any) {
  const { state, dispatch } = useCart()

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } })
  }

  const removeItem = (id: string) => {
    Alert.alert("Remove Item", "Are you sure you want to remove this item from your cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => dispatch({ type: "REMOVE_ITEM", payload: id }),
      },
    ])
  }

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price} each</Text>
        <Text style={styles.itemTotal}>Subtotal: ${(item.price * item.quantity).toFixed(2)}</Text>
      </View>

      <View style={styles.quantityControls}>
        <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
          <Ionicons name="remove" size={20} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.quantity}>{item.quantity}</Text>

        <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.id)}>
        <Ionicons name="trash" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  )

  if (state.items.length === 0) {
    return (
          <View style={styles.emptyContainer}>
      <Ionicons name="basket-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptyText}>Add some products to get started</Text>
      <TouchableOpacity style={styles.shopButton} onPress={() => navigation.goBack()}>
        <Text style={styles.shopButtonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={state.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${state.total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate("Checkout")}>
          <Ionicons name="card" size={24} color={colors.text.inverse} />
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 20,
  },
  cartItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.success,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  quantity: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.primary,
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: "center",
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    backgroundColor: colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.success,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  checkoutButtonText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
})