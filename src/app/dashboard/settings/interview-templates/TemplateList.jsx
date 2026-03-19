'use client'

import { useState } from 'react'
import { ClipboardCheck, Trash2, Edit2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { deleteInterviewTemplate } from '@/lib/actions/interviews'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export default function TemplateList({ initialTemplates }) {
    const [templates, setTemplates] = useState(initialTemplates)

    async function handleDelete(id) {
        if (!confirm('Hapus template ini?')) return
        try {
            await deleteInterviewTemplate(id)
            setTemplates(templates.filter(t => t.id !== id))
        } catch (err) {
            alert(err.message)
        }
    }

    if (templates.length === 0) {
        return (
            <div className="bg-white border-2 border-dashed border-slate-100 rounded-[40px] p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                    <ClipboardCheck className="w-10 h-10" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">Belum Ada Template</h3>
                    <p className="text-slate-400 font-medium">Buat template pertanyaan pertamamu untuk memulai.</p>
                </div>
                <Link href="/dashboard/settings/interview-templates/new" className="inline-block mt-4">
                    <Button variant="outline" className="border-slate-200 text-slate-500 rounded-xl h-10 px-6 font-bold hover:bg-slate-50">
                        Klik untuk Memulai
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
                <div 
                    key={template.id} 
                    className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -translate-y-12 translate-x-12 group-hover:bg-primary/5 transition-colors" />
                    
                    <div className="space-y-6 relative">
                        <div className="flex items-start justify-between">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/10 transition-all">
                                <ClipboardCheck className="w-7 h-7" />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/dashboard/settings/interview-templates/${template.id}`}>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                </Link>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDelete(template.id)}
                                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{template.title}</h3>
                            <p className="text-sm text-slate-500 font-medium">Memiliki {template.questions?.length || 0} daftar pertanyaan standar.</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pt-2">
                                Dibuat {format(new Date(template.created_at), 'd MMMM yyyy', { locale: localeID })}
                            </p>
                        </div>

                        <Link href={`/dashboard/settings/interview-templates/${template.id}`} className="block pt-2">
                            <Button className="w-full bg-slate-950 text-white rounded-2xl h-12 font-bold group-hover:bg-primary transition-all">
                                Atur Pertanyaan <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    )
}
