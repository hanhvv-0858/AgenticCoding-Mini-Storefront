"use client"

import {
    createContext,
    useCallback,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface Toast {
    id: string
    type: ToastType
    message: string
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error("useToast must be used within ToastProvider")
    return ctx
}

const ICONS: Record<ToastType, typeof CheckCircle2> = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
}

const COLORS: Record<ToastType, string> = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
}

const ICON_COLORS: Record<ToastType, string> = {
    success: "text-green-500",
    error: "text-red-500",
    info: "text-blue-500",
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const Icon = ICONS[toast.type]

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 3500)
        return () => clearTimeout(timer)
    }, [toast.id, onDismiss])

    return (
        <div
            role="alert"
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 shadow-lg animate-in slide-in-from-top-2 ${COLORS[toast.type]}`}
        >
            <Icon className={`h-5 w-5 flex-shrink-0 ${ICON_COLORS[toast.type]}`} />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 rounded-full p-0.5 hover:bg-black/5"
                aria-label="Đóng"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const addToast = useCallback((message: string, type: ToastType = "success") => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        setToasts((prev) => [...prev.slice(-4), { id, type, message }])
    }, [])

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {/* Toast container */}
            <div
                aria-live="polite"
                className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4"
            >
                <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-2">
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    )
}
