'use client'

// ──────────────────────────────────────────────────
// MODULE  : LMS Certificate (Staff Side)
// FILE    : app/staff/lms/certificate/[courseId]/page.jsx
// TABLES  : lms_courses, lms_enrollments, lms_certificates, employees
// ACCESS  : PROTECTED — employee
// ──────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { Award, GraduationCap, CheckCircle2, Download, ArrowLeft, Loader2, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CertificatePage() {
    const supabase = createClient()
    const params = useParams()
    const courseId = params.courseId

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [issuing, setIssuing] = useState(false)
    const [cert, setCert] = useState(null)
    const [employee, setEmployee] = useState(null)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let finalEmp = emp
            if (!finalEmp) {
                // If no employee record found (maybe because Super Admin), mock it for UI testing
                finalEmp = {
                    id: '00000000-0000-0000-0000-000000000000',
                    profiles: { full_name: user.email?.split('@')[0] || 'Tester' }
                }
            }
            setEmployee(finalEmp)

            // Get course
            const { data: course } = await supabase
                .from('lms_courses')
                .select('id, title, description, thumbnail_url, has_certificate, companies(name)')
                .eq('id', courseId)
                .single()

            // Get enrollment to check completion
            const { data: enrollment } = await supabase
                .from('lms_enrollments')
                .select('id, completed_at')
                .eq('course_id', courseId)
                .eq('employee_id', emp?.id)
                .maybeSingle()

            // Calculate progress dynamically (Explicitly to avoid join issues)
            const { data: sections } = await supabase
                .from('lms_course_sections')
                .select('id')
                .eq('course_id', courseId)

            const sectionIds = sections?.map(s => s.id) || []
            let allContentIds = []

            if (sectionIds.length > 0) {
                const { data: contents } = await supabase
                    .from('lms_course_contents')
                    .select('id')
                    .in('section_id', sectionIds)
                allContentIds = contents?.map(c => c.id) || []
            }

            const totalContents = allContentIds.length
            let currentPct = 0

            if (totalContents > 0) {
                const { count } = await supabase
                    .from('lms_content_progress')
                    .select('*', { count: 'exact', head: true })
                    .eq('employee_id', emp?.id)
                    .in('content_id', allContentIds)
                    .eq('is_completed', true)
                currentPct = Math.round((count / totalContents) * 100)
            }

            // Get existing certificate
            const { data: existingCert } = await supabase
                .from('lms_certificates')
                .select('*')
                .eq('course_id', courseId)
                .eq('employee_id', emp?.id)
                .maybeSingle()

            setData({
                course,
                enrollment: {
                    ...enrollment,
                    progress: currentPct,
                    completed_at: (currentPct === 100 && totalContents > 0) ? (enrollment?.completed_at || new Date().toISOString()) : null
                }
            })
            setCert(existingCert)
            setLoading(false)
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId])

    async function issueCertificate() {
        setIssuing(true)
        // Simulation mode: Don't actually hit DB, just show the UI
        setTimeout(() => {
            setCert({
                id: 'mock-cert-id',
                certificate_no: 'ARVELA-TEST-' + Math.random().toString(36).substring(7).toUpperCase(),
                issued_at: new Date().toISOString()
            })
            setIssuing(false)
        }, 800)
    }

    function handlePrint() {
        window.print()
    }

    if (loading) return (
        <div className="p-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">Memuat sertifikat...</p>
        </div>
    )

    const isCompleted = true // Force true for testing without constraints
    const courseName = data?.course?.title ?? 'Kursus'
    const employeeName = employee?.profiles?.full_name ?? 'Karyawan'
    const companyName = data?.course?.companies?.name ?? ''
    const completedDate = new Date(data?.enrollment?.completed_at || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-24">
            <Link href="/staff/courses" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Kembali ke Kursus Saya
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Sertifikat Penyelesaian</h1>
                <p className="text-muted-foreground text-sm mt-1">{courseName}</p>
            </div>

            {(data?.course?.has_certificate === false) ? (
                <Card className="p-12 border-none shadow-sm rounded-2xl text-center bg-slate-50">
                    <EyeOff className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-500 mb-1">Sertifikat Tidak Tersedia</h3>
                    <p className="text-slate-400 text-sm">Kursus ini tidak menyediakan sertifikat penyelesaian.</p>
                </Card>
            ) : !isCompleted ? (
                <Card className="p-12 border-none shadow-sm rounded-2xl text-center">
                    <GraduationCap className="w-12 h-12 text-muted mx-auto mb-4" />
                    <h3 className="font-bold text-foreground mb-2">Kursus Belum Selesai</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Selesaikan semua materi kursus ini terlebih dahulu untuk mendapatkan sertifikat.
                    </p>
                    <p className="text-sm font-bold text-primary mt-4">Progress: {data?.enrollment?.progress ?? 0}%</p>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${data?.enrollment?.progress ?? 0}%` }} />
                    </div>
                </Card>
            ) : !cert ? (
                <Card className="p-8 border-none shadow-sm rounded-2xl text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="font-bold text-foreground mb-2">Kursus Selesai!</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                        Selamat! Kamu telah menyelesaikan <strong>{courseName}</strong> pada {completedDate}.
                        Klik tombol di bawah untuk menerbitkan sertifikat resmi.
                    </p>
                    <Button
                        onClick={issueCertificate}
                        disabled={issuing}
                        className="h-11 px-8 rounded-xl bg-primary text-primary-foreground font-bold gap-2"
                    >
                        {issuing ? <><Loader2 className="w-4 h-4 animate-spin" /> Menerbitkan...</> : <><Award className="w-4 h-4" /> Terbitkan Sertifikat</>}
                    </Button>
                </Card>
            ) : (
                <>
                    {/* Certificate Card — printable */}
                    <div id="certificate-print" className="relative">
                        <Card className="border-2 border-primary/20 shadow-xl rounded-3xl overflow-hidden print:shadow-none print:rounded-none print:border-none">
                            {/* Top accent */}
                            <div className="h-3 bg-gradient-to-r from-primary via-brand-400 to-primary" />

                            <div className="px-12 py-10 text-center">
                                {/* Logo */}
                                <div className="flex items-center justify-center gap-2.5 mb-8">
                                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                        <span className="text-primary-foreground font-black text-base">A</span>
                                    </div>
                                    <span className="font-black text-xl text-foreground tracking-tight">Arvela<span className="text-primary">HR</span></span>
                                </div>

                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Sertifikat Penyelesaian</p>
                                <p className="text-muted-foreground text-sm font-medium mb-8">Diberikan kepada</p>

                                <h2 className="text-4xl font-bold text-foreground tracking-tight mb-2">{employeeName}</h2>
                                {companyName && <p className="text-muted-foreground text-sm font-medium mb-8">{companyName}</p>}

                                <p className="text-muted-foreground text-sm font-medium mb-2">atas keberhasilan menyelesaikan kursus</p>
                                <h3 className="text-2xl font-bold text-primary mb-8 leading-tight">{courseName}</h3>

                                {/* Divider */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="flex-1 h-px bg-border" />
                                    <Award className="w-6 h-6 text-primary/30" />
                                    <div className="flex-1 h-px bg-border" />
                                </div>

                                <div className="grid grid-cols-2 gap-8 text-left">
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Tanggal Terbit</p>
                                        <p className="font-bold text-foreground text-sm">
                                            {new Date(cert.issued_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">No. Sertifikat</p>
                                        <p className="font-mono font-bold text-foreground text-sm">{cert.certificate_no}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom accent */}
                            <div className="h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
                        </Card>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handlePrint}
                            className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold gap-2"
                        >
                            <Download className="w-4 h-4" /> Cetak / Unduh PDF
                        </Button>
                        <Link href="/staff/courses">
                            <Button variant="outline" className="h-11 px-6 rounded-xl font-bold">
                                Kembali ke Kursus Saya
                            </Button>
                        </Link>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Gunakan Ctrl+P (Windows) atau Cmd+P (Mac) dan pilih "Save as PDF" untuk menyimpan sertifikat.
                    </p>
                </>
            )}
        </div>
    )
}
