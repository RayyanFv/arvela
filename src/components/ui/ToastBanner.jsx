'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'

export function ToastBanner({ toast }) {
    if (!toast) return null
    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-md shadow-md flex items-center gap-3 ${
                toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
        >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-semibold">{toast.message}</p>
        </div>
    )
}
