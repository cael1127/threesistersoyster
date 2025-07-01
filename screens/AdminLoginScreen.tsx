import React, { useState } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AdminLoginScreenProps {
  onLoginSuccess: () => void
}

export default function AdminLoginScreen({ onLoginSuccess }: AdminLoginScreenProps) {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // You can change this password or store it securely
  const ADMIN_PASSWORD = "9500694Cat!" // Admin password: 9500694Cat!

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert("Error", "Please enter a password")
      return
    }

    setIsLoading(true)

    // Simulate a small delay for security
    setTimeout(async () => {
      if (password === ADMIN_PASSWORD) {
        // Store login session
        await AsyncStorage.setItem('admin_logged_in', 'true')
        await AsyncStorage.setItem('admin_login_time', Date.now().toString())
        
        Alert.alert("Success", "Welcome to Admin Panel", [
          {
            text: "OK",
            onPress: onLoginSuccess
          }
        ])
      } else {
        Alert.alert("Access Denied", "Incorrect password. Please try again.")
        setPassword("")
      }
      setIsLoading(false)
    }, 1000)
  }

  const handleForgotPassword = () => {
    Alert.alert(
      "Password Recovery", 
      "Please contact the system administrator to reset your password.",
      [{ text: "OK" }]
    )
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#0891b2" />
          </View>
          <Text style={styles.title}>Admin Access</Text>
          <Text style={styles.subtitle}>Three Sisters Oyster Co.</Text>
          <Text style={styles.description}>Enter your admin password to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.passwordInput}
              placeholder="Admin Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleLogin}
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#64748b" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.loginButtonText}>Authenticating...</Text>
            ) : (
              <>
                <Ionicons name="log-in" size={20} color="#fff" />
                <Text style={styles.loginButtonText}>Access Admin Panel</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.forgotButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotButtonText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.securityNote}>
            <Ionicons name="information-circle" size={16} color="#64748b" />
            <Text style={styles.securityText}>
              This area is restricted to authorized personnel only
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#0891b2",
    fontWeight: "600",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    paddingRight: 16,
    color: "#1e293b",
  },
  eyeButton: {
    padding: 16,
  },
  loginButton: {
    backgroundColor: "#0891b2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#0891b2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  forgotButton: {
    alignItems: "center",
    padding: 8,
  },
  forgotButtonText: {
    color: "#0891b2",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  footer: {
    alignItems: "center",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  securityText: {
    fontSize: 12,
    color: "#92400e",
    marginLeft: 8,
    textAlign: "center",
    flex: 1,
  },
})