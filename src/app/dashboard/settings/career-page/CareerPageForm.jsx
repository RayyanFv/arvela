'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, ImagePlus, ExternalLink, Building2, Globe, Plus, X, Sparkles, GalleryHorizontal } from 'lucide-react'
import Link from 'next/link'
import {
    uploadCompanyBanner,
    updateCareerPageProfile,
    updateCulturePoints,
    uploadGalleryImage,
    removeGalleryImage,
} from '@/lib/actions/career-page'

const MAX_GALLERY_IMAGES = 6
const MAX_CULTURE_POINTS = 6

export default function CareerPageForm({ company }) {
    const [bannerUrl, setBannerUrl] = useState(company.banner_url || '')
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)
    const fileInputRef = useRef(null)

    const [culturePoints, setCulturePoints] = useState(
        Array.isArray(company.culture_points) && company.culture_points.length > 0
            ? company.culture_points
            : [{ title: '', description: '' }]
    )
    const [savingCulture, setSavingCulture] = useState(false)
    const [cultureError, setCultureError] = useState('')
    const [cultureSaved, setCultureSaved] = useState(false)

    const [gallery, setGallery] = useState(Array.isArray(company.gallery_urls) ? company.gallery_urls : [])
    const [galleryUploading, setGalleryUploading] = useState(false)
    const [galleryError, setGalleryError] = useState('')
    const galleryInputRef = useRef(null)

    async function handleBannerChange(e) {
        const file = e.target.files?.[0]
        if (!file) return

        setError('')
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await uploadCompanyBanner(formData)
            setBannerUrl(res.url)
        } catch (err) {
            setError(err.message || 'Gagal mengunggah banner.')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setSaving(true)
        setSaved(false)

        const formData = new FormData(e.currentTarget)
        try {
            await updateCareerPageProfile(formData)
            setSaved(true)
        } catch (err) {
            setError(err.message || 'Gagal menyimpan perubahan.')
        } finally {
            setSaving(false)
        }
    }

    function updateCulturePoint(index, field, value) {
        setCulturePoints(points => points.map((p, i) => i === index ? { ...p, [field]: value } : p))
    }

    function addCulturePoint() {
        if (culturePoints.length >= MAX_CULTURE_POINTS) return
        setCulturePoints(points => [...points, { title: '', description: '' }])
    }

    function removeCulturePoint(index) {
        setCulturePoints(points => points.filter((_, i) => i !== index))
    }

    async function handleSaveCulture() {
        setCultureError('')
        setSavingCulture(true)
        setCultureSaved(false)

        const formData = new FormData()
        formData.append('points', JSON.stringify(culturePoints))

        try {
            const res = await updateCulturePoints(formData)
            setCulturePoints(res.points.length > 0 ? res.points : [{ title: '', description: '' }])
            setCultureSaved(true)
        } catch (err) {
            setCultureError(err.message || 'Gagal menyimpan budaya kerja.')
        } finally {
            setSavingCulture(false)
        }
    }

    async function handleGalleryUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return

        setGalleryError('')
        setGalleryUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await uploadGalleryImage(formData)
            setGallery(res.gallery)
        } catch (err) {
            setGalleryError(err.message || 'Gagal mengunggah foto.')
        } finally {
            setGalleryUploading(false)
            if (galleryInputRef.current) galleryInputRef.current.value = ''
        }
    }

    async function handleGalleryRemove(url) {
        setGalleryError('')
        try {
            const res = await removeGalleryImage(url)
            setGallery(res.gallery)
        } catch (err) {
            setGalleryError(err.message || 'Gagal menghapus foto.')
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Kolom Kiri */}
            <div className="flex-1 space-y-6 min-w-0 w-full">
                {error && (
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-md text-sm font-medium border border-rose-200">
                        {error}
                    </div>
                )}

                {/* Banner Upload */}
                <Card className="p-6 rounded-md space-y-4">
                    <div className="space-y-0.5">
                        <h2 className="text-base font-bold text-slate-900">Banner Halaman Karir</h2>
                        <p className="text-xs text-slate-400 font-medium">Gambar sampul yang tampil di bagian atas halaman karir publik. Rekomendasi 1600×500px, maks 5MB.</p>
                    </div>

                    <div className="relative w-full aspect-[16/5] rounded-md overflow-hidden border border-slate-200 bg-slate-50">
                        {bannerUrl ? (
                            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                <ImagePlus className="w-8 h-8 mb-2" />
                                <p className="text-xs font-medium">Belum ada banner</p>
                            </div>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        )}
                    </div>

                    <div className="relative inline-block">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleBannerChange}
                            disabled={uploading}
                        />
                        <Button type="button" variant="outline" className="h-9 rounded-md font-semibold gap-2 text-xs" disabled={uploading}>
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                            {bannerUrl ? 'Ganti Banner' : 'Unggah Banner'}
                        </Button>
                    </div>
                </Card>

                {/* Profil Karir */}
                <Card className="p-6 rounded-md space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-0.5">
                        <h2 className="text-base font-bold text-slate-900">Profil Perusahaan</h2>
                        <p className="text-xs text-slate-400 font-medium">Tagline dan deskripsi yang tampil kepada kandidat.</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Tagline</Label>
                        <Input
                            name="tagline"
                            defaultValue={company.tagline || ''}
                            placeholder="mis. Membangun teknologi untuk masa depan yang lebih baik"
                            className="h-10 rounded-md"
                            maxLength={120}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Tentang Perusahaan</Label>
                        <Textarea
                            name="description"
                            defaultValue={company.description || ''}
                            placeholder="Ceritakan tentang budaya kerja, visi misi, dan apa yang membuat perusahaan Anda menarik bagi kandidat..."
                            className="min-h-[160px] rounded-md text-sm leading-relaxed"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <Button type="submit" disabled={saving} className="h-10 rounded-md font-semibold px-6">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                        {saved && <span className="text-xs font-medium text-emerald-600">Tersimpan.</span>}
                    </div>
                </form>
                </Card>

                {/* Budaya Kerja */}
                <Card className="p-6 rounded-md space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-primary" /> Budaya Kerja
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">Poin-poin yang membuat kandidat tertarik bergabung. Maks {MAX_CULTURE_POINTS} poin.</p>
                        </div>
                    </div>

                    {cultureError && (
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-md text-sm font-medium border border-rose-200">
                            {cultureError}
                        </div>
                    )}

                    <div className="space-y-3">
                        {culturePoints.map((point, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
                                <div className="flex-1 space-y-2">
                                    <Input
                                        value={point.title}
                                        onChange={e => updateCulturePoint(i, 'title', e.target.value)}
                                        placeholder="Judul, mis. Pertumbuhan Karir"
                                        className="h-9 rounded-md bg-white text-sm font-semibold"
                                        maxLength={60}
                                    />
                                    <Textarea
                                        value={point.description}
                                        onChange={e => updateCulturePoint(i, 'description', e.target.value)}
                                        placeholder="Deskripsi singkat 1-2 kalimat"
                                        className="min-h-[60px] rounded-md bg-white text-xs"
                                        maxLength={200}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    onClick={() => removeCulturePoint(i)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {culturePoints.length < MAX_CULTURE_POINTS && (
                        <Button type="button" variant="outline" className="h-9 rounded-md font-semibold gap-2 text-xs" onClick={addCulturePoint}>
                            <Plus className="w-4 h-4" /> Tambah Poin
                        </Button>
                    )}

                    <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                        <Button type="button" disabled={savingCulture} className="h-10 rounded-md font-semibold px-6 mt-4" onClick={handleSaveCulture}>
                            {savingCulture ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {savingCulture ? 'Menyimpan...' : 'Simpan Budaya Kerja'}
                        </Button>
                        {cultureSaved && <span className="text-xs font-medium text-emerald-600 mt-4">Tersimpan.</span>}
                    </div>
                </Card>

                {/* Galeri Foto */}
                <Card className="p-6 rounded-md space-y-4">
                    <div className="space-y-0.5">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                            <GalleryHorizontal className="w-4 h-4 text-primary" /> Galeri Foto
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">Foto kantor, kegiatan tim, atau suasana kerja. Maks {MAX_GALLERY_IMAGES} foto, masing-masing 5MB.</p>
                    </div>

                    {galleryError && (
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-md text-sm font-medium border border-rose-200">
                            {galleryError}
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {gallery.map((url) => (
                            <div key={url} className="relative aspect-square rounded-md overflow-hidden border border-slate-200 group">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => handleGalleryRemove(url)}
                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        {gallery.length < MAX_GALLERY_IMAGES && (
                            <div className="relative aspect-square rounded-md border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                                <input
                                    ref={galleryInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleGalleryUpload}
                                    disabled={galleryUploading}
                                />
                                {galleryUploading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                ) : (
                                    <>
                                        <ImagePlus className="w-5 h-5 mb-1" />
                                        <p className="text-[10px] font-medium">Tambah Foto</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Kolom Kanan — Info & Link */}
            <div className="w-full lg:w-72 space-y-4">
                <Card className="p-5 rounded-md space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {company.logo_url ? (
                                <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-5 h-5 text-slate-300" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{company.name}</p>
                            <p className="text-xs text-slate-400 font-medium truncate">/{company.slug}</p>
                        </div>
                    </div>
                    <Link href={`/${company.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full h-9 rounded-md font-semibold gap-2 text-xs">
                            <ExternalLink className="w-3.5 h-3.5" /> Lihat Halaman Publik
                        </Button>
                    </Link>
                </Card>

                <Card className="p-5 rounded-md bg-blue-50 border-blue-200 space-y-2">
                    <p className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" /> Tips
                    </p>
                    <p className="text-xs text-blue-700/80 font-medium leading-relaxed">
                        Nama, logo, dan info industri diatur oleh Super Admin. Hubungi platform jika perlu perubahan.
                    </p>
                </Card>
            </div>
        </div>
    )
}
