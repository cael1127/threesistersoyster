import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect } from "@react-navigation/native"
import { useInventoryEvents } from "../context/InventoryEvents"

export default function HomeScreen({ navigation }: any) {
  const [nurseryCount, setNurseryCount] = useState(0)
  const [farmCount, setFarmCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { subscribe } = useInventoryEvents()

  // Load inventory data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadInventoryData()
    }, []),
  )

  // Subscribe to real-time inventory updates
  useEffect(() => {
    console.log("HomeScreen: Setting up event subscription")
    const unsubscribe = subscribe(() => {
      console.log("HomeScreen: Received inventory update event")
      loadInventoryData()
    })
    return () => {
      console.log("HomeScreen: Cleaning up event subscription")
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const loadInventoryData = async () => {
    setIsLoading(true)
    try {
      console.log("HomeScreen: Loading inventory data...")
      const savedInventory = await AsyncStorage.getItem("admin_inventory")
      if (savedInventory) {
        const parsedInventory = JSON.parse(savedInventory)
        console.log("HomeScreen: Raw inventory data:", parsedInventory)
        
        // Calculate nursery count
        const nurseryItems = parsedInventory.filter((item: any) => 
          item.type === "nursery" || (!item.type && item.age)
        )
        const nurseryTotal = nurseryItems.reduce((sum: number, item: any) => sum + (item.count || 0), 0)
        setNurseryCount(nurseryTotal)
        
        // Calculate farm count
        const farmItems = parsedInventory.filter((item: any) => 
          item.type === "farm" || (!item.type && item.location)
        )
        const farmTotal = farmItems.reduce((sum: number, item: any) => sum + (item.count || 0), 0)
        setFarmCount(farmTotal)
        
        console.log("HomeScreen: Nursery count:", nurseryTotal, "Farm count:", farmTotal)
      } else {
        console.log("HomeScreen: No saved inventory, using default counts")
        // Default counts from mock data
        setNurseryCount(2450)
        setFarmCount(8750)
      }
    } catch (error) {
      console.error("HomeScreen: Failed to load inventory data:", error)
      // Fallback to default counts
      setNurseryCount(2450)
      setFarmCount(8750)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.heroSection}>
        <LinearGradient colors={["#0891b2", "#065f46"]} style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Three Sisters Oyster Co.</Text>
          <Text style={styles.heroSubtitle}>Port Lavaca Oysters</Text>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="leaf" size={32} color="#059669" />
            {isLoading ? (
              <ActivityIndicator size="small" color="#059669" style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.statNumber}>{nurseryCount.toLocaleString()}</Text>
            )}
            <Text style={styles.statLabel}>Nursery Oysters</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="water" size={32} color="#0891b2" />
            {isLoading ? (
              <ActivityIndicator size="small" color="#0891b2" style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.statNumber}>{farmCount.toLocaleString()}</Text>
            )}
            <Text style={styles.statLabel}>Farm Ready</Text>
          </View>
        </View>

        <View style={styles.totalStatsCard}>
          <Ionicons name="fish" size={40} color="#0891b2" />
          {isLoading ? (
            <ActivityIndicator size="large" color="#0891b2" style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.totalStatNumber}>{(nurseryCount + farmCount).toLocaleString()}</Text>
          )}
          <Text style={styles.totalStatLabel}>Total Oysters</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.sectionText}>
            Three Sisters Oyster Company test text LOL
          </Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Nursery")}>
            <Ionicons name="leaf" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>View Nursery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Farm")}>
            <Ionicons name="water" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Farm Inventory</Text>
          </TouchableOpacity>
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
  heroSection: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    color: "#f1f5f9",
    textAlign: "center",
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    flex: 0.48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  totalStatsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalStatNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 8,
  },
  totalStatLabel: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "#0891b2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    flex: 0.48,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
})