"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { LogIn, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ADMIN_ROLES, ROLES } from '@/lib/constants/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
})

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(values) {
        setError('')
        setSuccess(false) // Reset success state on new submission
        const { data, error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        })

        if (error) {
            if (error.message === 'Invalid login credentials') {
                setError('Email atau password yang Anda masukkan salah. Silakan periksa kembali.')
            } else {
                setError(error.message)
            }
            return
        }

        setSuccess(true)

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

        const role = profile?.role || 'user'

        // Small delay to show success state
        setTimeout(() => {
            if (ADMIN_ROLES.includes(role)) {
                router.push('/dashboard')
            } else if (role === ROLES.EMPLOYEE) {
                router.push('/staff')
            } else {
                router.push('/portal')
            }
            router.refresh()
        }, 800)
    }

    return (
        <div className="w-full max-w-sm mx-auto animate-in slide-in-from-right-8 duration-700">
            <div className="mb-8 text-center md:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 mb-4">
                    <LogIn className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-sidebar-bg mb-2">Selamat Datang</h1>
                <p className="text-sidebar-muted text-sm">Masuk ke akun Anda untuk melanjutkan ke platform.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sidebar-bg font-semibold">Email</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="hr@perusahaan.com"
                                        className="h-11 bg-white/50 border-sidebar-text focus:border-primary focus:ring-primary transition-all"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-sidebar-bg font-semibold">Password</FormLabel>
                                    <Link href="/reset-password" className="text-xs text-primary hover:underline font-medium">Lupa password?</Link>
                                </div>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="h-11 bg-white/50 border-sidebar-text focus:border-primary focus:ring-primary transition-all pr-10"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-bold animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Berhasil! Mengalihkan Anda...
                        </div>
                    )}

                    <Button
                        type="submit"
                        className={`w-full h-11 text-base font-bold shadow-md transition-all ${success ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-primary hover:bg-brand-600 text-white"}`}
                        disabled={form.formState.isSubmitting || success}
                    >
                        {form.formState.isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Verifikasi...</span>
                            </div>
                        ) : success ? (
                            "Berhasil Login"
                        ) : 'Masuk Sekarang'}
                    </Button>
                </form>
            </Form>

            <div className="mt-8 text-center text-sm text-sidebar-muted">
                Hubungi administrator perusahaan Anda untuk mendapatkan akun.
            </div>
        </div>
    )
}
