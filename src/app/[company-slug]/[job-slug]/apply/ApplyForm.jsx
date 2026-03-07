'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CheckCircle2, Upload, X, FileText, Loader2, ArrowLeft, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { uploadCVFile } from '@/lib/actions/applications'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

const schema = z.object({
    full_name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Format email tidak valid'),
    phone: z.string().optional(),
    portfolio_url: z.string().url('Format URL tidak valid').optional().or(z.literal('')),
    cv_drive_url: z.string().url('Format URL Google Drive tidak valid').optional().or(z.literal('')),
    cover_letter: z.string().optional(),
})

export default function ApplyForm({ job, company }) {
    const router = useRouter()
    const [cvFile, setCvFile] = useState(null)
    const [cvError, setCvError] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [submitError, setSubmitError] = useState('')

    const [cvMode, setCvMode] = useState('upload') // 'upload' | 'drive'

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { full_name: '', email: '', phone: '', portfolio_url: '', cv_drive_url: '', cover_letter: '' },
    })

    function handleFileChange(e) {
        const file = e.target.files?.[0]
        setCvError('')
        if (!file) return
        if (!ACCEPTED.includes(file.type)) {
            setCvError('File harus berformat PDF, DOC, atau DOCX')
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            setCvError('Ukuran file maksimal 5MB')
            return
        }
        setCvFile(file)
    }

    async function onSubmit(values) {
        setSubmitError('')

        if (cvMode === 'upload' && !cvFile) {
            setCvError('Harap upload file CV Anda')
            return
        }
        if (cvMode === 'drive' && !values.cv_drive_url) {
            form.setError('cv_drive_url', { type: 'manual', message: 'Harap masukkan link Google Drive CV Anda' })
            return
        }

        const supabase = createClient()
        let cvUrl = null

        // Upload CV jika mode upload
        if (cvMode === 'upload' && cvFile) {
            const ext = cvFile.name.split('.').pop()
            const path = `${company.id}/${job.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

            const formData = new FormData()
            formData.append('file', cvFile)

            const { url, error: uploadError } = await uploadCVFile(formData, path)

            if (uploadError) {
                setSubmitError('Gagal mengunggah CV: ' + uploadError)
                return
            }

            cvUrl = url
        } else if (cvMode === 'drive') {
            cvUrl = values.cv_drive_url
        }

        // Submit application
        const { error } = await supabase.from('applications').insert({
            job_id: job.id,
            company_id: company.id,
            full_name: values.full_name,
            email: values.email,
            phone: values.phone || null,
            portfolio_url: values.portfolio_url || null,
            cover_letter: values.cover_letter || null,
            cv_url: cvUrl,
        })

        if (error) {
            if (error.code === '23505') {
                setSubmitError('Anda sudah pernah melamar posisi ini sebelumnya dengan email yang sama.')
            } else {
                setSubmitError(`Terjadi kesalahan: ${error.message}`)
            }
            return
        }

        setSubmitted(true)
    }

    // Success state
    if (submitted) {
        return (
            <div className="flex flex-col items-center text-center py-12 px-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Lamaran Terkirim</h2>
                <p className="text-muted-foreground max-w-md mb-2 leading-relaxed">
                    Terima kasih, <strong>{form.getValues('full_name')}</strong>! Lamaran Anda untuk posisi <strong>{job.title}</strong> telah berhasil dikirim.
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                    Tim rekrutmen akan menghubungi Anda melalui email <strong>{form.getValues('email')}</strong> jika kandidat Anda sesuai dengan kebutuhan kami.
                </p>

                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 max-w-sm w-full">
                    <h3 className="text-sm font-semibold text-foreground mb-1">Pantau Status Lamaran</h3>
                    <p className="text-xs text-muted-foreground mb-3">Anda dapat terus memeriksa proges rekrutmen tanpa sandi (password) via halaman Portal Kandidat.</p>
                    <Link href="/portal/login" className={buttonVariants({ variant: 'outline', className: 'w-full h-9 text-xs' })}>
                        Buka Portal Kandidat
                    </Link>
                </div>

                <Link href={`/${company.slug}`} className="text-sm font-medium text-primary hover:underline">
                    Lihat lowongan lain di {company.name}
                </Link>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Error banner */}
                {submitError && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 flex items-start gap-3">
                        <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{submitError}</p>
                    </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="full_name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Lengkap <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="mis. Budi Santoso" className="h-10" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="email@contoh.com" className="h-10" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>No. WhatsApp / Telepon</FormLabel>
                            <FormControl>
                                <Input type="tel" placeholder="08xxxxxxxxxx" className="h-10" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="portfolio_url" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Link Portofolio / Dokumen <span className="text-muted-foreground font-normal">(opsional)</span></FormLabel>
                            <FormControl>
                                <Input type="url" placeholder="https://" className="h-10" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                {/* CV Upload */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-foreground">
                            CV / Resume <span className="text-destructive">*</span>
                        </label>
                        <div className="flex bg-muted p-0.5 rounded-lg border border-border">
                            <button
                                type="button"
                                onClick={() => { setCvMode('upload'); form.clearErrors('cv_drive_url'); }}
                                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${cvMode === 'upload' ? 'bg-background shadow-sm text-foreground space-x-1' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Upload className="w-3.5 h-3.5" /> File
                            </button>
                            <button
                                type="button"
                                onClick={() => { setCvMode('drive'); setCvError(''); }}
                                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${cvMode === 'drive' ? 'bg-background shadow-sm text-foreground space-x-1' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <LinkIcon className="w-3.5 h-3.5" /> G-Drive
                            </button>
                        </div>
                    </div>

                    {cvMode === 'upload' ? (
                        <>
                            {cvFile ? (
                                <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                                    <FileText className="w-5 h-5 text-primary shrink-0" />
                                    <span className="text-sm text-foreground flex-1 truncate">{cvFile.name}</span>
                                    <button type="button" onClick={() => setCvFile(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-brand-50/50 transition-all">
                                    <Upload className="w-5 h-5 text-muted-foreground" />
                                    <div className="text-center">
                                        <span className="text-sm text-muted-foreground block">Klik untuk pilih file CV</span>
                                        <span className="text-xs text-muted-foreground/70 block">(PDF/DOC, maks 5MB)</span>
                                    </div>
                                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                                </label>
                            )}
                            {cvError && <p className="text-xs text-destructive mt-1.5">{cvError}</p>}
                        </>
                    ) : (
                        <FormField control={form.control} name="cv_drive_url" render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input type="url" placeholder="https://drive.google.com/file/d/..." className="h-11" {...field} />
                                </FormControl>
                                <p className="text-[11px] text-muted-foreground mt-1.5">
                                    *Pastikan link Google Drive Anda disetel ke <strong>"Siapa saja yang memiliki link"</strong> (Viewer).
                                </p>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}
                </div>

                <FormField control={form.control} name="cover_letter" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Surat Lamaran / Cover Letter <span className="text-muted-foreground font-normal">(opsional)</span></FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Ceritakan mengapa Anda tertarik dengan posisi ini dan apa yang membuat Anda cocok..."
                                className="min-h-[120px] resize-y"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <Button
                    type="submit"
                    className="w-full h-11 bg-primary hover:bg-brand-600 text-primary-foreground font-semibold"
                    disabled={form.formState.isSubmitting}
                >
                    {form.formState.isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim Lamaran...</>
                    ) : (
                        'Kirim Lamaran'
                    )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                    Dengan mengirim lamaran, Anda menyetujui bahwa data Anda akan digunakan untuk proses rekrutmen.
                </p>
            </form>
        </Form>
    )
}
