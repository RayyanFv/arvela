'use client'

import { createContext, useContext, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { getMagicLink } from '@/lib/actions/applications'
import { enrollInCourse, assignOnboardingTemplate } from '@/lib/actions/hcm'
import { Target, Plus, Loader2, Sparkles, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OKRTable } from '@/components/staff/OKRTable'
import { OnboardingList } from '@/components/staff/OnboardingList'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ToastBanner } from '@/components/ui/ToastBanner'

const ToastCtx = createContext(() => {})

/** Wraps the whole detail page: renders the toast banner, exposes showToast to descendants. */
export function EmployeeToastProvider({ children }) {
    const { toast, showToast } = useToast()
    return (
        <ToastCtx.Provider value={showToast}>
            <ToastBanner toast={toast} />
            {children}
        </ToastCtx.Provider>
    )
}

function useEmployeeToast() {
    return useContext(ToastCtx)
}

export function CopyAccountLinkButton({ email }) {
    const showToast = useEmployeeToast()
    const [loading, setLoading] = useState(false)
    return (
        <Button
            variant="outline"
            disabled={loading}
            className="w-full rounded-md h-11 border-slate-200 font-semibold text-slate-600 hover:text-primary hover:border-primary/30"
            onClick={async () => {
                setLoading(true)
                try {
                    const link = await getMagicLink({
                        email,
                        type: 'recovery',
                        redirectTo: `${window.location.origin}/reset-password`
                    })
                    if (link) {
                        navigator.clipboard.writeText(link)
                        showToast('Link Aktivasi Akun disalin! Kirim via WhatsApp.')
                    }
                } catch (err) {
                    showToast('Gagal membuat link: ' + err.message, 'error')
                }
                setLoading(false)
            }}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salin Link Akun'}
        </Button>
    )
}

export function CopyEmailButton({ email }) {
    const showToast = useEmployeeToast()
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(email)
                showToast('Email disalin!')
            }}
            aria-label="Salin email"
            className="text-primary hover:text-brand-600"
        >
            <Copy className="w-3 h-3" />
        </button>
    )
}

export function OKRSection({ okrs, employeeId, companyId }) {
    const router = useRouter()
    const showToast = useEmployeeToast()
    const supabase = createClient()
    const [showAddOKR, setShowAddOKR] = useState(false)
    const [loading, setLoading] = useState(false)
    const [newOKR, setNewOKR] = useState({ title: '', period: 'Q1 2026', description: '' })
    const [newKRs, setNewKRs] = useState([{ title: '', target_value: '', unit: '' }])

    async function handleAddOKR() {
        if (!newOKR.title) return
        setLoading(true)
        const { data: okrData, error } = await supabase.from('okrs').insert({
            employee_id: employeeId,
            company_id: companyId,
            title: newOKR.title,
            period: newOKR.period,
            description: newOKR.description
        }).select().single()
        if (!error && okrData) {
            const validKRs = newKRs.filter(k => k.title && k.target_value)
            if (validKRs.length > 0) {
                await supabase.from('key_results').insert(
                    validKRs.map(k => ({
                        okr_id: okrData.id,
                        title: k.title,
                        target_value: Number(k.target_value),
                        unit: k.unit || '',
                        current_value: 0
                    }))
                )
            }
            setShowAddOKR(false)
            setNewOKR({ title: '', period: 'Q1 2026', description: '' })
            setNewKRs([{ title: '', target_value: '', unit: '' }])
            showToast('OKR baru berhasil ditambahkan!')
            router.refresh()
        } else if (error) {
            showToast('Gagal menyimpan OKR: ' + error.message, 'error')
        }
        setLoading(false)
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                    <Target className="w-5 h-5 text-primary" /> Target & OKR
                </h3>
                <Button
                    onClick={() => setShowAddOKR(true)}
                    className="bg-primary text-white font-semibold rounded-md gap-2"
                >
                    <Plus className="w-4 h-4" /> Tambah OKR
                </Button>
            </div>

            <div className="space-y-6">
                {showAddOKR && (
                    <Card className="rounded-md border border-primary/20 p-5 bg-white">
                        <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" /> OKR Baru
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <div className="md:col-span-2 space-y-1">
                                <Label className="text-[10px] font-semibold text-slate-400 uppercase">Judul Objective</Label>
                                <Input placeholder="Meningkatkan Revenue 2x Lipat" className="h-9 rounded-md text-sm" value={newOKR.title} onChange={e => setNewOKR({ ...newOKR, title: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-semibold text-slate-400 uppercase">Periode</Label>
                                <Input placeholder="Q1 2026" className="h-9 rounded-md text-sm" value={newOKR.period} onChange={e => setNewOKR({ ...newOKR, period: e.target.value })} />
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-md overflow-hidden mb-4">
                            <div className="bg-slate-50 px-3 py-2 grid grid-cols-[1fr_100px_70px_32px] gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                <span>Key Result</span>
                                <span className="text-center">Target</span>
                                <span className="text-center">Satuan</span>
                                <span />
                            </div>
                            {newKRs.map((kr, i) => (
                                <div key={i} className="px-3 py-2 grid grid-cols-[1fr_100px_70px_32px] gap-2 border-t border-slate-100 items-center">
                                    <Input
                                        placeholder={`KR-${i + 1}: Contoh: Capai 100 pelanggan`}
                                        className="h-8 rounded-md text-xs border-slate-200"
                                        value={kr.title}
                                        onChange={e => { const list = [...newKRs]; list[i].title = e.target.value; setNewKRs(list) }}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="100"
                                        className="h-8 rounded-md text-xs border-slate-200 text-center"
                                        value={kr.target_value}
                                        onChange={e => { const list = [...newKRs]; list[i].target_value = e.target.value; setNewKRs(list) }}
                                    />
                                    <Input
                                        placeholder="%"
                                        className="h-8 rounded-md text-xs border-slate-200 text-center"
                                        value={kr.unit}
                                        onChange={e => { const list = [...newKRs]; list[i].unit = e.target.value; setNewKRs(list) }}
                                    />
                                    <button
                                        onClick={() => setNewKRs(newKRs.filter((_, j) => j !== i))}
                                        aria-label="Hapus key result"
                                        className="w-7 h-7 rounded-md bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center text-xs font-semibold transition-colors"
                                    >×</button>
                                </div>
                            ))}
                            <button
                                onClick={() => setNewKRs([...newKRs, { title: '', target_value: '', unit: '' }])}
                                className="w-full py-2 text-[11px] font-medium text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 border-t border-slate-100"
                            >
                                <Plus className="w-3 h-3" /> Tambah KR
                            </button>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setShowAddOKR(false); setNewKRs([{ title: '', target_value: '', unit: '' }]) }} className="rounded-md font-semibold text-slate-500">Batal</Button>
                            <Button size="sm" onClick={handleAddOKR} disabled={loading || !newOKR.title} className="rounded-md font-semibold bg-primary text-white gap-1.5">
                                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                Simpan OKR & KR
                            </Button>
                        </div>
                    </Card>
                )}

                <OKRTable okrs={okrs} onUpdate={() => router.refresh()} />
            </div>
        </>
    )
}

export function AssignTemplateForm({ employeeId, companyId, availableTemplates }) {
    const router = useRouter()
    const showToast = useEmployeeToast()
    const [assigningTemplateId, setAssigningTemplateId] = useState('')
    const [isPending, startTransition] = useTransition()

    return (
        <div className="p-4 bg-slate-50 rounded-md space-y-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Assign Template Onboarding</p>
            {availableTemplates.length === 0 ? (
                <p className="text-xs font-medium text-slate-400">Belum ada template onboarding di perusahaan ini.</p>
            ) : (
                <div className="flex gap-2">
                    <select
                        className="flex-1 h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        value={assigningTemplateId}
                        onChange={e => setAssigningTemplateId(e.target.value)}
                    >
                        <option value="">Pilih Template...</option>
                        {availableTemplates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    <Button
                        disabled={!assigningTemplateId || isPending}
                        onClick={() => {
                            startTransition(async () => {
                                try {
                                    await assignOnboardingTemplate({ employeeId, templateId: assigningTemplateId, companyId })
                                    setAssigningTemplateId('')
                                    showToast('Template onboarding berhasil di-assign!')
                                    router.refresh()
                                } catch (err) {
                                    showToast(err.message, 'error')
                                }
                            })
                        }}
                        className="bg-emerald-600 text-white font-semibold rounded-md h-10 px-4 hover:bg-emerald-700"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                    </Button>
                </div>
            )}
        </div>
    )
}

export function AssignCourseForm({ employeeId, companyId, availableCourses }) {
    const router = useRouter()
    const showToast = useEmployeeToast()
    const [assigningCourseId, setAssigningCourseId] = useState('')
    const [isPending, startTransition] = useTransition()

    return (
        <div className="p-4 bg-slate-50 rounded-md space-y-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Assign Kursus Baru</p>
            {availableCourses.length === 0 ? (
                <p className="text-xs font-medium text-slate-400">Belum ada kursus published di perusahaan ini.</p>
            ) : (
                <div className="flex gap-2">
                    <select
                        className="flex-1 h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        value={assigningCourseId}
                        onChange={e => setAssigningCourseId(e.target.value)}
                    >
                        <option value="">Pilih Kursus...</option>
                        {availableCourses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                    <Button
                        disabled={!assigningCourseId || isPending}
                        onClick={() => {
                            startTransition(async () => {
                                try {
                                    await enrollInCourse({ employeeId, courseId: assigningCourseId, companyId })
                                    setAssigningCourseId('')
                                    showToast('Kursus berhasil di-assign!')
                                    router.refresh()
                                } catch (err) {
                                    showToast(err.message, 'error')
                                }
                            })
                        }}
                        className="bg-primary text-white font-semibold rounded-md h-10 px-4"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                    </Button>
                </div>
            )}
        </div>
    )
}

export function OnboardingChecklist({ tasks }) {
    return <OnboardingList tasks={tasks} />
}

const TAB_KEYS = ['okr', 'onboarding', 'courses']
const TAB_LABELS = { okr: 'Target & OKR', onboarding: 'Onboarding', courses: 'Kursus & Pelatihan' }

/** Active tab lives in the URL (?tab=) so a refresh or shared link keeps the same view. */
export function EmployeeTabs({ okrPanel, onboardingPanel, coursesPanel }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const activeTab = TAB_KEYS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'okr'
    const panels = { okr: okrPanel, onboarding: onboardingPanel, courses: coursesPanel }

    function setTab(key) {
        const params = new URLSearchParams(searchParams)
        params.set('tab', key)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    return (
        <Tabs value={activeTab} onValueChange={setTab}>
            <TabsList variant="line" className="mb-6 border-b border-slate-200 w-full justify-start rounded-none h-auto p-0">
                {TAB_KEYS.map(key => (
                    <TabsTrigger
                        key={key}
                        value={key}
                        className="px-4 py-2.5 text-sm font-semibold rounded-none data-active:text-primary data-active:after:opacity-100"
                    >
                        {TAB_LABELS[key]}
                    </TabsTrigger>
                ))}
            </TabsList>
            <TabsContent value="okr">{panels.okr}</TabsContent>
            <TabsContent value="onboarding">{panels.onboarding}</TabsContent>
            <TabsContent value="courses">{panels.courses}</TabsContent>
        </Tabs>
    )
}
