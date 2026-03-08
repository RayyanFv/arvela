'use client'

// ──────────────────────────────────────────────────
// MODULE  : Staff Onboarding (Mod 6 — Employee)
// FILE    : app/staff/onboarding/page.jsx
// TABLES  : employees, onboarding_progress, onboarding_tasks
// ACCESS  : PROTECTED — employee
// SKILL   : baca Arvela/SKILL.md sebelum edit file ini
// ──────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, CheckCircle2, Circle, Clock, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function ProgressRing({ pct }) {
    const r = 22, c = 2 * Math.PI * r
    return (
        <svg width={56} height={56} viewBox="0 0 56 56" className="-rotate-90 shrink-0">
            <circle cx={28} cy={28} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={5} />
            <circle cx={28} cy={28} r={r} fill="none"
                stroke="hsl(var(--primary))" strokeWidth={5}
                strokeDasharray={`${(pct / 100) * c} ${c}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
        </svg>
    )
}

export default function StaffOnboardingPage() {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(null)
    const supabase = createClient()

    async function fetchTasks() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: emp } = await supabase
            .from('employees')
            .select('id')
            .eq('profile_id', user.id)
            .single()

        if (!emp) { setLoading(false); return }

        // onboarding_progress join ke onboarding_tasks untuk dapat title & description
        const { data } = await supabase
            .from('onboarding_progress')
            .select('id, is_completed, completed_at, onboarding_tasks(id, title, description, due_days, order_index)')
            .eq('employee_id', emp.id)
            .order('onboarding_tasks(order_index)', { ascending: true })

        setTasks(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchTasks()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function toggleTask(progressId, current) {
        setUpdating(progressId)
        const now = new Date().toISOString()
        await supabase
            .from('onboarding_progress')
            .update({
                is_completed: !current,
                completed_at: !current ? now : null,
            })
            .eq('id', progressId)
        await fetchTasks()
        setUpdating(null)
    }

    const completed = tasks.filter(t => t.is_completed).length
    const total = tasks.length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0

    if (loading) return (
        <div className="p-20 text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">Menyiapkan checklist...</p>
        </div>
    )

    return (
        <div className="max-w-3xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-start gap-5">
                <div className="relative">
                    <ProgressRing pct={pct} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[11px] font-black text-foreground">{pct}%</span>
                    </div>
                </div>
                <div className="flex-1 pt-1">
                    <h1 className="text-2xl font-black text-foreground tracking-tight">
                        Onboarding <span className="text-primary">Checklist</span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {completed} dari {total} tugas selesai
                        {pct === 100 && <span className="text-emerald-500 font-bold ml-2">— Selamat, semua selesai!</span>}
                    </p>
                    <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Tasks */}
            {tasks.length === 0 ? (
                <Card className="p-12 border-none shadow-sm rounded-2xl text-center">
                    <BookOpen className="w-10 h-10 text-muted mx-auto mb-3" />
                    <p className="font-bold text-muted-foreground">Belum ada tugas onboarding yang ditetapkan.</p>
                    <p className="text-xs text-muted-foreground mt-1">Hubungi HR untuk informasi lebih lanjut.</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {tasks.map((t, i) => {
                        const task = t.onboarding_tasks
                        const done = t.is_completed
                        const busy = updating === t.id
                        return (
                            <Card
                                key={t.id}
                                className={`p-5 border-none shadow-sm rounded-2xl transition-all ${done ? 'bg-emerald-50/50' : 'bg-card'}`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => !busy && toggleTask(t.id, done)}
                                        disabled={busy}
                                        className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                                        aria-label={done ? 'Tandai belum selesai' : 'Tandai selesai'}
                                    >
                                        {busy
                                            ? <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                            : done
                                                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                : <Circle className="w-5 h-5 text-muted-foreground/40" />
                                        }
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`font-bold text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                {task?.title ?? `Tugas ${i + 1}`}
                                            </span>
                                            {done && (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black uppercase">
                                                    Selesai
                                                </Badge>
                                            )}
                                        </div>
                                        {task?.description && (
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{task.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            {task?.due_days && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    Selesaikan dalam {task.due_days} hari
                                                </span>
                                            )}
                                            {done && t.completed_at && (
                                                <span className="text-[10px] font-bold text-emerald-600">
                                                    Selesai {new Date(t.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Help Banner */}
            <div className="bg-sidebar-bg rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Bantuan & Dukungan</p>
                    <p className="text-sm font-medium text-sidebar-muted">Ada kendala dalam menyelesaikan tugas?</p>
                </div>
                <button className="px-6 h-10 rounded-xl bg-white text-foreground font-bold text-sm flex items-center gap-2 hover:bg-brand-50 transition-colors shrink-0">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Hubungi HR BP
                </button>
            </div>
        </div>
    )
}
