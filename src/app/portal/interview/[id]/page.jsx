'use client'

import { useState, useEffect } from 'react'
import { JitsiMeeting } from '@jitsi/react-sdk'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Video, User, Info, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

export default function CandidateInterviewPage({ params: paramsPromise }) {
    const params = use(paramsPromise)
    const [interview, setInterview] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchInterview() {
            try {
                // We'll use a public-safe API call or just fetch the basics
                // For simplicity now, let's assume we have a way to get interview basic info
                // I'll create a server action for this or just fetch it here if possible.
                // But wait, candidate doesn't have HR admin permission.
                // We need a public-safe fetcher.
                
                // Let's use the ID to fetch from Supabase.
                // I'll assume I should create a server action 'getPublicInterview' in interviews.js
                const { getPublicInterview } = await import('@/lib/actions/interviews')
                const data = await getPublicInterview(params.id)
                setInterview(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchInterview()
    }, [params.id])

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-[0.2em]">Menyiapkan Ruang Wawancara...</p>
            </div>
        )
    }

    if (error || !interview) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
                <Card className="max-w-md w-full p-8 rounded-[40px] border-none bg-white text-center shadow-2xl">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Sesi Tidak Ditemukan</h2>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                        Maaf, tautan wawancara ini tidak valid atau sdh kedaluwarsa. Silakan hubungi tim rekrutmen kami.
                    </p>
                    <Link href="/portal">
                        <Button className="w-full h-12 rounded-2xl font-black bg-slate-950 hover:bg-slate-800 transition-all">
                            Kembali ke Portal
                        </Button>
                    </Link>
                </Card>
            </div>
        )
    }

    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";
    const roomName = `${interview.company_slug}/${interview.jitsi_room_id}`;

    return (
        <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
             {/* Simple Header */}
             <div className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/portal">
                        <div className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-all cursor-pointer">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </div>
                    </Link>
                    <div className="h-6 w-px bg-white/10" />
                    <div>
                        <h1 className="text-sm font-black text-white leading-none mb-1">{interview.candidate_name} — Interview Session</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{interview.job_title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Secured Line</span>
                </div>
             </div>

             {/* Jitsi Area */}
             <div className="flex-1 relative">
                <JitsiMeeting
                    domain={domain}
                    roomName={roomName}
                    configOverwrite={{
                        disableDeepLinking: true,
                        prejoinPageEnabled: true, // Let candidate see themselves first
                        enableWelcomePage: false,
                        startWithAudioMuted: true,
                        startWithVideoMuted: false,
                    }}
                    interfaceConfigOverwrite={{
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                            'fodeviceselection', 'hangup', 'profile', 'chat', 'settings', 'raisehand',
                            'videoquality', 'filmstrip', 'tileview', 'videobackgroundblur', 'help'
                        ],
                    }}
                    userInfo={{
                        displayName: interview.candidate_name,
                        email: interview.candidate_email
                    }}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = '100%';
                        iframeRef.style.width = '100%';
                    }}
                />
             </div>
        </div>
    )
}
