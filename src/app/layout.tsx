import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ToastProvider } from "@/components/ui/Toast"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
}

export const metadata: Metadata = {
  title: {
    default: "Mini Storefront",
    template: "%s | Mini Storefront",
  },
  description: "Cửa hàng trực tuyến mini – mua sắm nhanh, thanh toán tiện lợi",
  icons: { icon: "/favicon.ico" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
