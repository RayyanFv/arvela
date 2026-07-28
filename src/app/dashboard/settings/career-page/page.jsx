import { redirect } from 'next/navigation'
import { getEffectiveProfileServer } from '@/lib/actions/impersonate'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { ROLES } from '@/lib/constants/roles'
import { PageHeader } from '@/components/layout/PageHeader'
import CareerPageForm from './CareerPageForm'

export const metadata = { title: 'Halaman Karir — Arvela HR' }

const ALLOWED_ROLES = [ROLES.HR_ADMIN, ROLES.OWNER, ROLES.SUPER_ADMIN]

export default async function CareerPageSettingsPage() {
    const res = await getEffectiveProfileServer()
    if (!res?.user) redirect('/login')
    const profile = res.profile
    if (!profile) redirect('/login')
    if (!ALLOWED_ROLES.includes(profile.role)) redirect('/dashboard')

    const supabase = createAdminSupabaseClient()
    const { data: company } = await supabase
        .from('companies')
        .select('id, slug, name, logo_url, tagline, description, banner_url, culture_points, gallery_urls')
        .eq('id', profile.company_id)
        .single()

    if (!company) redirect('/dashboard')

    return (
        <div className="space-y-6 pb-20">
            <PageHeader
                title="Halaman Karir"
                description="Atur tampilan halaman karir publik perusahaan Anda — banner, tagline, deskripsi, budaya kerja, dan galeri foto."
            />
            <CareerPageForm company={company} />
        </div>
    )
}
