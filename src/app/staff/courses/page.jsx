'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    GraduationCap, MonitorPlay, FileText, BookOpen,
    CheckCircle2, Clock, Play, ArrowLeft, ExternalLink, Award
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

function getYouTubeId(url) {
    if (!url) return null
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
}
function getYouTubeThumbnail(url) {
    const id = getYouTubeId(url)
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

// ─── Content Viewer ───────────────────────────────────────────────────────────
function ContentViewer({ content, employeeId, onComplete }) {
    const supabase = createClient()
    const ytId = getYouTubeId(content.content_url)
    const [completed, setCompleted] = useState(false)

    useEffect(() => {
        // Find if this specific content is already completed in the progress map
        const isAlreadyDone = content.finished || false
        setCompleted(isAlreadyDone)
    }, [content])

    async function markComplete() {
        setCompleted(true) // Optimistic update
        const { error } = await supabase.from('lms_content_progress').upsert({
            content_id: content.id,
            employee_id: employeeId,
            is_completed: true,
            completed_at: new Date().toISOString()
        }, { onConflict: 'content_id,employee_id' })

        if (error) {
            setCompleted(false)
            return
        }
        onComplete?.()
    }

    return (
        <div className="space-y-4">
            {/* Video */}
            {content.content_type === 'video' && (
                <div>
                    {ytId ? (
                        <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                            <iframe
                                src={`https://www.youtube.com/embed/${ytId}`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : content.content_url ? (
                        <div className="rounded-2xl bg-slate-100 p-6 text-center">
                            <MonitorPlay className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <a href={content.content_url} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                                Buka Video <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    ) : null}
                </div>
            )}

            {/* PDF */}
            {content.content_type === 'pdf' && content.content_url && (
                <div className="rounded-2xl bg-red-50 border border-red-100 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{content.title}</p>
                        <a href={content.content_url} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline mt-1">
                            Buka PDF <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            )}

            {/* Text */}
            {content.content_type === 'text' && content.content_body && (
                <div className="rounded-2xl bg-slate-50 p-6">
                    <div className="prose prose-sm max-w-none text-slate-700">{content.content_body}</div>
                </div>
            )}

            {/* Mark as complete */}
            <div className="flex justify-end">
                <Button
                    onClick={markComplete}
                    disabled={completed}
                    size="sm"
                    className={`h-9 font-bold rounded-xl gap-2 ${completed ? 'bg-emerald-100 text-emerald-600' : 'bg-primary text-white'}`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    {completed ? 'Sudah Selesai' : 'Tandai Selesai'}
                </Button>
            </div>
        </div>
    )
}

// ─── Course Detail ────────────────────────────────────────────────────────────
function CourseDetail({ assignment, employeeId, onBack }) {
    const supabase = createClient()
    const course = assignment.lms_courses
    const [sections, setSections] = useState([])
    const [activeContent, setActiveContent] = useState(null)
    const [progress, setProgress] = useState({})
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        const { data: secs } = await supabase
            .from('lms_course_sections')
            .select('*, lms_course_contents(*)')
            .eq('course_id', course.id)
            .order('order_index')
        setSections(secs || [])

        const allContentIds = secs?.flatMap(s => s.lms_course_contents.map(c => c.id)) ?? []
        if (allContentIds.length > 0) {
            const { data: prog } = await supabase
                .from('lms_content_progress')
                .select('content_id, is_completed')
                .eq('employee_id', employeeId)
                .in('content_id', allContentIds)
            const map = {}
            prog?.forEach(p => { map[p.content_id] = p.is_completed })
            setProgress(map)

            // Enrich sections with completion status for ContentViewer
            const enrichedSections = secs?.map(s => ({
                ...s,
                lms_course_contents: s.lms_course_contents.map(c => ({
                    ...c,
                    finished: map[c.id] || false
                }))
            }))
            setSections(enrichedSections || [])

            // Set first content if none active
            if (!activeContent && enrichedSections?.[0]?.lms_course_contents?.[0]) {
                setActiveContent(enrichedSections[0].lms_course_contents[0])
            }
        }
        setLoading(false)
    }, [course.id, employeeId, supabase])

    useEffect(() => { fetchData() }, [fetchData])

    const totalContents = sections.reduce((a, s) => a + s.lms_course_contents.length, 0)
    const completedContents = Object.values(progress).filter(Boolean).length
    const pct = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0

    // Auto-update enrollment status to completed if 100%
    useEffect(() => {
        if (pct === 100 && !assignment.completed_at) {
            supabase.from('lms_course_assignments')
                .update({ completed_at: new Date().toISOString() })
                .eq('id', assignment.id)
                .then(() => {
                    // Update local assignment object if needed, but usually parent refresh is better
                    // For now, no redirect as requested
                })
        }
    }, [pct, assignment, supabase])

    const ytThumb = getYouTubeThumbnail(course.thumbnail_url)

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-primary tracking-wide transition-colors">
                <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Kursus
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Sections */}
                <div className="space-y-3">
                    {/* Course Header */}
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        {(ytThumb || course.thumbnail_url) && (
                            <div className="h-28 overflow-hidden">
                                <img src={ytThumb ?? course.thumbnail_url} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-4 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm leading-tight">{course.title}</h3>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                                    <span>Progress</span>
                                    <span>{completedContents}/{totalContents} konten</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                                </div>
                                <p className="text-[10px] font-bold text-primary text-right">{pct}%</p>
                            </div>
                            {pct === 100 && course.has_certificate && (
                                <Link href={`/staff/lms/certificate/${course.id}`} className="block mt-2">
                                    <Button className="w-full h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] uppercase gap-2">
                                        <Award className="w-3.5 h-3.5" /> Lihat Sertifikat
                                    </Button>
                                </Link>
                            )}
                            {assignment.deadline && (
                                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                                    <Clock className="w-3 h-3" /> Deadline: {new Date(assignment.deadline).toLocaleDateString('id-ID')}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Section/Content list */}
                    <div className="space-y-2">
                        {loading ? (
                            <div className="space-y-2">
                                {Array(3).fill(0).map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}
                            </div>
                        ) : sections.map(section => (
                            <div key={section.id}>
                                <p className="text-[10px] font-bold text-slate-400 tracking-wide px-2 py-1">{section.title}</p>
                                <div className="space-y-1">
                                    {section.lms_course_contents.sort((a, b) => a.order_index - b.order_index).map(c => {
                                        const isFinished = !!progress[c.id]
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => setActiveContent(c)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${activeContent?.id === c.id ? 'bg-primary/5 border border-primary/20' : 'hover:bg-slate-50 border border-transparent'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isFinished ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                                    {isFinished
                                                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                        : c.content_type === 'video' ? <Play className="w-3 h-3 text-blue-400" />
                                                            : c.content_type === 'pdf' ? <FileText className="w-3 h-3 text-red-400" />
                                                                : <BookOpen className="w-3 h-3 text-emerald-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-bold truncate ${isFinished ? 'text-emerald-600 line-through' : 'text-slate-700'}`}>{c.title}</p>
                                                    {c.duration_mins && <span className="text-[9px] text-slate-300">{c.duration_mins} mnt</span>}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Content Viewer */}
                <div className="lg:col-span-2">
                    {activeContent ? (
                        <Card className="border-none shadow-sm rounded-2xl p-6 space-y-4">
                            <div>
                                <h4 className="font-bold text-slate-900">{activeContent.title}</h4>
                                <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-0.5">{activeContent.content_type}</p>
                            </div>
                            <ContentViewer content={activeContent} employeeId={employeeId} onComplete={fetchData} />
                        </Card>
                    ) : (
                        <Card className="border-none shadow-sm rounded-2xl p-12 text-center bg-slate-50">
                            <GraduationCap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">Pilih konten dari daftar di kiri untuk mulai belajar.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffCoursesPage() {
    const [assignments, setAssignments] = useState([])
    const [loading, setLoading] = useState(true)
    const [employeeId, setEmployeeId] = useState(null)
    const [activeCourse, setActiveCourse] = useState(null)
    const supabase = createClient()

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            const { data: emp } = await supabase.from('employees').select('id').eq('profile_id', user.id).single()
            if (!emp) { setLoading(false); return }
            setEmployeeId(emp.id)

            const { data } = await supabase
                .from('lms_course_assignments')
                .select(`
                    id,
                    employee_id,
                    course_id,
                    completed_at,
                    deadline,
                    lms_courses (
                        id, title, description, thumbnail_url, category, level, status, has_certificate,
                        lms_course_sections (
                            id,
                            lms_course_contents (id)
                        )
                    )
                `)
                .eq('employee_id', emp.id)
                .order('created_at', { ascending: false })

            setAssignments(data?.filter(a => a.lms_courses?.status === 'published') ?? [])
            setLoading(false)
        }
        load()
    }, [supabase])

    if (activeCourse) {
        return (
            <div className="pb-20">
                <CourseDetail assignment={activeCourse} employeeId={employeeId} onBack={() => setActiveCourse(null)} />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Kursus <span className="text-primary italic">Saya</span></h1>
                <p className="text-slate-500 font-medium text-sm">Materi pelatihan yang sudah ditugaskan untuk Anda.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array(2).fill(0).map((_, i) => <div key={i} className="h-52 rounded-3xl bg-slate-100 animate-pulse" />)}
                </div>
            ) : assignments.length === 0 ? (
                <Card className="p-16 text-center border-none shadow-sm rounded-3xl">
                    <GraduationCap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="font-bold text-slate-400">Belum ada kursus yang ditugaskan.</p>
                    <p className="text-sm text-slate-300 mt-1">HR akan menugaskan kursus untukmu segera.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {assignments.map(assignment => {
                        const course = assignment.lms_courses
                        const totalContents = course.lms_course_sections?.reduce((a, s) => a + s.lms_course_contents.length, 0) ?? 0
                        const ytThumb = getYouTubeThumbnail(course.thumbnail_url)
                        return (
                            <Card key={assignment.id}
                                onClick={() => setActiveCourse(assignment)}
                                className="overflow-hidden border-none shadow-lg shadow-slate-100/50 rounded-3xl bg-white group hover:shadow-xl transition-all cursor-pointer">
                                <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                                    {(ytThumb || course.thumbnail_url) ? (
                                        <img src={ytThumb ?? course.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <MonitorPlay className="w-10 h-10 text-slate-300" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                    <div className="absolute bottom-3 left-3">
                                        {course.category && <Badge className="text-[9px] font-black uppercase border-none bg-white/80 text-slate-700">{course.category}</Badge>}
                                    </div>
                                </div>
                                <div className="p-5 space-y-3">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">{course.title}</h4>
                                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{course.description}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-300 font-bold">{totalContents} konten</span>
                                        {assignment.deadline && (
                                            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                                                <Clock className="w-3 h-3" /> {new Date(assignment.deadline).toLocaleDateString('id-ID')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); setActiveCourse(assignment) }}
                                            className="flex-1 h-9 rounded-xl bg-primary text-white font-bold gap-2 text-xs"
                                        >
                                            <Play className="w-3.5 h-3.5" /> Mulai Belajar
                                        </Button>
                                        {(course.has_certificate ?? true) && (
                                            <Link
                                                href={`/staff/lms/certificate/${course.id}`}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <Button
                                                    variant="outline"
                                                    className="h-9 w-9 rounded-xl border-amber-200 text-amber-500 hover:bg-amber-50 p-0 shrink-0"
                                                    title="Lihat Sertifikat"
                                                >
                                                    <Award className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
