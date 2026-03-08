'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Loader2 } from 'lucide-react'
import { getMagicLink } from '@/lib/actions/applications'

export default function CopyPortalLinkButton({ email }) {
    const [loading, setLoading] = useState(false)

    async function handleCopy() {
        setLoading(true)
        try {
            const link = await getMagicLink({
                email,
                type: 'magiclink',
                redirectTo: `${window.location.origin}/portal`
            })
            if (link) {
                await navigator.clipboard.writeText(link)
                alert('Link Portal Kandidat disalin! Anda bisa mengirimkannya via WhatsApp.')
            }
        } catch (err) {
            alert('Gagal membuat link: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            className="w-full rounded-2xl h-12 border-slate-200 font-bold text-slate-600 hover:text-primary hover:border-primary/20 gap-2"
            onClick={handleCopy}
            disabled={loading}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Link Portal Kandidat
        </Button>
    )
}
