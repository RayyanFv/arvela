/**
 * Quota Enforcement Helper for Arvela HRMS Company Subscriptions.
 * Validates company limits before creation of Jobs, Employees, or Assessments.
 */

export async function checkCompanySubscriptionStatus(companyId, supabase) {
    const { data: company, error } = await supabase
        .from('companies')
        .select('subscription_plan, subscription_status, subscription_expires_at')
        .eq('id', companyId)
        .maybeSingle()

    if (error || !company) return

    if (company.subscription_status === 'expired') {
        throw new Error('Masa aktif paket berlangganan perusahaan Anda telah berakhir. Silakan hubungi Super Admin untuk memperbarui lisensi (Paket Arvela Max / Pilot Promo).')
    }

    if (company.subscription_expires_at && new Date(company.subscription_expires_at) < new Date()) {
        throw new Error('Masa berlaku paket lisensi perusahaan Anda telah habis. Silakan perbarui paket ke Arvela Max atau hubungi Super Admin.')
    }
}

export async function checkJobQuota(companyId, supabase) {
    await checkCompanySubscriptionStatus(companyId, supabase)

    const { data: company } = await supabase
        .from('companies')
        .select('job_slots_quota, subscription_plan')
        .eq('id', companyId)
        .maybeSingle()

    const quota = company?.job_slots_quota ?? 15
    if (quota === 999) return // 999 = unlimited (Enterprise)

    const { count: activeJobsCount } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'published')

    if ((activeJobsCount || 0) >= quota) {
        throw new Error(`Batas kuota lowongan kerja aktif (${activeJobsCount}/${quota}) untuk paket '${company?.subscription_plan || 'Pilot Promo'}' telah tercapai. Silakan tingkatkan ke paket Arvela Max (30 Slot Loker) atau hubungi Super Admin.`)
    }
}

export async function checkEmployeeQuota(companyId, supabase, additionalCount = 1) {
    await checkCompanySubscriptionStatus(companyId, supabase)

    const { data: company } = await supabase
        .from('companies')
        .select('employee_quota, subscription_plan')
        .eq('id', companyId)
        .maybeSingle()

    const quota = company?.employee_quota ?? 50
    if (quota === 999) return // 999 = unlimited

    const { count: currentEmpCount } = await supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active')

    const totalAfter = (currentEmpCount || 0) + additionalCount
    if (totalAfter > quota) {
        throw new Error(`Batas kuota staf terdaftar (${currentEmpCount}/${quota}) untuk paket '${company?.subscription_plan || 'Pilot Promo'}' tidak mencukupi untuk menambah ${additionalCount} karyawan baru. Silakan tingkatkan ke paket Arvela Max atau hubungi Super Admin.`)
    }
}

export async function checkAssessmentQuota(companyId, supabase) {
    await checkCompanySubscriptionStatus(companyId, supabase)

    const { data: company } = await supabase
        .from('companies')
        .select('assessment_slots_quota, subscription_plan')
        .eq('id', companyId)
        .maybeSingle()

    const quota = company?.assessment_slots_quota ?? 15
    if (quota === 999) return // 999 = unlimited

    const { count: currentAssessmentsCount } = await supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)

    if ((currentAssessmentsCount || 0) >= quota) {
        throw new Error(`Batas kuota modul asesmen (${currentAssessmentsCount}/${quota}) untuk paket '${company?.subscription_plan || 'Pilot Promo'}' telah tercapai. Silakan tingkatkan paket berlangganan ke Arvela Max atau hubungi Super Admin.`)
    }
}
