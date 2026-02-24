"use client"

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react"
import { CART_STORAGE_KEY } from "@/lib/utils/constants"

export interface CartItem {
    product_id: string
    name: string
    price: number
    image_path: string | null
    quantity: number
    max_stock: number
}

interface CartContextValue {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    totalItems: number
    totalPrice: number
}

const CartContext = createContext<CartContextValue | null>(null)

function loadCart(): CartItem[] {
    if (typeof window === "undefined") return []
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

function saveCart(items: CartItem[]) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
        // Storage full or unavailable
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [hydrated, setHydrated] = useState(false)

    // Hydrate from localStorage on mount
    useEffect(() => {
        setItems(loadCart())
        setHydrated(true)
    }, [])

    // Persist to localStorage on change (after hydration)
    useEffect(() => {
        if (hydrated) saveCart(items)
    }, [items, hydrated])

    const addItem = useCallback((newItem: CartItem) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product_id === newItem.product_id)
            if (existing) {
                const newQty = Math.min(
                    existing.quantity + newItem.quantity,
                    newItem.max_stock
                )
                return prev.map((i) =>
                    i.product_id === newItem.product_id
                        ? { ...i, quantity: newQty, max_stock: newItem.max_stock }
                        : i
                )
            }
            return [...prev, { ...newItem, quantity: Math.min(newItem.quantity, newItem.max_stock) }]
        })
    }, [])

    const removeItem = useCallback((productId: string) => {
        setItems((prev) => prev.filter((i) => i.product_id !== productId))
    }, [])

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        setItems((prev) => {
            if (quantity <= 0) return prev.filter((i) => i.product_id !== productId)
            return prev.map((i) =>
                i.product_id === productId
                    ? { ...i, quantity: Math.min(quantity, i.max_stock) }
                    : i
            )
        })
    }, [])

    const clearCart = useCallback(() => {
        setItems([])
    }, [])

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error("useCart must be used within CartProvider")
    return ctx
}
