import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { ArticleForm } from '../../ArticleForm'
import { redirect } from 'next/navigation'

export default async function EditArticlePage({ params }) {
    const { id } = await params
    const supabase = createAdminSupabaseClient()

    const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !article) {
        redirect('/dashboard/articles')
    }

    return (
        <div className="pb-20">
            <ArticleForm initialData={article} />
        </div>
    )
}
