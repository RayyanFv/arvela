'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, X } from 'lucide-react'

export function WhatsAppSupportButton() {
    const [enabled, setEnabled] = useState(false)
    const [companyName, setCompanyName] = useState('')
    const [open, setOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        async function fetchSupportState() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
                if (!profile?.company_id) return

                const { data: company } = await supabase
                    .from('companies')
                    .select('name, whatsapp_support_enabled')
                    .eq('id', profile.company_id)
                    .maybeSingle()

                if (company?.whatsapp_support_enabled) {
                    setEnabled(true)
                    setCompanyName(company.name)
                }
            } catch (e) {
                console.error('Failed to fetch WA support state:', e)
            }
        }

        fetchSupportState()
    }, [])

    if (!enabled) return null

    const message = encodeURIComponent(`Halo Tim Support Arvela HRMS, saya butuh bantuan prioritas untuk perusahaan: ${companyName}.`)
    const waUrl = `https://wa.me/6281234567890?text=${message}`

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {open && (
                <div className="mb-3 w-72 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-xs font-black text-emerald-700 flex items-center gap-1.5 uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Support WhatsApp Prioritas
                        </span>
                        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        Halo Admin! Perusahaan Anda memiliki akses **Bantuan Prioritas via WhatsApp**. Tim Customer Success Arvela siap membantu Anda.
                    </p>
                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                    >
                        <MessageSquare className="w-4 h-4 fill-current" /> Chat Tim WA Helpdesk
                    </a>
                </div>
            )}

            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-2xl shadow-emerald-600/30 transition-all hover:scale-110 group border-2 border-white"
                title="Bantuan WhatsApp Prioritas"
            >
                <MessageSquare className="w-6 h-6 fill-current group-hover:rotate-12 transition-transform" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-xs font-black pr-1">
                    WA Support
                </span>
            </button>
        </div>
    )
}
