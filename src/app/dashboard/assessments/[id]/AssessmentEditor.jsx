'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AssessmentBasicForm from '../BasicForm'
import QuestionsManager from '../QuestionsManager'
import {
    ArrowLeft,
    Settings,
    FileQuestion,
    Users,
    ChevronRight,
    CheckCircle2,
    LayoutDashboard,
    Mail,
    Trophy,
    Calendar,
    ExternalLink,
    Search
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import BulkAssigner from './BulkAssigner'

export default function AssessmentEditor({ assessment, candidates = [] }) {
    const [activeTab, setActiveTab] = useState('info') // 'info' | 'questions' | 'invite' | 'results'
    const router = useRouter()

    const assignments = assessment.assessment_assignments || []
    const completedCount = assignments.filter(a => a.status === 'completed').length
    const maxScore = assessment.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0

    const tabs = [
        { id: 'info', label: 'Info & Durasi', icon: Settings, count: null },
        { id: 'questions', label: 'Daftar Soal', icon: FileQuestion, count: assessment.questions?.length || 0 },
        { id: 'invite', label: 'Undang Peserta', icon: Mail, count: candidates.length },
        { id: 'results', label: 'Hasil Peserta', icon: Users, count: completedCount },
    ]

    return (
        <div className="space-y-8 pb-16">
            {/* Header Modern */}
            <div className="bg-white border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard/assessments">
                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200 hover:bg-slate-50 hover:border-primary/30 transition-all group">
                                <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-primary group-hover:-translate-x-1 transition-all" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{assessment.title}</h1>
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-brand-50 text-primary border border-primary/10 shadow-sm shadow-primary/5">
                                    Editor Mode
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> Assessment</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>{assessment.duration_minutes} Menit Durasi</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation Seamless */}
                <div className="flex items-center gap-2 mt-10 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100 w-fit overflow-x-auto max-w-full">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/50'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`} />
                            {tab.label}
                            {tab.count !== null && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-slate-200/50 text-slate-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto w-full">
                {/* Dynamic Content Based on Tab */}
                <div className="motion-safe:animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div className="bg-white border border-border rounded-3xl p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                        <Settings className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Informasi Dasar</h2>
                                        <p className="text-xs text-slate-500 font-medium">Judul, deskripsi, dan batas waktu pengerjaan.</p>
                                    </div>
                                </div>
                                <AssessmentBasicForm initialData={assessment} />
                            </div>

                            <div className="bg-brand-50/30 border border-primary/10 rounded-3xl p-6 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-primary mb-1">Tips UX: Durasi yang Tepat</h4>
                                    <p className="text-xs text-primary/70 leading-relaxed font-medium">Assessment yang baik tidak terlalu panjang. Gunakan 30-60 menit untuk tes teknis atau 15-20 menit untuk psikotes/logika dasar agar kandidat tidak cepat lelah.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div className="bg-white border border-border rounded-3xl p-8 shadow-sm">
                            <QuestionsManager assessmentId={assessment.id} initialQuestions={assessment.questions} />
                        </div>
                    )}

                    {activeTab === 'invite' && (
                        <div className="bg-white border border-border rounded-3xl p-8 shadow-sm transition-all">
                            <BulkAssigner assessmentId={assessment.id} candidates={candidates} />
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div className="space-y-6">
                            {assignments.length === 0 || completedCount === 0 ? (
                                <div className="bg-white border border-border rounded-3xl p-20 shadow-sm text-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 rotate-6 transition-transform hover:rotate-0">
                                        <Users className="w-12 h-12 text-slate-300" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-3">Belum Ada Hasil</h3>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed mb-10 font-medium">
                                        Belum ada kandidat yang menyelesaikan assessment ini. Hasil akan muncul otomatis setelah mereka klik kirim.
                                    </p>
                                    <Button onClick={() => setActiveTab('invite')} className="rounded-2xl font-bold h-12 px-8 gap-2 shadow-lg shadow-primary/20">
                                        <Mail className="w-4 h-4" /> Undang Kandidat Sekarang
                                    </Button>
                                </div>
                            ) : (
                                <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
                                    <div className="p-8 border-b border-slate-50 flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Rekapitulasi Nilai</h2>
                                            <p className="text-sm text-slate-500 font-medium">Daftar kandidat yang telah menyelesaikan assessment.</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/5 border border-primary/10 px-4 py-2 rounded-2xl">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Rata-rata Skor</p>
                                                <p className="text-lg font-bold text-primary">
                                                    {Math.round(assignments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.total_score || 0), 0) / completedCount)}
                                                    <span className="text-xs opacity-60"> / {maxScore}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b border-border">
                                                    <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Nama Peserta</th>
                                                    <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Skor Akhir</th>
                                                    <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                    <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Waktu Kumpul</th>
                                                    <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border font-medium">
                                                {assignments
                                                    .filter(a => a.status === 'completed')
                                                    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
                                                    .map(asgn => (
                                                        <tr key={asgn.id} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="p-5">
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{asgn.applications?.full_name}</p>
                                                                    <p className="text-[11px] text-slate-400">{asgn.applications?.email}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-5 text-center">
                                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${(asgn.total_score / maxScore) >= 0.7
                                                                        ? 'bg-green-50 text-green-700 border-green-100'
                                                                        : (asgn.total_score / maxScore) >= 0.5
                                                                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                                            : 'bg-red-50 text-red-700 border-red-100'
                                                                    }`}>
                                                                    <Trophy className="w-3.5 h-3.5" />
                                                                    {asgn.total_score} / {maxScore}
                                                                </div>
                                                            </td>
                                                            <td className="p-5 text-center">
                                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-black uppercase tracking-widest border border-slate-200 shadow-sm shadow-slate-200/50">
                                                                    SELESAI
                                                                </span>
                                                            </td>
                                                            <td className="p-5">
                                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    {asgn.submitted_at ? new Date(asgn.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                </div>
                                                            </td>
                                                            <td className="p-5 text-right">
                                                                <Link href={`/dashboard/candidates/${asgn.application_id}`}>
                                                                    <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl font-bold group-hover:bg-primary group-hover:text-white transition-all">
                                                                        Profil <ExternalLink className="w-3.5 h-3.5 ml-2 transition-transform group-hover:scale-110" />
                                                                    </Button>
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
