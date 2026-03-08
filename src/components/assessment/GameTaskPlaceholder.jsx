'use client'

import { Sparkles, Gamepad2, Brain, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function GameTaskPlaceholder({ variant = 'default' }) {
    return (
        <div className="relative group perspective-1000">
            {/* Animated Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-brand-400 to-primary rounded-[48px] blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000 animate-pulse" />

            <div className="relative py-16 px-8 bg-slate-950 rounded-[48px] border-[6px] border-slate-900/50 shadow-3xl overflow-hidden flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]">
                {/* Cyberpunk grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(234,88,12,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(234,88,12,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

                <div className="relative">
                    <div className="w-24 h-24 bg-primary/20 rounded-[32px] flex items-center justify-center border-2 border-primary/30 rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-[0_0_30px_rgba(234,88,12,0.3)]">
                        <Gamepad2 className="w-12 h-12 text-primary" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-brand-400/20 rounded-2xl flex items-center justify-center border border-brand-400/30 -rotate-12 group-hover:rotate-0 transition-transform duration-700 animate-bounce">
                        <Zap className="w-6 h-6 text-brand-500" />
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                        Module Beta Active
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-widest uppercase italic">Logic<span className="text-primary">Quest</span> Engine</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                        Algoritma ARVELA sedang melakukan <span className="text-white font-bold">Instansiasi Modul Game</span> untuk skema asesmen perilaku ini.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500">
                        <Brain className="w-3 h-3" /> Cognitive Analysis
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500">
                        <Sparkles className="w-3 h-3" /> Behavioral Mapping
                    </div>
                </div>

                <Button
                    disabled
                    className="relative overflow-hidden bg-white/5 hover:bg-white/5 border-white/10 text-white/20 h-14 px-10 rounded-2xl font-black italic tracking-widest uppercase text-xs"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    In-Sync Processing...
                </Button>
            </div>

            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-[0.3em] mt-6 animate-pulse">
                Sistem Pengerjaan Terdeteksi — Menunggu Aktivasi Lanjutan
            </p>
        </div>
    )
}
