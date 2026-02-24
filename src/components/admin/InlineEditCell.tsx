"use client"

import { useState, useRef, useEffect } from "react"

interface InlineEditCellProps {
    value: number
    onSave: (value: number) => void
    format: (value: number) => string
}

export function InlineEditCell({ value, onSave, format }: InlineEditCellProps) {
    const [editing, setEditing] = useState(false)
    const [editValue, setEditValue] = useState(String(value))
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [editing])

    function handleSave() {
        const num = parseInt(editValue, 10)
        if (!isNaN(num) && num >= 0 && num !== value) {
            onSave(num)
        }
        setEditing(false)
        setEditValue(String(value))
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") handleSave()
        if (e.key === "Escape") {
            setEditing(false)
            setEditValue(String(value))
        }
    }

    if (editing) {
        return (
            <input
                ref={inputRef}
                type="number"
                min="0"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-20 rounded border border-blue-400 px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
        )
    }

    return (
        <button
            onClick={() => {
                setEditValue(String(value))
                setEditing(true)
            }}
            className="cursor-pointer text-sm text-gray-900 hover:text-blue-600 hover:underline"
            title="Click để chỉnh sửa"
        >
            {format(value)}
        </button>
    )
}
