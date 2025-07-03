"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { useInventoryEvents } from "../context/InventoryEvents"
import { supabaseService, InventoryItem } from "../services/supabaseService"

interface NurseryOyster {
  id: string
  variety: string
  count: number
  size: string
  age?: string
  health: "excellent" | "good" | "fair"
  type?: string
}

export default function NurseryScreen() {
  const [nurseryData, setNurseryData] = useState<NurseryOyster[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { subscribe } = useInventoryEvents()

  // Load nursery data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadNurseryData()
    }, []),
  )

  // Subscribe to real-time inventory updates
  useEffect(() => {
    console.log("NurseryScreen: Setting up event subscription")
    const unsubscribe = subscribe(() => {
      console.log("NurseryScreen: Received inventory update event")
      loadNurseryData()
    })
    return () => {
      console.log("NurseryScreen: Cleaning up event subscription")
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const loadNurseryData = async () => {
    setIsLoading(true)
    try {
      console.log("NurseryScreen: Loading nursery data...")
      const inventoryItems = await supabaseService.getInventoryByType('nursery')
      
      // Convert Supabase data to the expected format
      const nurseryItems: NurseryOyster[] = inventoryItems.map((item: InventoryItem) => {
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
          health: (additionalData.health as "excellent" | "good" | "fair") || "excellent",
          type: item.type,
        };
      })
      
      console.log("NurseryScreen: Loaded nursery items:", nurseryItems)
      setNurseryData(nurseryItems)
    } catch (error) {
      console.error("NurseryScreen: Failed to load nursery data:", error)
      // Fallback to default data
      const defaultNurseryData: NurseryOyster[] = [
        {
          id: "1",
          variety: "Pacific Oyster",
          count: 850,
          size: "Seed (5-10mm)",
          age: "2 months",
          health: "excellent",
        },
        {
          id: "2",
          variety: "Kumamoto",
          count: 620,
          size: "Seed (8-12mm)",
          age: "3 months",
          health: "excellent",
        },
        {
          id: "3",
          variety: "Blue Pool",
          count: 480,
          size: "Juvenile (10-15mm)",
          age: "4 months",
          health: "good",
        },
        {
          id: "4",
          variety: "Virginica",
          count: 500,
          size: "Seed (6-10mm)",
          age: "2.5 months",
          health: "excellent",
        },
      ]
      setNurseryData(defaultNurseryData)
    } finally {
      setIsLoading(false)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "#059669"
      case "good":
        return "#d97706"
      case "fair":
        return "#dc2626"
      default:
        return "#64748b"
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "excellent":
        return "checkmark-circle"
      case "good":
        return "warning"
      case "fair":
        return "alert-circle"
      default:
        return "help-circle"
    }
  }

  const renderOysterCard = ({ item }: { item: NurseryOyster }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.varietyName}>{item.variety}</Text>
        <View style={[styles.healthBadge, { backgroundColor: getHealthColor(item.health) }]}>
          <Ionicons name={getHealthIcon(item.health)} size={16} color="#fff" />
          <Text style={styles.healthText}>{item.health}</Text>
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

        {item.age && (
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#0891b2" />
            <Text style={styles.infoText}>Age: {item.age}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  const totalCount = nurseryData.reduce((sum, item) => sum + item.count, 0)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nursery Inventory</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadNurseryData}>
          <Ionicons name="refresh" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Oysters</Text>
        <Text style={styles.totalCount}>{totalCount.toLocaleString()}</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.loadingText}>Loading nursery data...</Text>
        </View>
      ) : (
        <FlatList
          data={nurseryData}
          renderItem={renderOysterCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={64} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Nursery Data</Text>
              <Text style={styles.emptyText}>No nursery inventory available</Text>
              <TouchableOpacity style={styles.refreshEmptyButton} onPress={loadNurseryData}>
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
  totalCard: {
    backgroundColor: "#ecfdf5",
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#059669",
    marginBottom: 4,
  },
  totalCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#059669",
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
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
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
    textTransform: "capitalize",
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
