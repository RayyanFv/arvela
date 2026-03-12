'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ROLES } from '@/lib/constants/roles'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Components
import { HRAdminDashboard } from './components/HRAdminDashboard'
import { OwnerDashboard } from './components/OwnerDashboard'
import { SuperAdminDashboard } from './components/SuperAdminDashboard'

export default function DashboardRouter() {
    const supabase = createClient()
    const router = useRouter()
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        async function fetchRole() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                
                if (!user) {
                    router.push('/login')
                    return
                }

                // Try DB profile first
                const { data: profile, error: profError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile?.role) {
                    setRole(profile.role)
                } else {
                    // Fallback: read role from JWT user_metadata
                    const metaRole = user.user_metadata?.role
                    if (metaRole) {
                        setRole(metaRole)
                    } else {
                        console.error('Could not determine role from profile or metadata')
                        setError(true)
                    }
                }
            } catch (err) {
                console.error('Dashboard Auth Error:', err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }
        
        fetchRole()
    }, [router, supabase])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="font-medium text-sm animate-pulse tracking-widest uppercase">Mempersiapkan Dashboard...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Gagal Akses Dashboard</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-xs">Terjadi kendala saat memvalidasi hak akses Anda. Silakan coba login kembali.</p>
                <button 
                    onClick={() => { window.location.reload() }}
                    className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm"
                >
                    Refresh Halaman
                </button>
            </div>
        )
    }

    // Role-based rendering
    switch (role) {
        case ROLES.SUPER_ADMIN:
            return <SuperAdminDashboard />
        case ROLES.OWNER:
            return <OwnerDashboard />
        case ROLES.HR_ADMIN:
            return <HRAdminDashboard />
        default:
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <p className="text-slate-400 font-bold">Role tidak dikenali: {role}</p>
                    <Link href="/login" className="text-primary font-bold mt-2">Kembali ke Login</Link>
                </div>
            )
    }
}
