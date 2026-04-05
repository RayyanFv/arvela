import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { CompanyForm } from '../../CompanyForm'
import { redirect } from 'next/navigation'

export default async function EditCompanyPage({ params }) {
    const { id } = await params
    const supabase = createAdminSupabaseClient()

    const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !company) {
        redirect('/dashboard/companies')
    }

    return (
        <div className="pb-20">
            <CompanyForm initialData={company} />
        </div>
    )
}
