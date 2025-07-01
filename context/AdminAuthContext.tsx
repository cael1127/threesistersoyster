import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AdminAuthContextType {
  isAdminLoggedIn: boolean
  login: () => void
  logout: () => void
  checkAuthStatus: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)

  const checkAuthStatus = async () => {
    try {
      const loggedIn = await AsyncStorage.getItem('admin_logged_in')
      const loginTime = await AsyncStorage.getItem('admin_login_time')
      
      if (loggedIn === 'true' && loginTime) {
        const loginTimestamp = parseInt(loginTime)
        const currentTime = Date.now()
        const sessionDuration = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        
        // Check if session is still valid (24 hours)
        if (currentTime - loginTimestamp < sessionDuration) {
          setIsAdminLoggedIn(true)
        } else {
          // Session expired, logout
          await logout()
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setIsAdminLoggedIn(false)
    }
  }

  const login = () => {
    setIsAdminLoggedIn(true)
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('admin_logged_in')
      await AsyncStorage.removeItem('admin_login_time')
      setIsAdminLoggedIn(false)
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  return (
    <AdminAuthContext.Provider value={{ isAdminLoggedIn, login, logout, checkAuthStatus }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}