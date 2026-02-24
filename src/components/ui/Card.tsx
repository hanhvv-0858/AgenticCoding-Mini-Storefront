import { ReactNode } from "react"

interface CardProps {
    children: ReactNode
    className?: string
    onClick?: () => void
}

export function Card({ children, className = "", onClick }: CardProps) {
    return (
        <div
            className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md ${onClick ? "cursor-pointer" : ""
                } ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    )
}

interface CardImageProps {
    children: ReactNode
    className?: string
}

export function CardImage({ children, className = "" }: CardImageProps) {
    return (
        <div className={`relative aspect-square overflow-hidden ${className}`}>
            {children}
        </div>
    )
}

interface CardContentProps {
    children: ReactNode
    className?: string
}

export function CardContent({ children, className = "" }: CardContentProps) {
    return <div className={`p-3 ${className}`}>{children}</div>
}
