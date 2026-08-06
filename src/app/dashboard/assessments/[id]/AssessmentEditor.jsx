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
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="bg-white border border-border rounded-md p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                        <Link href="/dashboard/assessments">
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-md">
                                <ArrowLeft className="w-4 h-4 text-slate-400" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h1 className="text-xl font-bold tracking-tight text-foreground">{assessment.title}</h1>
                                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-brand-50 text-primary border border-primary/10">
                                    Editor Mode
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> Assessment</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>{assessment.duration_minutes} Menit Durasi</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 mt-6 bg-slate-50 p-1 rounded-md border border-slate-200 w-fit overflow-x-auto max-w-full">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors relative whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-primary border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`} />
                            {tab.label}
                            {tab.count !== null && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto w-full">
                {/* Dynamic Content Based on Tab */}
                <div>
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <div className="bg-white border border-border rounded-md p-6">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                    <div className="w-9 h-9 bg-slate-50 rounded-md flex items-center justify-center border border-slate-200">
                                        <Settings className="w-4.5 h-4.5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Informasi Dasar</h2>
                                        <p className="text-xs text-slate-500 font-medium">Judul, deskripsi, dan batas waktu pengerjaan.</p>
                                    </div>
                                </div>
                                <AssessmentBasicForm initialData={assessment} />
                            </div>

                            <div className="bg-brand-50 border border-primary/10 rounded-md p-5 flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-primary mb-1">Tips UX: Durasi yang Tepat</h4>
                                    <p className="text-xs text-primary/70 leading-relaxed font-medium">Assessment yang baik tidak terlalu panjang. Gunakan 30-60 menit untuk tes teknis atau 15-20 menit untuk psikotes/logika dasar agar kandidat tidak cepat lelah.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div className="bg-white border border-border rounded-md p-6">
                            <QuestionsManager assessmentId={assessment.id} initialQuestions={assessment.questions} />
                        </div>
                    )}

                    {activeTab === 'invite' && (
                        <div className="bg-white border border-border rounded-md p-6">
                            <BulkAssigner assessmentId={assessment.id} candidates={candidates} />
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div className="space-y-4">
                            {assignments.length === 0 || completedCount === 0 ? (
                                <div className="bg-white border border-border rounded-md p-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-md flex items-center justify-center mx-auto mb-6 border border-slate-200">
                                        <Users className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Ada Hasil</h3>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed mb-6 font-medium">
                                        Belum ada kandidat yang menyelesaikan assessment ini. Hasil akan muncul otomatis setelah mereka klik kirim.
                                    </p>
                                    <Button onClick={() => setActiveTab('invite')} className="rounded-md font-semibold h-10 px-6 gap-2">
                                        <Mail className="w-4 h-4" /> Undang Kandidat Sekarang
                                    </Button>
                                </div>
                            ) : (
                                <div className="bg-white border border-border rounded-md overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900">Rekapitulasi Nilai</h2>
                                            <p className="text-sm text-slate-500 font-medium">Daftar kandidat yang telah menyelesaikan assessment.</p>
                                        </div>
                                        <div className="bg-brand-50 border border-primary/10 px-4 py-2 rounded-md">
                                            <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">Rata-rata Skor</p>
                                            <p className="text-base font-bold text-primary">
                                                {Math.round(assignments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.total_score || 0), 0) / completedCount)}
                                                <span className="text-xs opacity-60"> / {maxScore}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-border">
                                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Nama Peserta</th>
                                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Skor Akhir</th>
                                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Status</th>
                                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Waktu Kumpul</th>
                                                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border font-medium">
                                                {assignments
                                                    .filter(a => a.status === 'completed')
                                                    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
                                                    .map(asgn => (
                                                        <tr key={asgn.id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="p-4">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">{asgn.applications?.full_name}</p>
                                                                    <p className="text-[11px] text-slate-400">{asgn.applications?.email}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${(asgn.total_score / maxScore) >= 0.7
                                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                                        : (asgn.total_score / maxScore) >= 0.5
                                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                                    }`}>
                                                                    <Trophy className="w-3.5 h-3.5" />
                                                                    {asgn.total_score} / {maxScore}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-semibold uppercase tracking-wide border border-slate-200">
                                                                    SELESAI
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    {asgn.submitted_at ? new Date(asgn.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <Link href={`/dashboard/candidates/${asgn.application_id}`}>
                                                                    <Button variant="ghost" size="sm" className="h-8 px-3 rounded-md font-semibold group-hover:bg-primary group-hover:text-white transition-colors">
                                                                        Profil <ExternalLink className="w-3.5 h-3.5 ml-2" />
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
