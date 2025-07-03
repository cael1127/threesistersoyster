import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { useInventoryEvents } from "../context/InventoryEvents"
import { colors } from "../config/colors"
import { supabaseService } from "../services/supabaseService"

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
      const stats = await supabaseService.getInventoryStatistics()
      
      setNurseryCount(stats.total_nursery)
      setFarmCount(stats.total_farm)
      console.log("HomeScreen: Nursery count:", stats.total_nursery, "Farm count:", stats.total_farm)
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
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.heroOverlay}>
          {/* Logo Placeholder */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Ionicons name="fish" size={48} color={colors.text.inverse} />
              <Text style={styles.logoText}>LOGO</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Three Sisters Oyster Co.</Text>
          <Text style={styles.heroSubtitle}>Port Lavaca Oysters</Text>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="leaf" size={32} color={colors.primary} />
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.statNumber}>{nurseryCount.toLocaleString()}</Text>
            )}
            <Text style={styles.statLabel}>Nursery Oysters</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="water" size={32} color={colors.secondary} />
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.statNumber}>{farmCount.toLocaleString()}</Text>
            )}
            <Text style={styles.statLabel}>Farm Ready</Text>
          </View>
        </View>

        <View style={styles.totalStatsCard}>
          <Ionicons name="fish" size={40} color={colors.secondary} />
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: 8 }} />
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
            <Ionicons name="leaf" size={24} color={colors.text.inverse} />
            <Text style={styles.actionButtonText}>View Nursery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Farm")}>
            <Ionicons name="water" size={24} color={colors.text.inverse} />
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
    backgroundColor: colors.background,
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
  logoContainer: {
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text.inverse,
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    color: colors.text.inverse,
    textAlign: "center",
    opacity: 0.9,
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
    backgroundColor: colors.surface,
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
    color: colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
  },
  totalStatsCard: {
    backgroundColor: colors.surface,
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
    color: colors.text.primary,
    marginTop: 8,
  },
  totalStatLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    flex: 0.48,
  },
  actionButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
})