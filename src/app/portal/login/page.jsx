'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Briefcase, CheckCircle2, ArrowRight, Mail } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CandidateLoginPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    async function handleLogin(e) {
        e.preventDefault()
        if (!email) return

        setLoading(true)
        setError('')

        const supabase = createClient()
        const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/portal/auth/callback`
            }
        })

        if (otpError) {
            setError(otpError.message)
        } else {
            setSuccess(true)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
            <Link href="/portal" className="mb-8 flex items-center gap-2">
                <div className="w-10 h-10 overflow-hidden flex items-center justify-center">
                    <img src="/arvela-logo.png" alt="Arvela" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-xl tracking-tight text-slate-900 leading-none">
                        Arvela <span className="text-blue-600">Career</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Candidate Portal</span>
                </div>
            </Link>

            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">

                {success ? (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">Cek Email Anda!</h2>
                            <p className="text-sm text-slate-500 font-medium">
                                Kami telah mengirimkan <i>Magic Link</i> ke <strong>{email}</strong>. Silakan klik link tersebut untuk masuk ke portal.
                            </p>
                        </div>
                        <Button variant="outline" className="mt-4 w-full h-11 border-slate-200 font-bold" onClick={() => setSuccess(false)}>
                            Gunakan Email Lain
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Pantau Lamaran</h1>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Masuk tanpa password. Gunakan email yang Anda gunakan saat melamar pekerjaan.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Kandidat</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 rounded-lg border-slate-200 text-sm font-medium focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    required
                                />
                            </div>

                            {error && <p className="text-xs text-destructive font-bold">{error}</p>}

                            <Button type="submit" className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-500/10" disabled={loading}>
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sedang Mengirim Link...</>
                                ) : (
                                    <>Kirim Link Login <ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </div>

            <p className="text-xs font-bold text-slate-400 mt-8">
                &copy; {new Date().getFullYear()} Arvela Career Portal. All rights reserved.
            </p>
        </div>
    )
}
