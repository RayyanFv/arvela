'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { ArrowLeft, Save, Send } from 'lucide-react'
import Link from 'next/link'
import { createJob } from '@/lib/actions/jobs'

const schema = z.object({
    title: z.string().min(3, 'Judul minimal 3 karakter'),
    description: z.string().optional(),
    requirements: z.string().optional(),
    location: z.string().optional(),
    work_type: z.string().optional(),
    employment_type: z.string().min(1, 'Tipe pekerjaan wajib dipilih'),
    deadline: z.string().optional(),
})

export default function NewJobPage() {
    const router = useRouter()
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '', description: '', requirements: '',
            location: '', work_type: '', employment_type: '', deadline: '',
        },
    })

    async function handleSubmit(values, publish = false) {
        const fd = new FormData()
        Object.entries(values).forEach(([k, v]) => fd.append(k, v ?? ''))
        if (publish) fd.set('publish', '1')
        try {
            await createJob(fd)
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div>
            <div className="mb-6">
                <Link href="/dashboard/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Lowongan
                </Link>
                <PageHeader title="Buat Lowongan Baru" description="Isi detail posisi yang ingin Anda buka." />
            </div>

            <div className="max-w-2xl">
                <Form {...form}>
                    <div className="bg-card border border-border rounded-xl divide-y divide-border">

                        {/* Bagian 1: Informasi Dasar */}
                        <div className="p-6 space-y-5">
                            <p className="text-sm font-semibold text-foreground">Informasi Dasar</p>

                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Judul Posisi <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="mis. Frontend Engineer, Product Manager" className="h-10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="employment_type" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipe Pekerjaan <span className="text-destructive">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                            <FormControl>
                                                <SelectTrigger className="h-10"><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="fulltime">Full-time</SelectItem>
                                                <SelectItem value="parttime">Part-time</SelectItem>
                                                <SelectItem value="contract">Kontrak</SelectItem>
                                                <SelectItem value="internship">Magang</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="work_type" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Metode Kerja</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                            <FormControl>
                                                <SelectTrigger className="h-10"><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="onsite">On-site</SelectItem>
                                                <SelectItem value="hybrid">Hybrid</SelectItem>
                                                <SelectItem value="remote">Remote</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="location" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lokasi</FormLabel>
                                        <FormControl>
                                            <Input placeholder="mis. Jakarta, Bandung" className="h-10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="deadline" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Batas Pendaftaran</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="h-10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        {/* Bagian 2: Detail Lowongan */}
                        <div className="p-6 space-y-5">
                            <p className="text-sm font-semibold text-foreground">Detail Lowongan</p>

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deskripsi Pekerjaan</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Jelaskan tanggung jawab, lingkungan kerja, dan hal-hal menarik dari posisi ini..."
                                            className="min-h-[140px] resize-y"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="requirements" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Persyaratan & Kualifikasi</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tuliskan kualifikasi yang dibutuhkan, misalnya pendidikan minimal, pengalaman, dan skill..."
                                            className="min-h-[120px] resize-y"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Actions */}
                        <div className="p-6 flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={form.handleSubmit(vals => handleSubmit(vals, false))}
                                disabled={form.formState.isSubmitting}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Simpan Draft
                            </Button>
                            <Button
                                type="button"
                                className="bg-primary hover:bg-brand-600 text-primary-foreground"
                                onClick={form.handleSubmit(vals => handleSubmit(vals, true))}
                                disabled={form.formState.isSubmitting}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Publish Sekarang
                            </Button>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    )
}
