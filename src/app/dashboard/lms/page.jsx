'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    GraduationCap, Plus, Search, MonitorPlay, Users, BookOpen,
    BarChart3, X, Save, Loader2, Link2, FileText, Video,
    Trash2, ChevronDown, ChevronUp, Eye, EyeOff, ArrowRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getYouTubeId(url) {
    if (!url) return null
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
}
function getYouTubeThumbnail(url) {
    const id = getYouTubeId(url)
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

const CONTENT_TYPES = [
    { value: 'video', label: 'Video URL', icon: Video, placeholder: 'https://youtube.com/watch?v=...' },
    { value: 'pdf', label: 'PDF URL', icon: FileText, placeholder: 'https://example.com/materi.pdf' },
    { value: 'text', label: 'Teks', icon: BookOpen, placeholder: '' },
]
const LEVELS = ['all', 'beginner', 'intermediate', 'advanced']
const CATEGORIES = ['Onboarding', 'Technical', 'Leadership', 'Compliance', 'Soft Skills', 'Product', 'Sales']

// ─── Section + Content Editor ─────────────────────────────────────────────────
function SectionEditor({ section, onDelete, onUpdate, courseId }) {
    const supabase = createClient()
    const [open, setOpen] = useState(true)
    const [contents, setContents] = useState(section.lms_course_contents || [])
    const [adding, setAdding] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [newContent, setNewContent] = useState({ title: '', content_type: 'video', content_url: '', content_body: '', duration_mins: '' })

    async function addContent() {
        if (!newContent.title) return
        setSaving(true)
        setSaveError('')
        // Map content_type → legacy 'type' column. Old CHECK: ('video','text','quiz')
        // After migration patch: ('video','text','quiz','pdf') — but map pdf→'text' as safetynet
        const legacyType = newContent.content_type === 'pdf' ? 'text' : newContent.content_type
        const { data, error } = await supabase.from('lms_course_contents').insert({
            section_id: section.id,
            title: newContent.title,
            type: legacyType,
            body: newContent.content_url || newContent.content_body || null,
            content_type: newContent.content_type,
            content_url: newContent.content_url || null,
            content_body: newContent.content_body || null,
            duration_mins: newContent.duration_mins ? Number(newContent.duration_mins) : null,
            order_index: contents.length
        }).select().single()
        if (error) {
            setSaveError(error.message)
        } else if (data) {
            setContents([...contents, data])
            setAdding(false)
            setNewContent({ title: '', content_type: 'video', content_url: '', content_body: '', duration_mins: '' })
        }
        setSaving(false)
    }
    async function deleteContent(id) {
        await supabase.from('lms_course_contents').delete().eq('id', id)
        setContents(contents.filter(c => c.id !== id))
    }

    const selectedType = CONTENT_TYPES.find(t => t.value === newContent.content_type)

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setOpen(o => !o)}>
                <div className="flex-1">
                    <span className="text-sm font-bold text-slate-700">{section.title}</span>
                    <span className="ml-2 text-[10px] text-slate-400 font-medium">{contents.length} konten</span>
                </div>
                <button onClick={e => { e.stopPropagation(); onDelete(section.id) }} className="w-6 h-6 text-slate-300 hover:text-red-400 transition-colors flex items-center justify-center rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {open && (
                <div className="divide-y divide-slate-100">
                    {contents.map((c, i) => (
                        <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 group">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                {c.content_type === 'video' ? <Video className="w-3 h-3 text-blue-400" /> :
                                    c.content_type === 'pdf' ? <FileText className="w-3 h-3 text-red-400" /> :
                                        <BookOpen className="w-3 h-3 text-emerald-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-700 truncate">{c.title}</p>
                                {c.content_url && <p className="text-[10px] text-slate-400 truncate">{c.content_url}</p>}
                                {c.duration_mins && <span className="text-[10px] text-slate-300">{c.duration_mins} menit</span>}
                            </div>
                            <button onClick={() => deleteContent(c.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 text-slate-300 hover:text-red-400 transition-all flex items-center justify-center">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    {/* Add Content Form */}
                    {adding ? (
                        <div className="p-4 bg-blue-50/30 space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                    <Input value={newContent.title} onChange={e => setNewContent({ ...newContent, title: e.target.value })}
                                        placeholder="Judul konten" className="h-8 text-xs" />
                                </div>
                                <select value={newContent.content_type} onChange={e => setNewContent({ ...newContent, content_type: e.target.value })}
                                    className="h-8 text-xs border border-slate-200 rounded-md px-2 bg-white">
                                    {CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            {newContent.content_type !== 'text' && (
                                <Input value={newContent.content_url} onChange={e => setNewContent({ ...newContent, content_url: e.target.value })}
                                    placeholder={selectedType?.placeholder} className="h-8 text-xs" />
                            )}
                            {newContent.content_type === 'text' && (
                                <textarea value={newContent.content_body} onChange={e => setNewContent({ ...newContent, content_body: e.target.value })}
                                    placeholder="Isi teks materi..." rows={3}
                                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white resize-none outline-none" />
                            )}
                            {newContent.content_type === 'video' && (
                                <Input type="number" value={newContent.duration_mins} onChange={e => setNewContent({ ...newContent, duration_mins: e.target.value })}
                                    placeholder="Durasi (menit, opsional)" className="h-8 text-xs w-48" />
                            )}
                            <div className="flex gap-2 items-center flex-wrap">
                                <Button size="sm" onClick={addContent} disabled={saving} className="h-7 text-xs font-bold">
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Simpan'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setSaveError('') }} className="h-7 text-xs text-slate-400">Batal</Button>
                                {saveError && <p className="text-[10px] text-red-500 font-bold flex-1 min-w-full">{saveError}</p>}
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setAdding(true)} className="w-full py-2.5 text-[11px] font-bold text-slate-300 hover:text-primary hover:bg-slate-50 flex items-center justify-center gap-1 transition-colors">
                            <Plus className="w-3 h-3" /> Tambah Konten
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Course Create/Edit Modal ─────────────────────────────────────────────────
function CourseModal({ course, companyId, onClose, onSaved }) {
    const supabase = createClient()
    const [form, setForm] = useState({
        title: course?.title ?? '',
        description: course?.description ?? '',
        category: course?.category ?? '',
        level: course?.level ?? 'all',
        thumbnail_url: course?.thumbnail_url ?? '',
        status: course?.status ?? 'draft',
        has_certificate: course?.has_certificate ?? true
    })
    const [sections, setSections] = useState([])
    const [saving, setSaving] = useState(false)
    const [courseId, setCourseId] = useState(course?.id ?? null)
    const [addingSection, setAddingSection] = useState(false)
    const [newSectionTitle, setNewSectionTitle] = useState('')

    useEffect(() => {
        if (courseId) fetchSections()
    }, [courseId])

    async function fetchSections() {
        const { data } = await supabase.from('lms_course_sections')
            .select('*, lms_course_contents(*)')
            .eq('course_id', courseId)
            .order('order_index')
        setSections(data || [])
    }

    async function saveCourse() {
        setSaving(true)
        if (!courseId) {
            const { data } = await supabase.from('lms_courses').insert({ ...form, company_id: companyId }).select().single()
            if (data) setCourseId(data.id)
        } else {
            await supabase.from('lms_courses').update({ ...form, updated_at: new Date().toISOString() }).eq('id', courseId)
        }
        setSaving(false)
        onSaved()
    }

    async function addSection() {
        if (!newSectionTitle || !courseId) return
        const { data } = await supabase.from('lms_course_sections').insert({
            course_id: courseId, title: newSectionTitle, order_index: sections.length
        }).select().single()
        if (data) { setSections([...sections, { ...data, lms_course_contents: [] }]); setNewSectionTitle(''); setAddingSection(false) }
    }

    async function deleteSection(id) {
        await supabase.from('lms_course_sections').delete().eq('id', id)
        setSections(sections.filter(s => s.id !== id))
    }

    const ytThumb = form.thumbnail_url ? getYouTubeThumbnail(form.thumbnail_url) : null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 mb-8">
                {/* Header */}
                <div className="sticky top-0 bg-white p-6 border-b border-slate-100 flex items-center justify-between rounded-t-3xl z-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {courseId ? 'Edit Course' : 'Kursus Baru'}
                        </p>
                        <h3 className="text-base font-black text-slate-900">{form.title || 'Untitled Course'}</h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <Label className="text-[10px] font-black text-slate-400 uppercase">Judul Kursus *</Label>
                            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Contoh: Onboarding Karyawan Baru" className="mt-1 h-9 text-sm" />
                        </div>
                        <div>
                            <Label className="text-[10px] font-black text-slate-400 uppercase">Deskripsi</Label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Deskripsi singkat tentang kursus ini..."
                                rows={2} className="mt-1 w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[10px] font-black text-slate-400 uppercase">Kategori</Label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="mt-1 w-full h-9 text-sm border border-slate-200 rounded-lg px-2.5 bg-white outline-none">
                                    <option value="">Pilih kategori</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label className="text-[10px] font-black text-slate-400 uppercase">Level</Label>
                                <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
                                    className="mt-1 w-full h-9 text-sm border border-slate-200 rounded-lg px-2.5 bg-white outline-none capitalize">
                                    {LEVELS.map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[10px] font-black text-slate-400 uppercase">Thumbnail URL</Label>
                                <Input value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })}
                                    placeholder="https://..." className="mt-1 h-9 text-xs" />
                            </div>
                            <div>
                                <Label className="text-[10px] font-black text-slate-400 uppercase">Status</Label>
                                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                    className="mt-1 w-full h-9 text-sm border border-slate-200 rounded-lg px-2.5 bg-white outline-none">
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="flex-1">
                                <Label className="text-xs font-black text-slate-700">Dapatkan Sertifikat</Label>
                                <p className="text-[10px] text-slate-500 font-medium">Berikan sertifikat otomatis jika karyawan menyelesaikan kursus ini.</p>
                            </div>
                            <button
                                onClick={() => setForm({ ...form, has_certificate: !form.has_certificate })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${form.has_certificate ? 'bg-primary' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.has_certificate ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Save basic info first */}
                    <Button onClick={saveCourse} disabled={saving || !form.title}
                        className="w-full h-10 font-bold rounded-xl bg-primary text-white gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {courseId ? 'Simpan Perubahan' : 'Buat & Lanjutkan ke Sections'}
                    </Button>

                    {/* Sections — only show after course is saved */}
                    {courseId && (
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Sections / Bab</h4>
                                <button onClick={() => setAddingSection(true)}
                                    className="text-[11px] font-bold text-primary hover:text-brand-600 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Tambah Section
                                </button>
                            </div>

                            {sections.map(s => (
                                <SectionEditor key={s.id} section={s} courseId={courseId}
                                    onDelete={deleteSection} onUpdate={fetchSections} />
                            ))}

                            {sections.length === 0 && !addingSection && (
                                <p className="text-center text-[11px] text-slate-300 font-medium py-4">Belum ada section. Tambah section untuk mulai upload konten.</p>
                            )}

                            {addingSection && (
                                <div className="flex gap-2">
                                    <Input value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)}
                                        placeholder="Nama section (mis: Bab 1 - Pengenalan)" onKeyDown={e => e.key === 'Enter' && addSection()}
                                        className="h-9 text-sm flex-1" autoFocus />
                                    <Button size="sm" onClick={addSection} className="h-9 font-bold">Tambah</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setAddingSection(false)} className="h-9">Batal</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────
function AssignModal({ courseId, companyId, onClose }) {
    const supabase = createClient()
    const [employees, setEmployees] = useState([])
    const [selected, setSelected] = useState([])
    const [deadline, setDeadline] = useState('')
    const [saving, setSaving] = useState(false)
    const [done, setDone] = useState(false)

    useEffect(() => {
        supabase.from('employees').select('id, job_title, profiles!employees_profile_id_fkey(full_name, email)')
            .eq('company_id', companyId)
            .then(({ data }) => setEmployees(data || []))
    }, [companyId])

    async function handleAssign() {
        setSaving(true)
        const rows = selected.map(empId => ({
            course_id: courseId, employee_id: empId,
            deadline: deadline || null,
            due_date: deadline || null,  // legacy column
            company_id: companyId
        }))
        const { error } = await supabase.from('lms_course_assignments').upsert(rows, { onConflict: 'course_id,employee_id' })
        if (error) {
            alert('Gagal assign kursus: ' + error.message)
            setSaving(false)
        } else {
            setSaving(false)
            setDone(true)
            setTimeout(onClose, 1500)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900">Assign ke Karyawan</h3>
                    <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {done ? (
                        <div className="py-8 text-center">
                            <p className="text-emerald-500 font-black text-sm">✅ Berhasil di-assign!</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {employees.map(emp => (
                                    <label key={emp.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="checkbox" checked={selected.includes(emp.id)}
                                            onChange={e => setSelected(e.target.checked ? [...selected, emp.id] : selected.filter(x => x !== emp.id))}
                                            className="w-4 h-4 accent-orange-500" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{emp.profiles?.full_name}</p>
                                            <p className="text-[10px] text-slate-400">{emp.job_title} · {emp.profiles?.email}</p>
                                        </div>
                                    </label>
                                ))}
                                {employees.length === 0 && <p className="text-center text-slate-300 text-sm py-4">Tidak ada karyawan tersedia.</p>}
                            </div>
                            <div>
                                <Label className="text-[10px] font-black text-slate-400 uppercase">Deadline (opsional)</Label>
                                <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1 h-9" />
                            </div>
                            <Button onClick={handleAssign} disabled={saving || selected.length === 0}
                                className="w-full h-10 font-bold bg-primary text-white rounded-xl gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                Assign ke {selected.length} Karyawan
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LMSDashboardPage() {
    const [activeTab, setActiveTab] = useState('courses') // 'courses' or 'certificates'
    const [certificates, setCertificates] = useState([])
    const [companyId, setCompanyId] = useState(null)
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingCourse, setEditingCourse] = useState(null)
    const [assignCourseId, setAssignCourseId] = useState(null)
    const supabase = createClient()

    const fetchCertificates = useCallback(async (compId) => {
        const { data } = await supabase
            .from('lms_certificates')
            .select(`
                *,
                employee:employees(profiles(full_name)),
                course:lms_courses(title)
            `)
            .eq('employee:employees.company_id', compId) // This join filter is slightly complex in Supabase, better filter by results or use a view
            .order('issued_at', { ascending: false })

        // Manual filter because of deep join complexity in simple query
        setCertificates(data || [])
    }, [supabase])

    const fetchCourses = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
        if (profile?.company_id) {
            setCompanyId(profile.company_id)
            const { data } = await supabase.from('lms_courses')
                .select('*, lms_course_assignments(count)')
                .eq('company_id', profile.company_id)
                .order('created_at', { ascending: false })
            setCourses(data || [])
            fetchCertificates(profile.company_id)
        }
        setLoading(false)
    }, [supabase, fetchCertificates])

    useEffect(() => { fetchCourses() }, [fetchCourses])

    async function toggleStatus(courseId, currentStatus) {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published'
        await supabase.from('lms_courses').update({ status: newStatus }).eq('id', courseId)
        fetchCourses()
    }
    async function deleteCourse(id) {
        if (!confirm('Hapus kursus ini?')) return
        await supabase.from('lms_courses').delete().eq('id', id)
        fetchCourses()
    }

    const filtered = courses.filter(c => {
        const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = !filterStatus || c.status === filterStatus
        return matchSearch && matchStatus
    })

    const stats = [
        { label: 'Total Kursus', value: courses.length, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Published', value: courses.filter(c => c.status === 'published').length, icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Draft', value: courses.filter(c => c.status === 'draft').length, icon: EyeOff, color: 'text-slate-400', bg: 'bg-slate-50' },
        { label: 'Total Penugasan', value: courses.reduce((a, c) => a + (c.lms_course_assignments?.[0]?.count ?? 0), 0), icon: Users, color: 'text-violet-500', bg: 'bg-violet-50' },
    ]

    return (
        <div className="space-y-8 pb-20">
            {showModal && (
                <CourseModal
                    course={editingCourse}
                    companyId={companyId}
                    onClose={() => { setShowModal(false); setEditingCourse(null) }}
                    onSaved={fetchCourses}
                />
            )}
            {assignCourseId && (
                <AssignModal
                    courseId={assignCourseId}
                    companyId={companyId}
                    onClose={() => setAssignCourseId(null)}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Learning <span className="text-primary italic">Management</span></h1>
                    <p className="text-slate-500 font-medium">Kelola materi pelatihan dan pengembangan skill karyawan.</p>
                </div>

                <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'courses' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Katalog Kursus
                    </button>
                    <button
                        onClick={() => setActiveTab('certificates')}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'certificates' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Daftar Sertifikat
                    </button>
                </div>

                {activeTab === 'courses' && (
                    <Button onClick={() => { setEditingCourse(null); setShowModal(true) }}
                        className="h-11 rounded-xl bg-primary text-white font-black gap-2 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" /> Kursus Baru
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <Card key={i} className="p-5 border-none shadow-sm rounded-3xl flex items-center gap-4">
                        <div className={`w-11 h-11 ${s.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{s.label}</p>
                            <p className="text-xl font-black text-slate-900">{s.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filters (only for courses) */}
            {activeTab === 'courses' && (
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2 bg-white flex-1 p-2 pr-4 rounded-2xl border border-slate-100 shadow-sm">
                        <Search className="w-4 h-4 ml-2 text-slate-400 shrink-0" />
                        <input placeholder="Cari kursus..." className="flex-1 border-none bg-transparent text-sm font-medium outline-none p-1"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                        className="bg-white border border-slate-100 rounded-2xl px-4 py-2 text-sm font-bold text-slate-600 outline-none shadow-sm">
                        <option value="">Semua Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            )}

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : activeTab === 'courses' ? (
                <>
                    {filtered.length === 0 ? (
                        <Card className="p-20 text-center border-none shadow-sm rounded-[40px] bg-white">
                            <GraduationCap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-400">Belum Ada Kursus</h3>
                            <p className="text-slate-300 font-medium text-sm max-w-xs mx-auto mt-2">
                                Buat kursus pertama untuk tim Anda. Bisa berupa video, PDF, atau materi teks.
                            </p>
                            <Button onClick={() => setShowModal(true)} className="mt-6 rounded-xl bg-primary text-white font-bold gap-2">
                                <Plus className="w-4 h-4" /> Buat Kursus
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map(course => {
                                const ytThumb = getYouTubeThumbnail(course.thumbnail_url)
                                const hasCover = course.thumbnail_url || ytThumb
                                return (
                                    <Card key={course.id} className="overflow-hidden border-none shadow-xl shadow-slate-100/50 rounded-3xl bg-white group hover:shadow-2xl transition-all duration-300">
                                        {/* Thumbnail */}
                                        <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                                            {ytThumb ? (
                                                <img src={ytThumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : hasCover ? (
                                                <img src={course.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <MonitorPlay className="w-12 h-12 text-slate-300" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                            <div className="absolute top-3 left-3 flex gap-1.5">
                                                <Badge className={`text-[9px] font-black uppercase border-none ${course.status === 'published' ? 'bg-emerald-500 text-white' : course.status === 'archived' ? 'bg-slate-400 text-white' : 'bg-white/80 text-slate-600'}`}>
                                                    {course.status}
                                                </Badge>
                                                {course.category && (
                                                    <Badge className="text-[9px] font-black uppercase border-none bg-black/30 text-white">{course.category}</Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-5 space-y-3">
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h4>
                                                <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mt-1">{course.description || 'Tidak ada deskripsi.'}</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                <span className="text-[10px] font-black text-slate-300 uppercase capitalize">{course.level}</span>
                                                <div className="flex items-center gap-1">
                                                    <Button size="sm" variant="ghost"
                                                        onClick={() => toggleStatus(course.id, course.status)}
                                                        className="h-7 w-7 p-0 rounded-lg text-slate-300 hover:text-amber-500">
                                                        {course.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    </Button>
                                                    <Button size="sm" variant="ghost"
                                                        onClick={() => setAssignCourseId(course.id)}
                                                        className="h-7 w-7 p-0 rounded-lg text-slate-300 hover:text-violet-500">
                                                        <Users className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost"
                                                        onClick={() => { setEditingCourse(course); setShowModal(true) }}
                                                        className="h-7 px-3 rounded-lg text-slate-500 hover:text-primary font-bold text-[11px]">
                                                        Edit
                                                    </Button>
                                                    <Button size="sm" variant="ghost"
                                                        onClick={() => deleteCourse(course.id)}
                                                        className="h-7 w-7 p-0 rounded-lg text-slate-200 hover:text-red-400">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </>
            ) : (
                <div className="col-span-full">
                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Penerima</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Kursus</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">No. Sertifikat</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Tgl Terbit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {certificates.map(cert => (
                                    <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{cert.employee?.profiles?.full_name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-medium text-slate-600">{cert.course?.title}</p>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400 font-bold">
                                            {cert.certificate_no}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-[11px] font-bold text-slate-500">
                                                {new Date(cert.issued_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                                {certificates.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <BarChart3 className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                                            <p className="text-xs font-bold text-slate-300">Belum ada sertifikat yang terbit.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}
        </div>
    )
}
