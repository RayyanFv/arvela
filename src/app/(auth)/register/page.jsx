"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Building2 } from 'lucide-react'
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
    companyName: z.string().min(3, 'Nama perusahaan minimal 3 karakter'),
    fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
})

export default function RegisterPage() {
    const router = useRouter()
    const [error, setError] = useState('')
    const supabase = createClient()

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName: '',
            fullName: '',
            email: '',
            password: '',
        },
    })

    async function onSubmit(values) {
        setError('')
        const { error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
                data: {
                    company_name: values.companyName,
                    full_name: values.fullName,
                    role: 'hr'
                }
            }
        })

        if (error) {
            setError(error.message)
            return
        }

        router.push('/dashboard')
        // Router refresh inside a short timeout ensures cookies are properly propagated
        setTimeout(() => router.refresh(), 500)
    }

    return (
        <div className="w-full max-w-sm mx-auto animate-in slide-in-from-right-8 duration-700">
            <div className="mb-8 text-center md:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 mb-4">
                    <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-sidebar-bg mb-2">Daftar Perusahaan</h1>
                <p className="text-sidebar-muted text-sm">Buat akun untuk mulai merekrut bakat terbaik.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sidebar-bg font-semibold">Nama Perusahaan</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="PT Maju Bersama"
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
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sidebar-bg font-semibold">Nama Lengkap HR</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Budi Santoso"
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
                                <FormLabel className="text-sidebar-bg font-semibold">Password</FormLabel>
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
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium my-2">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11 mt-4 font-semibold text-base bg-primary hover:bg-brand-600 text-white shadow-md hover:shadow-lg transition-all"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting ? 'Mendaftar...' : 'Daftar Sekarang'}
                    </Button>
                </form>
            </Form>

            <div className="mt-8 text-center text-sm text-sidebar-muted">
                Sudah mendaftarkan perusahaan?{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline transition-all">
                    Masuk di sini
                </Link>
            </div>
        </div>
    )
}
