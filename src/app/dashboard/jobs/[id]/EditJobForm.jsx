'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ArrowLeft, Save, Send, XCircle, RotateCcw, Trash2, ExternalLink, Banknote } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { updateJob, deleteJob } from '@/lib/actions/jobs'
import ScreeningQuestionsBuilder from '@/components/jobs/ScreeningQuestionsBuilder'

const schema = z.object({
    title: z.string().min(3, 'Judul minimal 3 karakter'),
    description: z.string().optional(),
    requirements: z.string().optional(),
    location: z.string().optional(),
    work_type: z.string().optional(),
    employment_type: z.string().min(1, 'Tipe pekerjaan wajib dipilih'),
    deadline: z.string().optional(),
    status: z.string(),
    screening_questions: z.string().optional(),
    salary_min: z.string().optional(),
    salary_max: z.string().optional(),
    salary_currency: z.string().optional(),
    show_salary: z.boolean().default(false),
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
            screening_questions: job.screening_questions ? (typeof job.screening_questions === 'string' ? job.screening_questions : JSON.stringify(job.screening_questions)) : '[]',
            salary_min: job.salary_min?.toString() ?? '',
            salary_max: job.salary_max?.toString() ?? '',
            salary_currency: job.salary_currency ?? 'IDR',
            show_salary: !!job.show_salary,
        },
    })

    const formatNumber = (num) => {
        if (!num) return ''
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    }

    const parseNumber = (str) => {
        return str.replace(/\./g, '')
    }

    async function handleSubmit(status) {
        const values = form.getValues()
        const fd = new FormData()
        
        const payload = {
            ...values,
            status,
            salary_min: parseNumber(values.salary_min),
            salary_max: parseNumber(values.salary_max)
        }

        Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ''))
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
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium mt-1 ${STATUS_LABEL[job.status].class}`}>
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

            <div className="max-w-6xl mx-auto">
                <Form {...form}>
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        {/* Kolom Kiri — Form Utama */}
                        <div className="flex-1 space-y-6 min-w-0 order-2 lg:order-1">
                            {/* Informasi Dasar */}
                            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6">
                                <div className="space-y-0.5">
                                    <h2 className="text-base font-bold text-slate-900">Informasi Dasar</h2>
                                    <p className="text-xs text-slate-400 font-medium">Posisi & lokasi</p>
                                </div>

                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-600">Judul Posisi <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input className="h-10 rounded-md" placeholder="mis. Frontend Engineer" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="employment_type" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-600">Tipe Pekerjaan <span className="text-destructive">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 rounded-md"><SelectValue /></SelectTrigger>
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
                                            <FormLabel className="text-xs font-semibold text-slate-600">Metode Kerja</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 rounded-md"><SelectValue /></SelectTrigger>
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="location" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-600">Lokasi</FormLabel>
                                            <FormControl>
                                                <Input className="h-10 rounded-md" placeholder="mis. Jakarta / Remote" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="deadline" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-600">Batas Pendaftaran</FormLabel>
                                            <FormControl>
                                                <Input type="date" className="h-10 rounded-md" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="pt-5 border-t border-slate-100 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-md bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-200">
                                            <Banknote className="w-4 h-4" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h2 className="text-sm font-bold text-slate-900 leading-none">Standard Gaji</h2>
                                            <p className="text-xs text-slate-400 font-medium">Kompensasi</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="salary_min" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold text-slate-600">Gaji Minimal</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="mis. 5.000.000"
                                                        className="h-10 rounded-md"
                                                        {...field}
                                                        value={formatNumber(field.value)}
                                                        onChange={(e) => field.onChange(parseNumber(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="salary_max" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold text-slate-600">Gaji Maksimal</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="mis. 8.000.000"
                                                        className="h-10 rounded-md"
                                                        {...field}
                                                        value={formatNumber(field.value)}
                                                        onChange={(e) => field.onChange(parseNumber(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-md border border-dashed border-slate-200">
                                        <FormField control={form.control} name="salary_currency" render={({ field }) => (
                                            <FormItem className="w-full sm:w-40">
                                                <FormLabel className="text-xs font-semibold text-slate-500">Mata Uang</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value ?? 'IDR'}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 rounded-md bg-white"><SelectValue /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="IDR">IDR (Rp)</SelectItem>
                                                        <SelectItem value="USD">USD ($)</SelectItem>
                                                        <SelectItem value="SGD">SGD (S$)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="show_salary" render={({ field }) => (
                                            <FormItem className="flex items-center space-x-3 space-y-0 pt-4 sm:pt-5">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                                <div className="grid gap-1 leading-none">
                                                    <FormLabel className="text-sm font-semibold text-slate-900 cursor-pointer">Tampilkan Gaji ke Publik</FormLabel>
                                                    <p className="text-xs text-slate-400 font-medium">Ini akan membantu menarik kandidat yang sesuai budget.</p>
                                                </div>
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            </div>

                            {/* Detail Lowongan & Screening */}
                            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6">
                                <div className="space-y-6">
                                    <div className="space-y-0.5">
                                        <h2 className="text-base font-bold text-slate-900">Detail Posisi</h2>
                                        <p className="text-xs text-slate-400 font-medium">Deskripsi pekerjaan</p>
                                    </div>
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-600">Tanggung Jawab & Peran</FormLabel>
                                            <FormControl>
                                                <Textarea className="min-h-[180px] rounded-md text-sm leading-relaxed" placeholder="Tuliskan tugas harian kandidat..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="requirements" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-600">Kualifikasi Minimal</FormLabel>
                                            <FormControl>
                                                <Textarea className="min-h-[140px] rounded-md text-sm leading-relaxed" placeholder="mis. Minimal 2 tahun pengalaman, Menguasai React dsb..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <FormField control={form.control} name="screening_questions" render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <ScreeningQuestionsBuilder value={field.value} onChange={field.onChange} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan — Sidebar Aksi & Status */}
                        <div className="w-full lg:w-80 space-y-4 order-1 lg:order-2 sticky lg:top-6">
                            {/* Aksi & Save */}
                            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-900">Kelola Lowongan</h3>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", job.status === 'draft' ? "bg-amber-500" : "bg-slate-200")} />
                                            <span className={cn("text-xs font-medium", job.status === 'draft' ? "text-amber-600" : "text-slate-400")}>Draft</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", job.status === 'published' ? "bg-emerald-500" : "bg-slate-200")} />
                                            <span className={cn("text-xs font-medium", job.status === 'published' ? "text-emerald-600" : "text-slate-400")}>Aktif</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", job.status === 'closed' ? "bg-rose-500" : "bg-slate-200")} />
                                            <span className={cn("text-xs font-medium", job.status === 'closed' ? "text-rose-600" : "text-slate-400")}>Tutup</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2 pt-1">
                                    {job.status !== 'published' && (
                                        <Button
                                            type="button"
                                            className="w-full h-10 rounded-md bg-primary hover:bg-brand-600 text-white font-semibold"
                                            onClick={() => form.handleSubmit(() => handleSubmit('published'))()}
                                        >
                                            <Send className="w-4 h-4 mr-2" /> Publish Sekarang
                                        </Button>
                                    )}
                                    {job.status === 'published' && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-10 rounded-md font-semibold"
                                            onClick={() => form.handleSubmit(() => handleSubmit('closed'))()}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" /> Tutup Lowongan
                                        </Button>
                                    )}

                                    {job.status !== 'draft' && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-10 rounded-md font-semibold"
                                            onClick={() => form.handleSubmit(() => handleSubmit('draft'))()}
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" /> Kembalikan ke Draft
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        className="w-full h-10 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                                        onClick={form.handleSubmit(() => handleSubmit(job.status))}
                                        disabled={form.formState.isSubmitting}
                                    >
                                        {form.formState.isSubmitting ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>}
                                    </Button>
                                </div>
                            </div>

                            {/* Delete Option */}
                            <div className="bg-rose-50 border border-rose-200 rounded-md p-5">
                                <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide mb-3">Zona Berbahaya</p>
                                <AlertDialog>
                                    <AlertDialogTrigger
                                        render={<Button type="button" variant="outline" className="w-full h-9 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-100 font-semibold border-rose-200 text-xs" />}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Hapus Lowongan Permanen
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-md p-6">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-lg font-bold text-slate-900">Hapus Lowongan?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                                Lowongan &quot;{job.title}&quot; akan dihapus permanen. Semua data lamaran di dalamnya tidak dapat dikembalikan.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="pt-4 gap-2">
                                            <AlertDialogCancel className="h-10 rounded-md font-semibold px-5">Batal</AlertDialogCancel>
                                            <AlertDialogAction className="h-10 rounded-md bg-rose-600 hover:bg-rose-700 font-semibold px-5" onClick={handleDelete}>
                                                Ya, Hapus Sekarang
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    )
}
