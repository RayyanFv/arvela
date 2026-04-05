'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

export function ShareButton() {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        const url = window.location.href
        if (navigator.share) {
            try {
                await navigator.share({
                    title: document.title,
                    url: url
                })
            } catch (err) {
                console.error('Share failed:', err)
            }
        } else {
            // Fallback copy to clipboard
            navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Link Tersalin!' : 'Share Artikel'}
        </button>
    )
}
