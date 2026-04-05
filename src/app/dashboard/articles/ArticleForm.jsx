'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createArticle, updateArticle } from '@/lib/actions/articles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function ArticleForm({ initialData = null }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const isEditing = !!initialData

    async function onSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)

        try {
            if (isEditing) {
                await updateArticle(initialData.id, formData)
            } else {
                await createArticle(formData)
            }
        } catch (err) {
            setError(err.message || 'Gagal menyimpan artikel')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="max-w-4xl space-y-8">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/articles" className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">{isEditing ? 'Edit Artikel' : 'Tulis Artikel Baru'}</h1>
                    <p className="text-slate-500 text-sm">Optimalkan SEO konten Anda sesuai dengan *Article Brief*.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-100">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="space-y-2">
                        <Label>Judul Artikel</Label>
                        <Input name="title" required defaultValue={initialData?.title} placeholder="Contoh: Apa itu HRIS?" className="text-lg font-bold py-6" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Kategori Topik</Label>
                            <Input name="category" defaultValue={initialData?.category} placeholder="Contoh: Tutorial, Research, Insight" />
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Penulis (Bebas / Bebas Cetak)</Label>
                            <Input name="author_name" defaultValue={initialData?.author_name} placeholder="Misal: Dian Kusumawati" />
                        </div>
                    </div>

                    {isEditing && (
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input name="slug" defaultValue={initialData?.slug} readOnly className="bg-slate-50 text-slate-500" />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Konten Artikel (Markdown supported / HTML)</Label>
                        <Textarea 
                            name="content" 
                            required 
                            defaultValue={initialData?.content} 
                            placeholder="Tulis isi artikel di sini..." 
                            className="min-h-[400px] whitespace-pre-wrap font-mono text-sm shadow-inner"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="font-bold text-slate-900 text-sm">Pengaturan SEO Meta</h3>
                        
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Meta Title</Label>
                            <Input name="meta_title" defaultValue={initialData?.meta_title} placeholder="Max 60 karakter" className="bg-white" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Meta Description</Label>
                            <Textarea name="meta_description" defaultValue={initialData?.meta_description} placeholder="Max 160 karakter" className="bg-white resize-none" rows={3} />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Kata Kunci (pisahkan dengan koma)</Label>
                            <Input name="keywords" defaultValue={initialData?.keywords?.join(', ')} placeholder="Contoh: hris, artikel seo" className="bg-white" />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="font-bold text-slate-900 text-sm">Status Publikasi</h3>
                        
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Status</Label>
                            <Select name="status" defaultValue={initialData?.status || 'draft'}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft (Sembunyikan)</SelectItem>
                                    <SelectItem value="published">Publish (Tampilkan)</SelectItem>
                                    <SelectItem value="archived">Arsip</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full py-6 text-sm font-black shadow-xl rounded-xl group relative overflow-hidden transition-all hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? 'Simpan Perubahan' : 'Terbitkan Artikel')}
                    </Button>
                </div>
            </div>
        </form>
    )
}
