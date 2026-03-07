'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ArrowLeft, Save, Send, XCircle, RotateCcw, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { updateJob, deleteJob } from '@/lib/actions/jobs'

const schema = z.object({
    title: z.string().min(3, 'Judul minimal 3 karakter'),
    description: z.string().optional(),
    requirements: z.string().optional(),
    location: z.string().optional(),
    work_type: z.string().optional(),
    employment_type: z.string().min(1, 'Tipe pekerjaan wajib dipilih'),
    deadline: z.string().optional(),
    status: z.string(),
})

export default function EditJobForm({ job, companySlug }) {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            title: job.title,
            description: job.description ?? '',
            requirements: job.requirements ?? '',
            location: job.location ?? '',
            work_type: job.work_type ?? '',
            employment_type: job.employment_type ?? '',
            deadline: job.deadline ?? '',
            status: job.status,
        },
    })

    async function handleSubmit(status) {
        const values = form.getValues()
        const fd = new FormData()
        Object.entries({ ...values, status }).forEach(([k, v]) => fd.append(k, v ?? ''))
        await updateJob(job.id, fd)
    }

    async function handleDelete() {
        await deleteJob(job.id)
    }

    const STATUS_LABEL = {
        draft: { label: 'Draft', class: 'bg-muted text-muted-foreground' },
        published: { label: 'Aktif', class: 'bg-green-100 text-green-700' },
        closed: { label: 'Tutup', class: 'bg-destructive/10 text-destructive' },
    }

    return (
        <div>
            <div className="mb-6">
                <Link href="/dashboard/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Lowongan
                </Link>
                <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${STATUS_LABEL[job.status].class}`}>
                            {STATUS_LABEL[job.status].label}
                        </div>
                    </div>
                    {job.status === 'published' && companySlug && (
                        <a
                            href={`/${companySlug}/${job.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({ variant: "outline", className: "shrink-0 gap-2" })}
                        >
                            <ExternalLink className="w-4 h-4" /> Lihat Halaman Publik
                        </a>
                    )}
                </div>
            </div>

            <div className="max-w-2xl">
                <Form {...form}>
                    <div className="bg-card border border-border rounded-xl divide-y divide-border">

                        <div className="p-6 space-y-5">
                            <p className="text-sm font-semibold text-foreground">Informasi Dasar</p>

                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Judul Posisi <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input className="h-10" {...field} />
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
                                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
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
                                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
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
                                            <Input className="h-10" {...field} />
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

                        <div className="p-6 space-y-5">
                            <p className="text-sm font-semibold text-foreground">Detail Lowongan</p>

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deskripsi Pekerjaan</FormLabel>
                                    <FormControl>
                                        <Textarea className="min-h-[140px] resize-y" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="requirements" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Persyaratan & Kualifikasi</FormLabel>
                                    <FormControl>
                                        <Textarea className="min-h-[120px] resize-y" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Status Actions */}
                        <div className="p-6">
                            <p className="text-sm font-semibold text-foreground mb-4">Ubah Status</p>
                            <div className="flex flex-wrap gap-2">
                                {job.status !== 'published' && (
                                    <Button
                                        type="button"
                                        className="bg-primary hover:bg-brand-600 text-primary-foreground"
                                        onClick={() => form.handleSubmit(() => handleSubmit('published'))()}
                                    >
                                        <Send className="w-4 h-4 mr-2" /> Publish
                                    </Button>
                                )}
                                {job.status === 'published' && (
                                    <Button type="button" variant="outline" onClick={() => form.handleSubmit(() => handleSubmit('closed'))()}>
                                        <XCircle className="w-4 h-4 mr-2" /> Tutup Lowongan
                                    </Button>
                                )}
                                {job.status === 'closed' && (
                                    <Button type="button" variant="outline" onClick={() => form.handleSubmit(() => handleSubmit('draft'))()}>
                                        <RotateCcw className="w-4 h-4 mr-2" /> Kembalikan ke Draft
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Save & Delete */}
                        <div className="p-6 flex items-center justify-between">
                            <AlertDialog>
                                <AlertDialogTrigger
                                    render={<Button type="button" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={job.status !== 'draft'} />}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Hapus
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Lowongan?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Lowongan &quot;{job.title}&quot; akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
                                            Ya, Hapus
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Button
                                type="button"
                                className="bg-primary hover:bg-brand-600 text-primary-foreground"
                                onClick={form.handleSubmit(() => handleSubmit(job.status))}
                                disabled={form.formState.isSubmitting}
                            >
                                <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                            </Button>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    )
}
