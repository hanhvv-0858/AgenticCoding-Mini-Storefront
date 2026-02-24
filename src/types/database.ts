export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    created_at?: string
                }
                Relationships: []
            }
            products: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    price: number
                    stock: number
                    is_published: boolean
                    category_id: string
                    image_path: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    price: number
                    stock?: number
                    is_published?: boolean
                    category_id: string
                    image_path?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    price?: number
                    stock?: number
                    is_published?: boolean
                    category_id?: string
                    image_path?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "products_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: "customer" | "admin"
                    created_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: "customer" | "admin"
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: "customer" | "admin"
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            orders: {
                Row: {
                    id: string
                    order_number: string
                    customer_id: string | null
                    customer_name: string
                    customer_phone: string
                    customer_address: string
                    total_amount: number
                    status: "pending" | "delivering" | "completed" | "cancelled"
                    payment_method: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    order_number: string
                    customer_id?: string | null
                    customer_name: string
                    customer_phone: string
                    customer_address: string
                    total_amount: number
                    status?: "pending" | "delivering" | "completed" | "cancelled"
                    payment_method?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    order_number?: string
                    customer_id?: string | null
                    customer_name?: string
                    customer_phone?: string
                    customer_address?: string
                    total_amount?: number
                    status?: "pending" | "delivering" | "completed" | "cancelled"
                    payment_method?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "orders_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    product_name: string
                    unit_price: number
                    quantity: number
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    product_name: string
                    unit_price: number
                    quantity: number
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string
                    product_name?: string
                    unit_price?: number
                    quantity?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "order_items_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "order_items_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            fn_create_order: {
                Args: {
                    p_customer_id?: string | null
                    p_customer_name: string
                    p_customer_phone: string
                    p_customer_address: string
                    p_items: Json
                }
                Returns: Json
            }
            fn_cancel_order: {
                Args: {
                    p_order_id: string
                }
                Returns: undefined
            }
            fn_get_revenue_stats: {
                Args: Record<string, never>
                Returns: Json
            }
            is_admin: {
                Args: Record<string, never>
                Returns: boolean
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Convenience type aliases
export type Category = Database["public"]["Tables"]["categories"]["Row"]
export type Product = Database["public"]["Tables"]["products"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Order = Database["public"]["Tables"]["orders"]["Row"]
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"]

export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"]
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"]
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"]
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"]

export type OrderStatus = Order["status"]
export type UserRole = Profile["role"]

// Product with category (joined)
export type ProductWithCategory = Product & {
    categories: Pick<Category, "id" | "name" | "slug">
}

// Order with items (joined)
export type OrderWithItems = Order & {
    order_items: OrderItem[]
}
