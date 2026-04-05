'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAuthProfile } from '@/lib/actions/auth-helpers'

async function getSuperAdminProfile() {
    const { profile, admin } = await getAuthProfile({ allowedRoles: ['super_admin'] })
    return { profile, supabase: admin }
}

function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

export async function createCompany(formData) {
    const { profile, supabase } = await getSuperAdminProfile()

    const name = formData.get('name')
    let slug = formData.get('slug')
    const industry = formData.get('industry')
    const size = formData.get('size')
    const website = formData.get('website')
    const logo_url = formData.get('logo_url')

    if (!slug) {
        slug = generateSlug(name)
    }

    const payload = {
        name,
        slug,
        industry,
        size,
        website,
        logo_url
    }

    const { data: company, error } = await supabase
        .from('companies')
        .insert(payload)
        .select('id')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/companies')
    redirect('/dashboard/companies')
}

export async function updateCompany(companyId, formData) {
    const { profile, supabase } = await getSuperAdminProfile()

    const name = formData.get('name')
    const slug = formData.get('slug')
    const industry = formData.get('industry')
    const size = formData.get('size')
    const website = formData.get('website')
    const logo_url = formData.get('logo_url')

    const payload = {
        name,
        slug,
        industry,
        size,
        website,
        logo_url
    }

    const { error } = await supabase
        .from('companies')
        .update(payload)
        .eq('id', companyId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/companies')
    redirect('/dashboard/companies')
}

export async function deleteCompany(companyId) {
    const { supabase } = await getSuperAdminProfile()

    const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/companies')
}
