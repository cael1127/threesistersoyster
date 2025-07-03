import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StripeProvider } from '@stripe/stripe-react-native'

import HomeScreen from "./screens/HomeScreen"
import NurseryScreen from "./screens/NurseryScreen"
import FarmScreen from "./screens/FarmScreen"
import OrderScreen from "./screens/OrderScreen"
import CartScreen from "./screens/CartScreen"
import CheckoutScreen from "./screens/CheckoutScreen"
import PurchaseSuccessScreen from "./screens/PurchaseSuccessScreen"
import AdminContainer from "./screens/AdminContainer"
import { CartProvider } from "./context/CartContext"
import { AdminAuthProvider } from "./context/AdminAuthContext"
import { stripeConfig } from "./config/stripe"
import { InventoryEventProvider } from "./context/InventoryEvents"
import { colors } from "./config/colors"
import { supabaseService } from "./services/supabaseService"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function OrderStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OrderMain" component={OrderScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "Your Cart",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.text.inverse,
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: "Checkout",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.text.inverse,
        }}
      />
      <Stack.Screen
        name="PurchaseSuccess"
        component={PurchaseSuccessScreen}
        options={{
          title: "Order Confirmation",
          headerStyle: { backgroundColor: colors.success },
          headerTintColor: colors.text.inverse,
          headerLeft: () => null, // Prevent going back
        }}
      />
    </Stack.Navigator>
  )
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Nursery") {
            iconName = focused ? "leaf" : "leaf-outline"
          } else if (route.name === "Farm") {
            iconName = focused ? "water" : "water-outline"
          } else if (route.name === "Order") {
            iconName = focused ? "basket" : "basket-outline"
          } else if (route.name === "Admin") {
            iconName = focused ? "shield-checkmark" : "shield-checkmark-outline"
          } else {
            iconName = "ellipse"
          }

          return <Ionicons name={iconName as any} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.text.inverse,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Nursery" component={NurseryScreen} />
      <Tab.Screen name="Farm" component={FarmScreen} />
      <Tab.Screen name="Order" component={OrderStack} />
      <Tab.Screen name="Admin" component={AdminContainer} />
    </Tab.Navigator>
  )
}

export default function App() {
  // Initialize Supabase data on app start
  React.useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('App: Initializing Supabase data...')
        await supabaseService.initializeDefaultData()
        console.log('App: Supabase data initialized successfully')
      } catch (error) {
        console.error('App: Failed to initialize Supabase data:', error)
      }
    }
    
    initializeData()
  }, [])

  return (
    <StripeProvider publishableKey={stripeConfig.publishableKey}>
      <SafeAreaProvider>
        <InventoryEventProvider>
          <AdminAuthProvider>
            <CartProvider>
              <NavigationContainer>
                <StatusBar style="light" />
                <TabNavigator />
              </NavigationContainer>
            </CartProvider>
          </AdminAuthProvider>
        </InventoryEventProvider>
      </SafeAreaProvider>
    </StripeProvider>
  )
}