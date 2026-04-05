'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAuthProfile } from '@/lib/actions/auth-helpers'

async function getSuperAdminProfile() {
    const { profile, admin } = await getAuthProfile({ allowedRoles: ['super_admin'] })
    return { profile, supabase: admin }
}

function generateSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)
}

export async function createArticle(formData) {
    const { profile, supabase } = await getSuperAdminProfile()

    const title = formData.get('title')
    const content = formData.get('content')
    const category = formData.get('category')
    const author_name = formData.get('author_name')
    const meta_title = formData.get('meta_title')
    const meta_description = formData.get('meta_description')
    const keywords = formData.get('keywords') ? formData.get('keywords').split(',').map(k => k.trim()) : []
    const status = formData.get('status') || 'draft'
    const slug = formData.get('slug') || generateSlug(title)

    const payload = {
        title,
        slug,
        category,
        author_name,
        content,
        meta_title,
        meta_description,
        keywords,
        status,
        author_id: profile.id,
        published_at: status === 'published' ? new Date().toISOString() : null,
    }

    const { data: article, error } = await supabase
        .from('articles')
        .insert(payload)
        .select('id')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/articles')
    redirect('/dashboard/articles')
}

export async function updateArticle(articleId, formData) {
    const { profile, supabase } = await getSuperAdminProfile()

    const title = formData.get('title')
    const content = formData.get('content')
    const category = formData.get('category')
    const author_name = formData.get('author_name')
    const meta_title = formData.get('meta_title')
    const meta_description = formData.get('meta_description')
    const keywords = formData.get('keywords') ? formData.get('keywords').split(',').map(k => k.trim()) : []
    const status = formData.get('status')
    const slug = formData.get('slug')

    const { data: existing } = await supabase
        .from('articles')
        .select('status, published_at')
        .eq('id', articleId)
        .single()
    
    if (!existing) throw new Error('Article not found')

    const payload = {
        title,
        slug,
        category,
        author_name,
        content,
        meta_title,
        meta_description,
        keywords,
        status,
    }

    if (status === 'published' && !existing.published_at) {
        payload.published_at = new Date().toISOString()
    }

    const { error } = await supabase
        .from('articles')
        .update(payload)
        .eq('id', articleId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/articles')
    redirect('/dashboard/articles')
}

export async function deleteArticle(articleId) {
    const { supabase } = await getSuperAdminProfile()

    const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/articles')
}
