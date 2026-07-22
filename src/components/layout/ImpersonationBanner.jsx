'use client'

import { useState, useEffect } from 'react'
import { getImpersonationState, stopImpersonation } from '@/lib/actions/impersonate'
import { UserCheck, LogOut, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImpersonationBanner() {
    const [state, setState] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getImpersonationState().then(res => {
            if (res?.isImpersonating) setState(res)
        }).catch(() => {})
    }, [])

    if (!state?.isImpersonating) return null

    const handleStop = async () => {
        setLoading(true)
        try {
            await stopImpersonation()
            window.location.href = '/dashboard/settings/users'
        } catch (err) {
            alert('Gagal menghentikan impersonasi: ' + err.message)
            setLoading(false)
        }
    }

    return (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs font-black flex items-center justify-between shadow-md z-50 sticky top-0">
            <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-white animate-pulse shrink-0" />
                <span>
                    MODE LOGGED IN AS: <strong className="underline uppercase">{state.targetUser?.full_name}</strong> ({state.targetUser?.role})
                    <span className="opacity-80 font-normal ml-2 hidden md:inline">
                        — (Akun Asli: {state.realUser?.full_name})
                    </span>
                </span>
            </div>

            <Button
                onClick={handleStop}
                disabled={loading}
                size="sm"
                variant="secondary"
                className="h-8 rounded-lg text-[11px] font-black bg-white text-slate-900 hover:bg-slate-100 gap-1.5 shadow-sm"
            >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                Kembali ke Akun Asli
            </Button>
        </div>
    )
}
