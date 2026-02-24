import Link from "next/link"

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
            <p className="text-6xl font-bold text-gray-200">404</p>
            <h1 className="mt-4 text-xl font-semibold text-gray-900">
                Không tìm thấy trang
            </h1>
            <p className="mt-2 text-sm text-gray-500">
                Trang bạn đang tìm không tồn tại hoặc đã bị xóa.
            </p>
            <Link
                href="/"
                className="mt-6 inline-flex h-11 items-center rounded-xl bg-black px-6 text-sm font-medium text-white hover:bg-gray-800"
            >
                Về trang chủ
            </Link>
        </div>
    )
}
