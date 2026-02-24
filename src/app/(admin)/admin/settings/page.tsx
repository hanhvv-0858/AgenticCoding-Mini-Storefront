"use client"

import { Store, Phone, MapPin, Clock } from "lucide-react"

export default function AdminSettingsPage() {
    return (
        <div className="mx-auto max-w-2xl px-4 py-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Cài đặt cửa hàng</h1>

            <div className="space-y-4">
                {/* Store info card */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">Thông tin cửa hàng</h2>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Store className="mt-0.5 h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tên cửa hàng</p>
                                <p className="text-gray-900">Mini Storefront</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="mt-0.5 h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                                <p className="text-gray-900">0901 234 567</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Địa chỉ</p>
                                <p className="text-gray-900">123 Nguyễn Huệ, Quận 1, TP.HCM</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Giờ hoạt động</p>
                                <p className="text-gray-900">8:00 — 22:00 (Thứ 2 — Chủ nhật)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Placeholder note */}
                <p className="text-center text-sm text-gray-400">
                    Chỉnh sửa thông tin cửa hàng sẽ được hỗ trợ trong phiên bản sau.
                </p>
            </div>
        </div>
    )
}
