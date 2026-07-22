'use client'

import { useState } from 'react'
import { impersonateUser } from '@/lib/actions/impersonate'
import { Button } from '@/components/ui/button'
import { UserCheck, Loader2 } from 'lucide-react'

export function LoginAsButton({ targetUser }) {
    const [loading, setLoading] = useState(false)

    const handleImpersonate = async () => {
        if (!confirm(`Apakah Anda yakin ingin Login As sebagai ${targetUser.full_name} (${targetUser.role})?`)) return
        setLoading(true)
        try {
            await impersonateUser(targetUser.id)
            if (targetUser.role === 'employee' || targetUser.role === 'user') {
                window.location.href = '/staff'
            } else {
                window.location.href = '/dashboard'
            }
        } catch (err) {
            alert('Gagal Login As: ' + err.message)
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleImpersonate}
            disabled={loading}
            size="sm"
            variant="outline"
            className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-xs gap-1.5"
        >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
            Login As
        </Button>
    )
}
