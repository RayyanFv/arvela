'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, TicketPercent, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/portal/auth/callback`
            }
        })

        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 flex items-center gap-2">
                <TicketPercent className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold tracking-tight text-foreground">Arvela<span className="text-primary">HR</span> Candidate</span>
            </div>

            <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">

                {success ? (
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Cek Email Anda!</h2>
                        <p className="text-sm text-muted-foreground">
                            Kami telah mengirimkan <i>Magic Link</i> ke <strong>{email}</strong>. Silakan klik link tersebut untuk masuk ke portal.
                        </p>
                        <Button variant="outline" className="mt-4 w-full" onClick={() => setSuccess(false)}>
                            Gunakan Email Lain
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <h1 className="text-xl font-bold text-foreground mb-2">Pantau Lamaran Anda</h1>
                            <p className="text-sm text-muted-foreground">
                                Masuk tanpa password. Masukkan email yang Anda gunakan saat melamar.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11"
                                    required
                                />
                            </div>

                            {error && <p className="text-xs text-destructive">{error}</p>}

                            <Button type="submit" className="w-full h-11" disabled={loading}>
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim Link...</>
                                ) : (
                                    <>Kirim Link Login <ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </div>

            <p className="text-xs text-muted-foreground mt-8">
                &copy; {new Date().getFullYear()} ArvelaHR Portal. All rights reserved.
            </p>
        </div>
    )
}
