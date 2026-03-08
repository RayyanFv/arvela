'use client'

import { CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toggleOnboardingTask } from '@/lib/actions/hcm'
import { useTransition } from 'react'

export function OnboardingList({ tasks = [] }) {
    const [isPending, startTransition] = useTransition()

    const completedCount = tasks.filter(t => t.is_completed).length
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

    async function handleToggle(progressId, currentStatus) {
        startTransition(async () => {
            try {
                await toggleOnboardingTask({ progressId, completed: !currentStatus })
            } catch (err) {
                alert(err.message)
            }
        })
    }

    return (
        <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-8 bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <CheckCircle2 className="w-32 h-32 text-primary" />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between text-sm font-black uppercase tracking-widest text-slate-400">
                    <span>Kemajuan Onboarding</span>
                    <span className="text-primary">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-slate-100" />
            </div>

            <div className="space-y-3 relative z-10">
                {tasks.map(task => (
                    <button
                        key={task.progress_id || task.id}
                        disabled={isPending}
                        onClick={() => handleToggle(task.progress_id, task.is_completed)}
                        className={`w-full group flex items-center gap-4 p-5 rounded-2xl border text-left transition-all ${task.is_completed
                            ? 'bg-emerald-50 border-emerald-100/50'
                            : 'bg-white border-slate-100 hover:border-primary/30 hover:shadow-md active:scale-[0.98]'
                            }`}
                    >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 group-hover:border-primary'
                            }`}>
                            {task.is_completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-bold ${task.is_completed ? 'text-emerald-900 line-through opacity-60' : 'text-slate-800'}`}>
                                {task.title}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{task.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </Card>
    )
}
