'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { ArrowLeft, Save, Send, Banknote } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { createJob } from '@/lib/actions/jobs'
import ScreeningQuestionsBuilder from '@/components/jobs/ScreeningQuestionsBuilder'

const schema = z.object({
    title: z.string().min(3, 'Judul minimal 3 karakter'),
    description: z.string().optional(),
    requirements: z.string().optional(),
    location: z.string().optional(),
    work_type: z.string().optional(),
    employment_type: z.string().min(1, 'Tipe pekerjaan wajib dipilih'),
    deadline: z.string().optional(),
    screening_questions: z.string().optional(),
    salary_min: z.string().optional(),
    salary_max: z.string().optional(),
    salary_currency: z.string().optional(),
    show_salary: z.boolean().default(false),
    visibility: z.string().default('public'),
})

export default function NewJobPage() {
    const router = useRouter()
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '', description: '', requirements: '',
            location: '', work_type: '', employment_type: '', deadline: '', screening_questions: '[]',
            salary_min: '', salary_max: '', salary_currency: 'IDR', show_salary: false,
            visibility: 'public',
        },
    })

    const formatNumber = (num) => {
        if (!num) return ''
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    }

    const parseNumber = (str) => {
        return str.replace(/\./g, '')
    }

    async function handleSubmit(values, publish = false) {
        const fd = new FormData()
        
        const payload = {
            ...values,
            salary_min: parseNumber(values.salary_min),
            salary_max: parseNumber(values.salary_max)
        }

        Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ''))
        if (publish) fd.set('publish', '1')
        try {
            await createJob(fd)
        } catch (err) {

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
                                                    <SelectTrigger className="h-10 rounded-md"><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
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
                                                    <SelectTrigger className="h-10 rounded-md"><SelectValue placeholder="Pilih metode" /></SelectTrigger>
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
                                    <FormField control={form.control} name="visibility" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-600">Visibilitas</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value ?? 'public'}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 rounded-md"><SelectValue /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="public">Publik — tampil di halaman karir</SelectItem>
                                                    <SelectItem value="link_only">Siapa saja yang punya link</SelectItem>
                                                    <SelectItem value="invited">Hanya yang diundang (email)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {field.value === 'invited' && (
                                                <p className="text-[11px] text-slate-400 font-medium">Daftar email undangan bisa diatur setelah lowongan dibuat.</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="space-y-3 pt-1 border-t border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-900">Post Lowongan</h3>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            <span className="text-xs font-medium text-amber-600">Draft Baru</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                            <span className="text-xs font-medium text-slate-400">Aktif</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                            <span className="text-xs font-medium text-slate-400">Tutup</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2 pt-1">
                                    <Button
                                        type="button"
                                        className="w-full h-10 rounded-md bg-primary hover:bg-brand-600 text-white font-semibold"
                                        onClick={form.handleSubmit(vals => handleSubmit(vals, true))}
                                    >
                                        <Send className="w-4 h-4 mr-2" /> Publish Sekarang
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-10 rounded-md font-semibold"
                                        onClick={form.handleSubmit(vals => handleSubmit(vals, false))}
                                        disabled={form.formState.isSubmitting}
                                    >
                                        {form.formState.isSubmitting ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-2" /> Simpan Draft</>}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                    Dengan mempublikasikan lowongan, posisi ini akan langsung muncul di halaman karir Anda.
                                </p>
                            </div>

                            {/* Help Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-5 space-y-2">
                                <h4 className="text-xs font-semibold text-blue-900">Butuh Bantuan?</h4>
                                <p className="text-xs text-blue-700/70 font-medium leading-relaxed">
                                    Jika Anda bingung menentukan kriteria screening, gunakan template standar atau hubungi tim Arvela.
                                </p>
                            </div>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    )
}
