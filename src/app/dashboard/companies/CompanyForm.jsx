'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCompany, updateCompany } from '@/lib/actions/companies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function CompanyForm({ initialData = null }) {
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
                await updateCompany(initialData.id, formData)
            } else {
                await createCompany(formData)
            }
        } catch (err) {
            setError(err.message || 'Gagal menyimpan data perusahaan')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="max-w-3xl space-y-8">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/companies" className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">{isEditing ? 'Edit Perusahaan' : 'Tambah Perusahaan Baru'}</h1>
                    <p className="text-slate-500 text-sm">Kelola master data perusahaan untuk kebutuhan migrasi sistem.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-100">
                    {error}
                </div>
            )}

            <div className="bg-white border text-sm border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
                <div className="space-y-2">
                    <Label>Nama Perusahaan</Label>
                    <Input name="name" required defaultValue={initialData?.name} placeholder="Contoh: PT Arvela Teknologi" className="font-bold text-lg" />
                </div>

                <div className="space-y-2">
                    <Label>Slug (Opsional)</Label>
                    <Input name="slug" defaultValue={initialData?.slug} placeholder="Dikosongkan untuk otomatisasi" className="font-mono text-slate-600 bg-slate-50" />
                    <p className="text-xs text-slate-400">Harus unik. Gunakan huruf kecil dan strip (contoh: pt-arvela-teknologi).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Industri</Label>
                        <Input name="industry" defaultValue={initialData?.industry} placeholder="Contoh: Teknologi, Retail, F&B" />
                    </div>

                    <div className="space-y-2">
                        <Label>Ukuran Perusahaan (Size)</Label>
                        <Input name="size" defaultValue={initialData?.size} placeholder="Contoh: 1-50, 51-200, 201-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Website</Label>
                        <Input name="website" type="url" defaultValue={initialData?.website} placeholder="https://arvela.id" />
                    </div>

                    <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input name="logo_url" type="url" defaultValue={initialData?.logo_url} placeholder="https://image.com/logo.png" />
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full py-6 text-sm font-black shadow-xl rounded-xl group relative overflow-hidden transition-all hover:scale-[1.02]">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? 'Simpan Perubahan' : 'Tambahkan Perusahaan')}
            </Button>
        </form>
    )
}
