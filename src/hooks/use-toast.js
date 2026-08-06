'use client'

import { useCallback, useRef, useState } from 'react'

/**
 * Minimal shared toast state — replaces blocking alert() calls.
 * Render <ToastBanner toast={toast} /> once near the root of the page.
 */
export function useToast() {
    const [toast, setToast] = useState(null)
    const timerRef = useRef(null)

    const showToast = useCallback((message, type = 'success') => {
        clearTimeout(timerRef.current)
        setToast({ type, message })
        timerRef.current = setTimeout(() => setToast(null), 3000)
    }, [])

    return { toast, showToast }
}
