"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const formSchema = z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
})

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState('')
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
        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        })

        if (error) {
            setError(error.message)
            return
        }

        router.push('/dashboard')
        router.refresh()
    }

    return (
        <div className="w-full max-w-sm mx-auto animate-in slide-in-from-right-8 duration-700">
            <div className="mb-8 text-center md:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 mb-4">
                    <LogIn className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-sidebar-bg mb-2">Selamat Datang</h1>
                <p className="text-sidebar-muted text-sm">Masuk ke akun HR Anda untuk mengelola rekrutmen.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sidebar-bg font-semibold">Email Kerja</FormLabel>
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
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-11 bg-white/50 border-sidebar-text focus:border-primary focus:ring-primary transition-all"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11 text-base font-semibold bg-primary hover:bg-brand-600 text-white shadow-md hover:shadow-lg transition-all"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting ? 'Memproses...' : 'Masuk Sekarang'}
                    </Button>
                </form>
            </Form>

            <div className="mt-8 text-center text-sm text-sidebar-muted">
                Belum mendaftarkan perusahaan?{' '}
                <Link href="/register" className="text-primary font-semibold hover:underline transition-all">
                    Daftar di sini
                </Link>
            </div>
        </div>
    )
}
