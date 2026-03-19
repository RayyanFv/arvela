'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteAssessment } from '@/lib/actions/assessments'

export function DeleteAssessmentButton({ id, title }) {
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        if (!confirm(`Yakin ingin menghapus assessment "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return
        
        setIsDeleting(true)
        try {
            await deleteAssessment(id)
        } catch (err) {
            console.error(err)
            alert('Gagal menghapus assessment')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Hapus Assessment"
        >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
    )
}
