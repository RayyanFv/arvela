'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { getAuthProfile, assertSameCompany } from '@/lib/actions/auth-helpers'
import { ADMIN_ROLES, ROLES } from '@/lib/constants/roles'
import { sendEmail } from '@/lib/email/resend'
import { getAppliedTemplate, getStageUpdateTemplate, getOfferLetterTemplate } from '@/lib/email/templates'
import { revalidatePath } from 'next/cache'

// ─── Upload CV (public-facing, no company scoping needed) ─────────────────────
export async function uploadCVFile(formData, path) {
    const file = formData.get('file')
    if (!file) return { error: 'No file provided' }

    const supabaseAdmin = createAdminSupabaseClient()

    const { error: uploadError } = await supabaseAdmin.storage
        .from('cvs')
        .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
        return { error: uploadError.message }
    }

    const { data: urlData } = supabaseAdmin.storage.from('cvs').getPublicUrl(path)
    return { url: urlData?.publicUrl }
}

// ─── Update Application Stage (Admin only + company check) ────────────────────
export async function updateStage(id, stage, customMessage = '') {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    // Fetch app and VERIFY it belongs to caller's company
    const { data: app, error: fetchError } = await admin
        .from('applications')
        .select(`full_name, email, company_id, jobs (title), companies (name)`)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .single()

    if (fetchError || !app) throw new Error('Application not found or access denied')

    // Update stage
    const { error: updateError } = await admin
        .from('applications')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('company_id', profile.company_id)

    if (updateError) throw new Error(updateError.message)

    // Send email notification (async, non-blocking)
    if (stage !== 'offering') {
        sendEmail({
            to: app.email,
            subject: `Pembaruan Lamaran: ${app.jobs.title} di ${app.companies.name}`,
            html: getStageUpdateTemplate({
                candidateName: app.full_name,
                jobTitle: app.jobs.title,
                companyName: app.companies.name,
                toStage: stage,
                message: customMessage,
                portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://arvela.id'}/portal/login`
            })
        }).catch(console.error)
    }
}

// ─── Create Offer Letter (Admin only + company check) ─────────────────────────
export async function createOfferLetter({ applicationId, salary, startDate, expiryDate, content }) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    const { data: app, error: fetchError } = await admin
        .from('applications')
        .select(`id, full_name, email, company_id, jobs(title), companies(name)`)
        .eq('id', applicationId)
        .eq('company_id', profile.company_id)
        .single()

    if (fetchError || !app) throw new Error('Application not found or access denied')

    const { data: offer, error: offerError } = await admin
        .from('offer_letters')
        .upsert({
            application_id: applicationId,
            company_id: app.company_id,
            salary,
            start_date: startDate,
            expiry_date: expiryDate,
            content,
            status: 'sent'
        }, { onConflict: 'application_id' })
        .select()
        .single()

    if (offerError) throw new Error(offerError.message)

    await admin.from('applications').update({ stage: 'offering' }).eq('id', applicationId).eq('company_id', profile.company_id)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const offerUrl = `${siteUrl}/portal/offer`

    await sendEmail({
        to: app.email,
        subject: `Offer Letter: ${app.jobs.title} - ${app.companies.name}`,
        html: getOfferLetterTemplate({
            candidateName: app.full_name,
            jobTitle: app.jobs.title,
            companyName: app.companies.name,
            salary: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(salary),
            startDate,
            expiryDate,
            offerUrl
        })
    })

    return { success: true }
}

// ─── Submit Application (public-facing — candidate applies for a job) ─────────
export async function submitApplication(payload) {
    const supabase = createAdminSupabaseClient()

    const { data: newApp, error } = await supabase
        .from('applications')
        .insert(payload)
        .select(`id, full_name, email, jobs (title), companies (name)`)
        .single()

    if (error) {
        if (error.code === '23505') throw new Error('DUPLICATE_APPLY')
        throw new Error(error.message)
    }

    // Auto-register candidate to Supabase Auth
    const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 12) + 'Aa1!'
    const { error: authError } = await supabase.auth.admin.createUser({
        email: payload.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
            full_name: payload.full_name,
            role: 'candidate'
        }
    })
    // Ignore if user already exists

    sendEmail({
        to: newApp.email,
        subject: `Lamaran Diterima: ${newApp.jobs.title} di ${newApp.companies.name}`,
        html: getAppliedTemplate({
            candidateName: newApp.full_name,
            jobTitle: newApp.jobs.title,
            companyName: newApp.companies.name,
            portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/portal`
        })
    }).catch(console.error)

    return { success: true, id: newApp.id }
}

// ─── Update Internal Notes (Admin only + company check) ───────────────────────
export async function updateNotes(id, internal_notes) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    const { error } = await admin
        .from('applications')
        .update({ internal_notes })
        .eq('id', id)
        .eq('company_id', profile.company_id)

    if (error) throw new Error(error.message)
}

// ─── Hire Candidate (Admin only + company check) ──────────────────────────────
export async function hireCandidate({ applicationId, department, jobTitle, templateId }) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    // 1. Get Application — verify company ownership
    const { data: app, error: fetchError } = await admin
        .from('applications')
        .select(`*, jobs(title), companies(name)`)
        .eq('id', applicationId)
        .eq('company_id', profile.company_id)
        .single()
    if (fetchError || !app) throw new Error('Application not found or access denied')

    // 2. Resolve profile
    let { data: candidateProfile } = await admin
        .from('profiles')
        .select('*')
        .eq('email', app.email)
        .single()

    if (!candidateProfile) {
        const { data: authUsers } = await admin.auth.admin.listUsers()
        const existingAuthUser = authUsers?.users?.find(u => u.email === app.email)

        let authUserId
        if (existingAuthUser) {
            authUserId = existingAuthUser.id
        } else {
            const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 12) + 'Aa1!'
            const { data: newAuth, error: createAuthError } = await admin.auth.admin.createUser({
                email: app.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name: app.full_name, role: ROLES.EMPLOYEE }
            })
            if (createAuthError || !newAuth?.user) {
                throw new Error('Gagal membuat akun untuk kandidat: ' + (createAuthError?.message ?? 'Unknown error'))
            }
            authUserId = newAuth.user.id
        }

        await new Promise(r => setTimeout(r, 800))
        const { data: maybeProfile } = await admin.from('profiles').select('*').eq('id', authUserId).single()
        if (!maybeProfile) {
            await admin.from('profiles').upsert({
                id: authUserId,
                email: app.email,
                full_name: app.full_name,
                company_id: app.company_id,
                role: ROLES.EMPLOYEE
            }, { onConflict: 'id' })
            const { data: upserted } = await admin.from('profiles').select('*').eq('id', authUserId).single()
            candidateProfile = upserted
        } else {
            candidateProfile = maybeProfile
        }

        if (!candidateProfile) throw new Error('Gagal mendapatkan profil setelah pembuatan akun.')
    }

    // 3. Update Profile role to employee (ONLY if not already admin)
    const isExistingAdmin = ADMIN_ROLES.includes(candidateProfile.role)

    if (!isExistingAdmin) {
        await admin
            .from('profiles')
            .update({
                role: ROLES.EMPLOYEE,
                company_id: app.company_id,
                department: department || 'General'
            })
            .eq('id', candidateProfile.id)

        await admin.auth.admin.updateUserById(candidateProfile.id, {
            user_metadata: { role: ROLES.EMPLOYEE }
        })
    } else {
        await admin.from('profiles').update({
            company_id: app.company_id,
            department: department || 'General'
        }).eq('id', candidateProfile.id)
    }

    // 4. Update Application Stage to 'hired'
    await admin
        .from('applications')
        .update({ stage: 'hired', updated_at: new Date().toISOString() })
        .eq('id', applicationId)
        .eq('company_id', profile.company_id)

    // 5. Create Employee record
    const { data: employee, error: empError } = await admin
        .from('employees')
        .insert({
            profile_id: candidateProfile.id,
            company_id: app.company_id,
            application_id: applicationId,
            job_title: jobTitle || app.jobs?.title || 'Team Member',
            department: department || 'General',
            status: 'onboarding'
        })
        .select()
        .single()

    if (empError) {
        if (empError.code === '23505') throw new Error('Karyawan ini sudah terdaftar sebelumnya.')
        throw new Error(empError.message)
    }

    // 6. Setup Onboarding
    if (templateId) {
        const { data: templateTasks } = await admin
            .from('onboarding_tasks')
            .select('*')
            .eq('template_id', templateId)

        if (templateTasks?.length > 0) {
            await admin.from('onboarding_progress').insert(
                templateTasks.map(task => ({
                    employee_id: employee.id,
                    task_id: task.id,
                    is_completed: false
                }))
            )
        }
    }

    // 7. Send Welcome Email
    let loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`
    let loginInstruction = `Silakan login menggunakan email Anda untuk memulai proses <strong>Onboarding</strong> dan melihat target <strong>OKR</strong> Anda.`

    try {
        const { data: resetLink } = await admin.auth.admin.generateLink({
            type: 'recovery',
            email: app.email,
            options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password` }
        })
        if (resetLink?.properties?.action_link) {
            loginUrl = resetLink.properties.action_link
            loginInstruction = `Akun baru telah dibuat untuk Anda di platform Arvela. Klik tombol di bawah untuk mengatur password dan mulai proses <strong>Onboarding</strong> Anda.`
        }
    } catch (e) {
        console.warn('Failed to generate recovery link:', e.message)
    }

    sendEmail({
        to: app.email,
        subject: `Selamat Bergabung di ${app.companies.name}!`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                <h1 style="color: #ea580c; margin-top: 0;">Selamat Bergabung!</h1>
                <p>Halo <strong>${app.full_name}</strong>,</p>
                <p>Kami sangat senang mengumumkan bahwa Anda telah resmi diterima bergabung dengan <strong>${app.companies.name}</strong> sebagai <strong>${jobTitle || app.jobs?.title}</strong>.</p>
                <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
                   <p style="margin-top: 0;">${loginInstruction}</p>
                   <p style="margin: 10px 0; font-size: 16px;">
                     Email Login: <strong style="color: #ea580c;">${app.email}</strong>
                   </p>
                </div>
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${loginUrl}" style="background: #111827; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Masuk ke Portal Karyawan</a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; ${new Date().getFullYear()} Arvela HCM System</p>
            </div>
        `
    }).catch(console.error)

    return { success: true }
}

// ─── Cancel Hire (Admin only + company check) ─────────────────────────────────
export async function cancelHire({ applicationId }) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    // Verify application belongs to this company
    const { data: app } = await admin
        .from('applications')
        .select('*, employees(id, profile_id)')
        .eq('id', applicationId)
        .eq('company_id', profile.company_id)
        .single()

    if (!app) throw new Error('Application not found or access denied')
    if (!app.employees?.[0]) throw new Error('Data karyawan tidak ditemukan untuk kandidat ini.')

    const employeeId = app.employees[0].id
    const profileId = app.employees[0].profile_id

    const { error: delError } = await admin.from('employees').delete().eq('id', employeeId)
    if (delError) throw new Error('Gagal menghapus data karyawan: ' + delError.message)

    const { data: empProfile } = await admin.from('profiles').select('role').eq('id', profileId).single()
    const isCurrentlyAdmin = ADMIN_ROLES.includes(empProfile?.role)

    if (!isCurrentlyAdmin) {
        await admin.from('profiles').update({ role: ROLES.USER }).eq('id', profileId)
        await admin.auth.admin.updateUserById(profileId, { user_metadata: { role: ROLES.USER } })
    }

    await admin
        .from('applications')
        .update({ stage: 'offering' })
        .eq('id', applicationId)
        .eq('company_id', profile.company_id)

    revalidatePath(`/dashboard/candidates/${applicationId}`)
    return { success: true }
}

// ─── Generate Magic Link (Admin only) ─────────────────────────────────────────
export async function getMagicLink({ email, type = 'magiclink', redirectTo }) {
    const { admin } = await getAuthProfile({ requireAdmin: true })

    const { data, error } = await admin.auth.admin.generateLink({
        email,
        type,
        options: { redirectTo }
    })

    if (error) throw new Error(error.message)
    return data?.properties?.action_link
}
