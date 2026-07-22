'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/server'

/**
 * Bulk upsert employees from parsed import data with strict reference validation.
 *
 * @param {Array} rows - Parsed rows from the uploaded Excel file
 * @param {string} companyId - The company UUID of the HR admin performing the import
 */
export async function bulkImportEmployees(rows, companyId) {
    const supabase = createAdminSupabaseClient()
    const succeeded = []
    const failed = []

    let rowIdx = 1
    for (const row of rows) {
        rowIdx++
        try {
            const { full_name, email, job_title, joined_at, department, phone, manager_email, status, pangkat, grade } = row

            if (!full_name?.trim() || !email?.trim()) {
                throw new Error(`Baris ${rowIdx}: Nama lengkap dan email wajib diisi.`)
            }

            // ── Step 1: Strict Validation & Resolution of Manager ─────────────
            let manager_id = null
            if (manager_email?.trim()) {
                const { data: managerProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', manager_email.trim())
                    .eq('company_id', companyId)
                    .maybeSingle()

                if (!managerProfile) {
                    throw new Error(`Baris ${rowIdx}: Email Atasan '${manager_email}' tidak ditemukan di database referensi perusahaan.`)
                }
                manager_id = managerProfile.id
            }

            // ── Step 2: Strict Validation & Resolution of Department ────────────
            let department_id = null
            if (department?.trim()) {
                const { data: dept } = await supabase
                    .from('departments')
                    .select('id')
                    .eq('company_id', companyId)
                    .ilike('name', department.trim())
                    .maybeSingle()

                if (!dept) {
                    throw new Error(`Baris ${rowIdx}: Unit Kerja '${department}' tidak ditemukan di Master Data Referensi Perusahaan. Silakan periksa Tab Referensi.`)
                }
                department_id = dept.id
            }

            // ── Step 3: Resolve Job Position ──────────────────────────────────
            let job_position_id = null
            if (job_title?.trim()) {
                const { data: pos } = await supabase
                    .from('job_positions')
                    .upsert({ company_id: companyId, name: job_title.trim() }, { onConflict: 'company_id,name' })
                    .select('id')
                    .single()
                job_position_id = pos?.id || null
            }

            // ── Step 4: Strict Validation & Resolution of Job Grade ──────────
            let job_grade_id = null
            const gradeName = pangkat || grade
            if (gradeName?.trim()) {
                const { data: gr } = await supabase
                    .from('job_grades')
                    .select('id')
                    .eq('company_id', companyId)
                    .ilike('name', gradeName.trim())
                    .maybeSingle()

                if (!gr) {
                    throw new Error(`Baris ${rowIdx}: Pangkat '${gradeName}' tidak ditemukan di Master Data Referensi Perusahaan. Silakan periksa Tab Referensi.`)
                }
                job_grade_id = gr.id
            }

            // ── Step 5: Check existing profile ─────────────────────────────
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email.trim())
                .eq('company_id', companyId)
                .maybeSingle()

            let profileId = existingProfile?.id

            if (!profileId) {
                // Step 6a: New user invite
                const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
                    email.trim(),
                    {
                        data: {
                            full_name: full_name.trim(),
                            company_id: companyId,
                            role: 'employee',
                        }
                    }
                )
                if (inviteError) throw new Error(`Baris ${rowIdx}: Gagal mengundang user: ${inviteError.message}`)
                profileId = inviteData.user.id

                await supabase.from('profiles').upsert({
                    id: profileId,
                    company_id: companyId,
                    full_name: full_name.trim(),
                    email: email.trim(),
                    phone: phone?.trim() || null,
                    role: 'employee',
                }, { onConflict: 'id' })
            } else {
                await supabase.from('profiles').update({
                    full_name: full_name.trim(),
                    phone: phone?.trim() || null,
                }).eq('id', profileId)
            }

            // Step 7: Upsert employee record
            const { error: empError } = await supabase.from('employees').upsert({
                profile_id: profileId,
                company_id: companyId,
                job_title: job_title?.trim() || null,
                department: department?.trim() || null,
                department_id,
                home_unit_id: department_id,
                work_unit_id: department_id,
                job_grade_id,
                job_position_id,
                manager_id,
                joined_at: joined_at || new Date().toISOString(),
                status: status?.trim() || 'active',
            }, { onConflict: 'profile_id,company_id' })

            if (empError) throw new Error(`Baris ${rowIdx}: Gagal menyimpan data karyawan: ${empError.message}`)

            succeeded.push({ email, full_name, action: existingProfile ? 'updated' : 'created' })
        } catch (err) {
            failed.push({ email: row.email, full_name: row.full_name, error: err.message })
        }
    }

    return { succeeded, failed }
}
