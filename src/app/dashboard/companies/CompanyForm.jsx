'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCompany, updateCompany } from '@/lib/actions/companies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Crown, Zap, Gift, ShieldCheck, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export function CompanyForm({ initialData = null }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const isEditing = !!initialData

    // State for Subscription Plan & Quota Management
    const [plan, setPlan] = useState(initialData?.subscription_plan || 'Pilot Promo')
    const [status, setStatus] = useState(initialData?.subscription_status || 'active')
    const [jobQuota, setJobQuota] = useState(initialData?.job_slots_quota ?? 15)
    const [assessmentQuota, setAssessmentQuota] = useState(initialData?.assessment_slots_quota ?? 15)
    const [employeeQuota, setEmployeeQuota] = useState(initialData?.employee_quota ?? 50)
    const [waSupport, setWaSupport] = useState(initialData?.whatsapp_support_enabled ?? true)
    const [dedicatedManager, setDedicatedManager] = useState(initialData?.dedicated_account_manager ?? false)
    const [expiresAt, setExpiresAt] = useState(
        initialData?.subscription_expires_at 
            ? new Date(initialData.subscription_expires_at).toISOString().split('T')[0]
            : ''
    )

    // Preset Package Handlers
    function applyPreset(presetName) {
        if (presetName === 'Pilot Promo') {
            setPlan('Pilot Promo')
            setJobQuota(15)
            setAssessmentQuota(15)
            setEmployeeQuota(50)
            setWaSupport(true)
            setDedicatedManager(false)
        } else if (presetName === 'Arvela Max') {
            setPlan('Arvela Max')
            setJobQuota(30)
            setAssessmentQuota(30)
            setEmployeeQuota(150)
            setWaSupport(true)
            setDedicatedManager(true)
        } else if (presetName === 'Starter Free') {
            setPlan('Starter Free')
            setJobQuota(3)
            setAssessmentQuota(3)
            setEmployeeQuota(15)
            setWaSupport(false)
            setDedicatedManager(false)
        } else if (presetName === 'Enterprise') {
            setPlan('Enterprise')
            setJobQuota(999)
            setAssessmentQuota(999)
            setEmployeeQuota(999)
            setWaSupport(true)
            setDedicatedManager(true)
        }
    }

    async function onSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        formData.set('subscription_plan', plan)
        formData.set('subscription_status', status)
        formData.set('job_slots_quota', jobQuota.toString())
        formData.set('assessment_slots_quota', assessmentQuota.toString())
        formData.set('employee_quota', employeeQuota.toString())
        formData.set('whatsapp_support_enabled', waSupport.toString())
        formData.set('dedicated_account_manager', dedicatedManager.toString())
        formData.set('subscription_expires_at', expiresAt)

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
        <form onSubmit={onSubmit} className="max-w-4xl space-y-8">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/companies" className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">{isEditing ? 'Edit Perusahaan & Paket Langganan' : 'Tambah Perusahaan Baru'}</h1>
                    <p className="text-slate-500 text-sm">Atur informasi perusahaan, kuota fitur, dan status lisensi berlangganan Super Admin.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-100">
                    {error}
                </div>
            )}

            {/* 1. Basic Company Profiling */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
                <h2 className="text-base font-black text-slate-900 border-b pb-3">Profil Perusahaan</h2>
                
                <div className="space-y-2">
                    <Label>Nama Perusahaan <span className="text-rose-500">*</span></Label>
                    <Input name="name" required defaultValue={initialData?.name} placeholder="Contoh: PT Arvela Teknologi Indonesia" className="font-bold text-base" />
                </div>

                <div className="space-y-2">
                    <Label>Slug URL Karir Portal</Label>
                    <Input name="slug" defaultValue={initialData?.slug} placeholder="Dikosongkan untuk otomatisasi (contoh: pt-arvela-teknologi)" className="font-mono text-slate-600 bg-slate-50" />
                    <p className="text-xs text-slate-400">Gunakan huruf kecil dan tanda strip (-). Link karir: arvela.id/[slug]</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Industri</Label>
                        <Input name="industry" defaultValue={initialData?.industry} placeholder="Contoh: Teknologi, Retail, F&B" />
                    </div>

                    <div className="space-y-2">
                        <Label>Ukuran Perusahaan (Estimasi Staff)</Label>
                        <Input name="size" defaultValue={initialData?.size} placeholder="Contoh: 1-50, 51-200, 201-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Website Resmi</Label>
                        <Input name="website" type="url" defaultValue={initialData?.website} placeholder="https://perusahaan.com" />
                    </div>

                    <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input name="logo_url" type="url" defaultValue={initialData?.logo_url} placeholder="https://image.com/logo.png" />
                    </div>
                </div>
            </div>

            {/* 2. Super Admin Subscription & Quota Management */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 text-white space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                        <h2 className="text-lg font-black flex items-center gap-2 text-white">
                            <Crown className="w-5 h-5 text-amber-400" />
                            Kelola Paket Berlangganan & Kuota Fitur (Super Admin)
                        </h2>
                        <p className="text-slate-400 text-xs mt-0.5">Konfigurasi batas slot aktif, modul asesmen, dan prioritas dukungan perusahaan ini.</p>
                    </div>
                    <span className="bg-amber-400/20 text-amber-300 text-xs font-black px-3 py-1 rounded-full border border-amber-400/30 uppercase tracking-wider">
                        {plan}
                    </span>
                </div>

                {/* Preset Bundles Selector */}
                <div className="space-y-3">
                    <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Pilih Preset Promo / Paket Arvela:</Label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <button
                            type="button"
                            onClick={() => applyPreset('Pilot Promo')}
                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                                plan === 'Pilot Promo'
                                    ? 'bg-primary/20 border-primary text-white ring-2 ring-primary/50'
                                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                                    <Gift className="w-3.5 h-3.5" /> Promo Pilot
                                </span>
                                {plan === 'Pilot Promo' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                            <p className="text-lg font-black text-white mt-1">Rp 249K <span className="text-[10px] font-normal text-slate-400">/bln</span></p>
                            <p className="text-[11px] text-slate-400 mt-2 font-medium">15 Slot Loker & Asesmen + Support WA</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => applyPreset('Arvela Max')}
                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                                plan === 'Arvela Max'
                                    ? 'bg-emerald-500/20 border-emerald-400 text-white ring-2 ring-emerald-400/50'
                                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5" /> Arvela Max
                                </span>
                                {plan === 'Arvela Max' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <p className="text-lg font-black text-white mt-1">Rp 420K <span className="text-[10px] font-normal text-slate-400">/bln</span></p>
                            <p className="text-[11px] text-slate-400 mt-2 font-medium">30 Slot + Dedicated Account Manager</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => applyPreset('Starter Free')}
                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                                plan === 'Starter Free'
                                    ? 'bg-blue-500/20 border-blue-400 text-white ring-2 ring-blue-400/50'
                                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-blue-400">Starter Free</span>
                                {plan === 'Starter Free' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                            </div>
                            <p className="text-lg font-black text-white mt-1">Rp 0 <span className="text-[10px] font-normal text-slate-400">Gratis</span></p>
                            <p className="text-[11px] text-slate-400 mt-2 font-medium">3 Slot Loker & Asesmen Dasar</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => applyPreset('Enterprise')}
                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                                plan === 'Enterprise'
                                    ? 'bg-purple-500/20 border-purple-400 text-white ring-2 ring-purple-400/50'
                                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-purple-400 flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Enterprise
                                </span>
                                {plan === 'Enterprise' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                            </div>
                            <p className="text-lg font-black text-white mt-1">Custom <span className="text-[10px] font-normal text-slate-400">Masif</span></p>
                            <p className="text-[11px] text-slate-400 mt-2 font-medium">Quota Unlimited & Dedicated Manager</p>
                        </button>
                    </div>
                </div>

                {/* Granular Quota Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="space-y-2">
                        <Label className="text-slate-300 text-xs font-bold">Kuota Slot Loker Aktif</Label>
                        <Input
                            type="number"
                            value={jobQuota}
                            onChange={e => setJobQuota(parseInt(e.target.value) || 0)}
                            className="bg-slate-800 border-slate-700 text-white font-bold text-base"
                            placeholder="15"
                        />
                        <p className="text-[10px] text-slate-400">Isi 999 untuk kuota tanpa batas.</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300 text-xs font-bold">Kuota Modul Asesmen Aktif</Label>
                        <Input
                            type="number"
                            value={assessmentQuota}
                            onChange={e => setAssessmentQuota(parseInt(e.target.value) || 0)}
                            className="bg-slate-800 border-slate-700 text-white font-bold text-base"
                            placeholder="15"
                        />
                        <p className="text-[10px] text-slate-400">Jumlah modul ujian aktif bersamaan.</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300 text-xs font-bold">Kuota Maksimal Karyawan</Label>
                        <Input
                            type="number"
                            value={employeeQuota}
                            onChange={e => setEmployeeQuota(parseInt(e.target.value) || 0)}
                            className="bg-slate-800 border-slate-700 text-white font-bold text-base"
                            placeholder="50"
                        />
                        <p className="text-[10px] text-slate-400">Batas maksimal staff terdaftar.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-slate-300 text-xs font-bold">Status Lisensi Berlangganan</Label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full h-11 rounded-xl bg-slate-800 border border-slate-700 px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="active">🟢 Active (Aktif Berlangganan)</option>
                            <option value="trial">🟡 Trial (Masa Percobaan)</option>
                            <option value="expired">🔴 Expired (Masa Berlangganan Habis)</option>
                            <option value="canceled">⚪ Canceled (Dibatalkan)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300 text-xs font-bold">Tanggal Masa Berlaku Paket (Expired Date)</Label>
                        <Input
                            type="date"
                            value={expiresAt}
                            onChange={e => setExpiresAt(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white font-bold"
                        />
                    </div>
                </div>

                {/* Features Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                        <div>
                            <p className="text-xs font-bold text-white">Prioritas Support via WhatsApp</p>
                            <p className="text-[10px] text-slate-400">Jalur respon cepat tim helpdesk Arvela.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={waSupport}
                            onChange={e => setWaSupport(e.target.checked)}
                            className="w-5 h-5 accent-primary rounded cursor-pointer"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                        <div>
                            <p className="text-xs font-bold text-white">Dedicated Account Manager</p>
                            <p className="text-[10px] text-slate-400">Dukungan khusus konsultan HR Arvela.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={dedicatedManager}
                            onChange={e => setDedicatedManager(e.target.checked)}
                            className="w-5 h-5 accent-emerald-400 rounded cursor-pointer"
                        />
                    </label>
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full py-6 text-sm font-black shadow-xl rounded-xl group relative overflow-hidden transition-all hover:scale-[1.01]">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? 'Simpan Perubahan Perusahaan & Kuota' : 'Tambahkan Perusahaan & Aktifkan Paket')}
            </Button>
        </form>
    )
}
