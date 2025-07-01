import React from "react"
import { useAdminAuth } from "../context/AdminAuthContext"
import AdminLoginScreen from "./AdminLoginScreen"
import AdminScreen from "./AdminScreen"

export default function AdminContainer() {
  const { isAdminLoggedIn, login } = useAdminAuth()

  if (!isAdminLoggedIn) {
    return <AdminLoginScreen onLoginSuccess={login} />
  }

  return <AdminScreen />
}