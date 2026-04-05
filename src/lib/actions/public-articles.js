'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateArticleMetric(articleId, metric, action = 'increment') {
    if (!['likes', 'dislikes'].includes(metric)) throw new Error('Invalid metric')
    if (!['increment', 'decrement'].includes(action)) throw new Error('Invalid action')
    
    const supabase = createAdminSupabaseClient()
    
    // Fetch current metric
    const { data: article } = await supabase.from('articles').select(metric).eq('id', articleId).single()
    if (!article) return { success: false }

    const change = action === 'increment' ? 1 : -1
    const newValue = Math.max(0, (article[metric] || 0) + change)
    
    await supabase.from('articles').update({ [metric]: newValue }).eq('id', articleId)
    
    return { success: true, newValue }
}
