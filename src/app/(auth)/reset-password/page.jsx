"use client"

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Komponen utama yang pakai useSearchParams dipindah ke sini
function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [mode, setMode] = useState('request')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const supabase = createClient()

    useEffect(() => {
        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) setMode('update')
        }
        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') setMode('update')
        })

        return () => subscription.unsubscribe()
    }, [supabase.auth])

    async function handleRequest(e) {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) {
            setMessage({ type: 'error', text: error.message })
        } else {
            setMessage({ type: 'success', text: 'Instruksi reset password telah dikirim ke email Anda.' })
        }
        setLoading(false)
    }

    async function handleUpdate(e) {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
            setMessage({ type: 'error', text: error.message })
        } else {
            setMessage({ type: 'success', text: 'Password berhasil diperbarui! Mengalihkan...' })
            setTimeout(() => router.push('/login'), 2000)
        }
        setLoading(false)
    }

    return (
        <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8 text-center md:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
                    {mode === 'request' ? <Mail className="w-6 h-6 text-primary" /> : <KeyRound className="w-6 h-6 text-primary" />}
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">
                    {mode === 'request' ? 'Reset Password' : 'Setel Password Baru'}
                </h1>
                <p className="text-slate-500 text-sm font-medium">
                    {mode === 'request'
                        ? 'Masukkan email Anda untuk menerima tautan pemulihan.'
                        : 'Silakan masukkan password baru yang kuat untuk akun Anda.'}
                </p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-2xl mb-6 flex gap-3 ${message.type === 'error'
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                    {message.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <p className="text-sm font-bold">{message.text}</p>
                </div>
            )}

            {mode === 'request' ? (
                <form onSubmit={handleRequest} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-900 font-black text-xs uppercase tracking-widest">
                            Email Terdaftar
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="nama@perusahaan.com"
                            required
                            className="h-12 rounded-2xl border-slate-200 focus:border-primary focus:ring-primary transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={loading}
                        className="w-full h-12 bg-primary hover:bg-brand-600 text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all">
                        {loading ? 'Mengirim...' : 'Kirim Instruksi'}
                    </Button>
                    <div className="text-center">
                        <button type="button" onClick={() => router.push('/login')}
                            className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                            Kembali ke Login
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-900 font-black text-xs uppercase tracking-widest">
                            Password Baru
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            className="h-12 rounded-2xl border-slate-200 focus:border-primary focus:ring-primary transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-400 font-medium italic">
                            Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.
                        </p>
                    </div>
                    <Button type="submit" disabled={loading}
                        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-lg transition-all">
                        {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                    </Button>
                </form>
            )}
        </div>
    )
}

// Page export — wrap dengan Suspense di sini
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="w-full max-w-sm mx-auto">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    )
}