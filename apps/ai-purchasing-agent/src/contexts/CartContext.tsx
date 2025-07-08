'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { StandardizedProduct } from '@ganger/types'

interface CartItem {
  product: StandardizedProduct
  quantity: number
  notes?: string
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  addToCart: (product: StandardizedProduct, quantity: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getItemQuantity: (productId: string) => number
  isInCart: (productId: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ai-purchasing-cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from storage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ai-purchasing-cart', JSON.stringify(items))
  }, [items])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const addToCart = (product: StandardizedProduct, quantity: number) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id)
      
      if (existingItem) {
        // Update quantity if item already in cart
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        // Add new item to cart
        return [...prevItems, { product, quantity }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getItemQuantity = (productId: string): number => {
    const item = items.find(item => item.product.id === productId)
    return item?.quantity || 0
  }

  const isInCart = (productId: string): boolean => {
    return items.some(item => item.product.id === productId)
  }

  const value: CartContextType = {
    items,
    totalItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}