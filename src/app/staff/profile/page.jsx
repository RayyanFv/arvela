'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Building2, Briefcase, Calendar, Shield, Camera, Loader2, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function StaffProfilePage() {
    const [profile, setProfile] = useState(null)
    const [employee, setEmployee] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const supabase = createClient()

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: emp } = await supabase
                .from('employees')
                .select('*, profiles!employees_profile_id_fkey(*)')
                .eq('profile_id', user.id)
                .single()

            if (emp) {
                setEmployee(emp)
                setProfile(emp.profiles)
            }
            setLoading(false)
        }
        loadProfile()
    }, [])

    async function handleUpdateProfile(e) {
        e.preventDefault()
        setSaving(true)
        setMessage('')

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: profile.full_name,
                // you can add more fields here if your schema allows
            })
            .eq('id', profile.id)

        if (error) {
            alert(error.message)
        } else {
            setMessage('Profil berhasil diperbarui!')
            setTimeout(() => setMessage(''), 3000)
        }
        setSaving(false)
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    )

    if (!employee) return <div>Profil tidak ditemukan.</div>

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative h-48 rounded-[40px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-32 translate-x-32 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/20 rounded-full translate-y-24 -translate-x-24 blur-3xl opacity-50" />

                <div className="absolute -bottom-12 left-10 flex items-end gap-6">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[32px] bg-white p-1.5 shadow-2xl">
                            <div className="w-full h-full rounded-[28px] bg-slate-100 overflow-hidden relative">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-primary italic">
                                        {profile.full_name?.charAt(0)}
                                    </div>
                                )}
                                <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Camera className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mb-14">
                        <h1 className="text-3xl font-black text-white tracking-tight">{profile.full_name}</h1>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{employee.job_title} • {employee.department}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                {/* Left Column: Info Cards */}
                <div className="space-y-6">
                    <Card className="rounded-[32px] p-6 border-none shadow-xl bg-white space-y-6">
                        <h3 className="text-sm font-black text-slate-900 border-b border-slate-50 pb-4">Status & Keamanan</h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Role Akun</p>
                                    <p className="text-xs font-bold text-slate-700 capitalize">{profile.role}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Tanggal Bergabung</p>
                                    <p className="text-xs font-bold text-slate-700">{new Date(employee.joined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[32px] p-6 border-none shadow-xl bg-slate-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                        <h3 className="text-sm font-black border-b border-white/5 pb-4 mb-4">Ringkasan Karir</h3>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            "Berdedikasi untuk memberikan kontribusi terbaik bagi pertumbuhan perusahaan melalui inovasi dan kerja keras."
                        </p>
                    </Card>
                </div>

                {/* Right Column: Profile Settings */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-[32px] p-8 border-none shadow-xl bg-white">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-slate-900">Pengaturan Profil</h2>
                            {message && (
                                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold animate-in fade-in slide-in-from-right-2">
                                    <CheckCircle2 className="w-4 h-4" /> {message}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase ml-1">Nama Lengkap</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            value={profile.full_name}
                                            onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                            className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase ml-1">Email (Read Only)</Label>
                                    <div className="relative opacity-60">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            readOnly
                                            value={profile.email}
                                            className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase ml-1">Divisi</Label>
                                    <div className="relative opacity-60">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            readOnly
                                            value={employee.department}
                                            className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase ml-1">Jabatan</Label>
                                    <div className="relative opacity-60">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            readOnly
                                            value={employee.job_title}
                                            className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Simpan Perubahan
                                </Button>
                            </div>
                        </form>
                    </Card>

                    <div className="p-8 rounded-[32px] bg-red-50 border border-red-100 space-y-4">
                        <h4 className="text-xs font-black text-red-600 uppercase tracking-widest">Zona Bahaya</h4>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-red-400">Hubungi Administrator jika Anda ingin menonaktifkan akun atau melakukan perubahan data kepegawaian fundamental.</p>
                            <Button variant="ghost" className="text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-xl text-xs">Bantuan</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
