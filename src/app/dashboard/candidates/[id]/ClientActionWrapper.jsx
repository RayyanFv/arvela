'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ClientActionWrapper({ applicationId, action, children }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleAction() {
        if (!confirm('Apakah Anda yakin ingin membatalkan status hire ini? Data karyawan akan dihapus.')) return

        setLoading(true)
        try {
            const result = await action({ applicationId })
            if (result.success) {
                router.refresh()
            }
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    const clonedChild = React.cloneElement(children, {
        onClick: handleAction,
        disabled: loading
    })

    return (
        <div className="relative">
            {clonedChild}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
            )}
        </div>
    )
}

