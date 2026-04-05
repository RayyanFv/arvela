'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { updateArticleMetric } from '@/lib/actions/public-articles'

export function LikeDislikeButtons({ articleId, initialLikes = 0, initialDislikes = 0 }) {
    const [likes, setLikes] = useState(initialLikes)
    const [dislikes, setDislikes] = useState(initialDislikes)
    const [voted, setVoted] = useState(null) // 'likes' | 'dislikes' | null
    const [isPending, setIsPending] = useState(false)

    const handleVote = async (type) => {
        if (isPending) return
        setIsPending(true)

        const isUndo = voted === type
        const isSwap = voted && voted !== type

        // Optimistic UI Update
        if (isUndo) {
            if (type === 'likes') setLikes(l => l - 1)
            if (type === 'dislikes') setDislikes(d => d - 1)
            setVoted(null)
        } else {
            if (isSwap) {
                if (voted === 'likes') setLikes(l => l - 1)
                if (voted === 'dislikes') setDislikes(d => d - 1)
            }
            if (type === 'likes') setLikes(l => l + 1)
            if (type === 'dislikes') setDislikes(d => d + 1)
            setVoted(type)
        }

        try {
            if (isUndo) {
                await updateArticleMetric(articleId, type, 'decrement')
            } else {
                if (isSwap) {
                    await updateArticleMetric(articleId, voted, 'decrement')
                }
                await updateArticleMetric(articleId, type, 'increment')
            }
        } catch (error) {
            console.error('Failed to vote', error)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button 
                onClick={() => handleVote('likes')}
                disabled={isPending}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                    voted === 'likes' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
            >
                <ThumbsUp className={`w-4 h-4 ${voted === 'likes' ? 'fill-emerald-200' : ''}`} />
                {likes}
            </button>
            <button 
                onClick={() => handleVote('dislikes')}
                disabled={isPending}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                    voted === 'dislikes' ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title="Kurang Suka"
            >
                <ThumbsDown className={`w-4 h-4 ${voted === 'dislikes' ? 'fill-rose-200' : ''}`} />
            </button>
        </div>
    )
}
