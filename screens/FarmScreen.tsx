"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { useInventoryEvents } from "../context/InventoryEvents"
import { supabaseService, InventoryItem } from "../services/supabaseService"

interface FarmOyster {
  id: string
  variety: string
  count: number
  size: string
  location?: string
  harvestReady: boolean
  pricePerDozen: number
  type?: string
}

export default function FarmScreen() {
  const [farmData, setFarmData] = useState<FarmOyster[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { subscribe } = useInventoryEvents()

  // Load farm data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadFarmData()
    }, []),
  )

  // Subscribe to real-time inventory updates
  useEffect(() => {
    console.log("FarmScreen: Setting up event subscription")
    const unsubscribe = subscribe(() => {
      console.log("FarmScreen: Received inventory update event")
      loadFarmData()
    })
    return () => {
      console.log("FarmScreen: Cleaning up event subscription")
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const loadFarmData = async () => {
    setIsLoading(true)
    try {
      console.log("FarmScreen: Loading farm data...")
      const inventoryItems = await supabaseService.getInventoryByType('farm')
      
      // Convert Supabase data to the expected format
      const farmItems: FarmOyster[] = inventoryItems.map((item: InventoryItem) => {
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
          location: additionalData.location || '',
          harvestReady: additionalData.harvestReady || false,
          pricePerDozen: additionalData.pricePerDozen || 0,
          type: item.type,
        };
      })
      
      console.log("FarmScreen: Loaded farm items:", farmItems)
      setFarmData(farmItems)
    } catch (error) {
      console.error("FarmScreen: Failed to load farm data:", error)
      // Fallback to default data
      const defaultFarmData: FarmOyster[] = [
        {
          id: "1",
          variety: "Pacific Oyster",
          count: 2400,
          size: "Market (75-100mm)",
          location: "Bay Section A",
          harvestReady: true,
          pricePerDozen: 24,
        },
        {
          id: "2",
          variety: "Kumamoto",
          count: 1800,
          size: "Market (60-80mm)",
          location: "Bay Section B",
          harvestReady: true,
          pricePerDozen: 32,
        },
        {
          id: "3",
          variety: "Blue Pool",
          count: 1650,
          size: "Market (70-90mm)",
          location: "Bay Section C",
          harvestReady: true,
          pricePerDozen: 28,
        },
        {
          id: "4",
          variety: "Virginica",
          count: 1200,
          size: "Growing (50-70mm)",
          location: "Bay Section D",
          harvestReady: false,
          pricePerDozen: 26,
        },
        {
          id: "5",
          variety: "Olympia",
          count: 950,
          size: "Market (40-60mm)",
          location: "Bay Section E",
          harvestReady: true,
          pricePerDozen: 36,
        },
        {
          id: "6",
          variety: "Shigoku",
          count: 750,
          size: "Market (65-85mm)",
          location: "Bay Section F",
          harvestReady: true,
          pricePerDozen: 30,
        },
      ]
      setFarmData(defaultFarmData)
    } finally {
      setIsLoading(false)
    }
  }

  const renderOysterCard = ({ item }: { item: FarmOyster }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.varietyName}>{item.variety}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.harvestReady ? "#059669" : "#d97706" }]}>
          <Ionicons name={item.harvestReady ? "checkmark-circle" : "time"} size={16} color="#fff" />
          <Text style={styles.statusText}>{item.harvestReady ? "Ready" : "Growing"}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="layers" size={20} color="#0891b2" />
          <Text style={styles.infoText}>Count: {item.count.toLocaleString()}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="resize" size={20} color="#0891b2" />
          <Text style={styles.infoText}>Size: {item.size}</Text>
        </View>

        {item.location && (
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#0891b2" />
            <Text style={styles.infoText}>Location: {item.location}</Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Ionicons name="pricetag" size={20} color="#059669" />
          <Text style={styles.priceText}>${item.pricePerDozen}/dozen</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const totalCount = farmData.reduce((sum, item) => sum + item.count, 0)
  const readyCount = farmData.filter((item) => item.harvestReady).reduce((sum, item) => sum + item.count, 0)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Farm Inventory</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadFarmData}>
          <Ionicons name="refresh" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statCount}>{totalCount.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Harvest Ready</Text>
          <Text style={[styles.statCount, { color: "#059669" }]}>{readyCount.toLocaleString()}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.loadingText}>Loading farm data...</Text>
        </View>
      ) : (
        <FlatList
          data={farmData}
          renderItem={renderOysterCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="water-outline" size={64} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Farm Data</Text>
              <Text style={styles.emptyText}>No farm inventory available</Text>
              <TouchableOpacity style={styles.refreshEmptyButton} onPress={loadFarmData}>
                <Ionicons name="refresh" size={20} color="#0891b2" />
                <Text style={styles.refreshEmptyText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  refreshButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingBottom: 0,
  },
  statCard: {
    backgroundColor: "#f1f5f9",
    padding: 16,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  statCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  listContainer: {
    padding: 20,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  varietyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#475569",
    marginLeft: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  priceText: {
    fontSize: 16,
    color: "#059669",
    fontWeight: "600",
    marginLeft: 12,
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
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
  },
  refreshEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0891b2",
  },
  refreshEmptyText: {
    color: "#0891b2",
    fontSize: 14,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    color: "#0891b2",
    fontSize: 16,
    marginTop: 16,
  },
})
