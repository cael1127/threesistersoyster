import React, { createContext, useContext, useRef } from "react"

// Simple event emitter
class InventoryEventEmitter {
  listeners: Set<() => void> = new Set()

  subscribe(listener: () => void) {
    if (!this.listeners) {
      this.listeners = new Set()
    }
    this.listeners.add(listener)
    return () => {
      if (this.listeners) {
        this.listeners.delete(listener)
      }
    }
  }

  emit() {
    if (this.listeners) {
      this.listeners.forEach((listener) => {
        try {
          listener()
        } catch (error) {
          console.error('Error in inventory event listener:', error)
        }
      })
    }
  }
}

const InventoryEventContext = createContext<InventoryEventEmitter | null>(null)

export function InventoryEventProvider({ children }: { children: React.ReactNode }) {
  const emitterRef = useRef<InventoryEventEmitter>(new InventoryEventEmitter())
  return (
    <InventoryEventContext.Provider value={emitterRef.current}>
      {children}
    </InventoryEventContext.Provider>
  )
}

export function useInventoryEvents() {
  const ctx = useContext(InventoryEventContext)
  if (!ctx) throw new Error("useInventoryEvents must be used within InventoryEventProvider")
  return ctx
} 