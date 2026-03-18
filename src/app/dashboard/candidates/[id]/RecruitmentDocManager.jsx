'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Download, Loader2, Trash2, ExternalLink } from 'lucide-react'
import { uploadRecruitmentDocument } from '@/lib/actions/applications'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export default function RecruitmentDocManager({ applicationId, initialDocs = [] }) {
    const [docs, setDocs] = useState(initialDocs)
    const [uploading, setUploading] = useState(false)

    async function handleUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('applicationId', applicationId)
        formData.append('documentType', 'pkwt') // Default atau biarkan user pilih

        try {
            const res = await uploadRecruitmentDocument(formData)
            if (res.success) {
                setDocs([res.data, ...docs])
            }
        } catch (err) {
            alert('Gagal mengunggah dokumen: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-4">
             <div className="relative group overflow-hidden">
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleUpload}
                    disabled={uploading}
                    accept=".pdf,.doc,.docx"
                />
                <Button 
                    variant="outline" 
                    className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 h-10 rounded-xl text-xs font-bold border-dashed border-2"
                    disabled={uploading}
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {uploading ? 'Sedang mengunggah...' : 'Unggah Dokumen PKWT / PKWTT'}
                </Button>
            </div>

            {docs.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Daftar Dokumen Cadangan</p>
                    {docs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200 rounded-xl group hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-500 shadow-sm transition-transform group-hover:scale-110">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-700 uppercase tracking-tight truncate">
                                        {doc.document_type}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-medium">
                                        {format(new Date(doc.created_at), 'd MMM yyyy, HH:mm', { locale: localeID })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
