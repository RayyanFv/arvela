'use server'

import { revalidatePath } from 'next/cache'
import { getAuthProfile } from '@/lib/actions/auth-helpers'
import { ROLES } from '@/lib/constants/roles'

const CAREER_PAGE_ROLES = [ROLES.HR_ADMIN, ROLES.OWNER, ROLES.SUPER_ADMIN]
const MAX_BANNER_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_BANNER_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_GALLERY_IMAGES = 6
const MAX_CULTURE_POINTS = 6

/**
 * Update the career page profile fields (tagline, description) for the
 * caller's own company. Scoped by company_id from the authenticated profile —
 * never accepts a company id from the client.
 */
export async function updateCareerPageProfile(formData) {
    const { profile, admin } = await getAuthProfile({ allowedRoles: CAREER_PAGE_ROLES })

    const tagline = formData.get('tagline')?.toString().trim() || null
    const description = formData.get('description')?.toString().trim() || null

    const { error } = await admin
        .from('companies')
        .update({ tagline, description })
        .eq('id', profile.company_id)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/settings/career-page')
    revalidatePath('/[company-slug]', 'page')
    return { success: true }
}

/**
 * Upload a banner image for the caller's own company career page.
 * Validates type/size before hitting storage, then saves the public URL
 * to companies.banner_url scoped to the caller's company.
 */
export async function uploadCompanyBanner(formData) {
    const { profile, admin } = await getAuthProfile({ allowedRoles: CAREER_PAGE_ROLES })

    const file = formData.get('file')
    if (!file || typeof file === 'string') throw new Error('Tidak ada file yang diunggah.')
    if (!ALLOWED_BANNER_TYPES.includes(file.type)) {
        throw new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.')
    }
    if (file.size > MAX_BANNER_SIZE) {
        throw new Error('Ukuran file maksimal 5MB.')
    }

    const fileExt = file.name.split('.').pop()
    const path = `${profile.company_id}/banner_${Date.now()}.${fileExt}`

    const { error: uploadError } = await admin.storage
        .from('company-banners')
        .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = admin.storage.from('company-banners').getPublicUrl(path)

    const { error: dbError } = await admin
        .from('companies')
        .update({ banner_url: publicUrl })
        .eq('id', profile.company_id)

    if (dbError) throw new Error(dbError.message)

    revalidatePath('/dashboard/settings/career-page')
    revalidatePath('/[company-slug]', 'page')
    return { success: true, url: publicUrl }
}

/**
 * Replace the caller's company work-culture points (title + description list).
 * Accepts a JSON-encoded array via formData, validated and capped server-side.
 */
export async function updateCulturePoints(formData) {
    const { profile, admin } = await getAuthProfile({ allowedRoles: CAREER_PAGE_ROLES })

    let points
    try {
        points = JSON.parse(formData.get('points')?.toString() || '[]')
    } catch {
        throw new Error('Data tidak valid.')
    }

    if (!Array.isArray(points)) throw new Error('Data tidak valid.')

    const cleaned = points
        .map(p => ({
            title: (p?.title || '').toString().trim().slice(0, 60),
            description: (p?.description || '').toString().trim().slice(0, 200),
        }))
        .filter(p => p.title.length > 0)
        .slice(0, MAX_CULTURE_POINTS)

    const { error } = await admin
        .from('companies')
        .update({ culture_points: cleaned })
        .eq('id', profile.company_id)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/settings/career-page')
    revalidatePath('/[company-slug]', 'page')
    return { success: true, points: cleaned }
}

/**
 * Upload one gallery image for the caller's company. Enforces a max of
 * MAX_GALLERY_IMAGES by checking the current stored count before upload.
 */
export async function uploadGalleryImage(formData) {
    const { profile, admin } = await getAuthProfile({ allowedRoles: CAREER_PAGE_ROLES })

    const file = formData.get('file')
    if (!file || typeof file === 'string') throw new Error('Tidak ada file yang diunggah.')
    if (!ALLOWED_BANNER_TYPES.includes(file.type)) {
        throw new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.')
    }
    if (file.size > MAX_BANNER_SIZE) {
        throw new Error('Ukuran file maksimal 5MB.')
    }

    const { data: company, error: fetchError } = await admin
        .from('companies')
        .select('gallery_urls')
        .eq('id', profile.company_id)
        .single()

    if (fetchError) throw new Error(fetchError.message)

    const existing = Array.isArray(company?.gallery_urls) ? company.gallery_urls : []
    if (existing.length >= MAX_GALLERY_IMAGES) {
        throw new Error(`Maksimal ${MAX_GALLERY_IMAGES} foto galeri.`)
    }

    const fileExt = file.name.split('.').pop()
    const path = `${profile.company_id}/gallery_${Date.now()}.${fileExt}`

    const { error: uploadError } = await admin.storage
        .from('company-gallery')
        .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = admin.storage.from('company-gallery').getPublicUrl(path)
    const updated = [...existing, publicUrl]

    const { error: dbError } = await admin
        .from('companies')
        .update({ gallery_urls: updated })
        .eq('id', profile.company_id)

    if (dbError) throw new Error(dbError.message)

    revalidatePath('/dashboard/settings/career-page')
    revalidatePath('/[company-slug]', 'page')
    return { success: true, gallery: updated }
}

/**
 * Remove one gallery image (by URL) from the caller's company.
 * Storage object is best-effort deleted; the DB array update is authoritative.
 */
export async function removeGalleryImage(imageUrl) {
    const { profile, admin } = await getAuthProfile({ allowedRoles: CAREER_PAGE_ROLES })

    const { data: company, error: fetchError } = await admin
        .from('companies')
        .select('gallery_urls')
        .eq('id', profile.company_id)
        .single()

    if (fetchError) throw new Error(fetchError.message)

    const existing = Array.isArray(company?.gallery_urls) ? company.gallery_urls : []
    const updated = existing.filter(url => url !== imageUrl)

    const { error: dbError } = await admin
        .from('companies')
        .update({ gallery_urls: updated })
        .eq('id', profile.company_id)

    if (dbError) throw new Error(dbError.message)

    // Best-effort storage cleanup — path is derivable from the public URL suffix.
    const pathMatch = imageUrl.match(/company-gallery\/(.+)$/)
    if (pathMatch) {
        await admin.storage.from('company-gallery').remove([pathMatch[1]])
    }

    revalidatePath('/dashboard/settings/career-page')
    revalidatePath('/[company-slug]', 'page')
    return { success: true, gallery: updated }
}
