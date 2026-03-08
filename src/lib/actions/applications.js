'use server'

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { getAppliedTemplate, getStageUpdateTemplate, getOfferLetterTemplate } from '@/lib/email/templates'
import { revalidatePath } from 'next/cache'

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

export async function updateStage(id, stage, customMessage = '') {
    const supabase = createAdminSupabaseClient()

    // 1. Ambil data kandidat & job dulu untuk email
    const { data: app, error: fetchError } = await supabase
        .from('applications')
        .select(`
            full_name, 
            email, 
            jobs (title), 
            companies (name)
        `)
        .eq('id', id)
        .single()

    if (fetchError) throw new Error(fetchError.message)

    // 2. Update stage
    const { error: updateError } = await supabase
        .from('applications')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (updateError) throw new Error(updateError.message)

    // 3. Kirim email notifikasi (async)
    // Jika stage adalah 'offering', kita biarkan UI yang memanggil createOfferLetter secara terpisah
    // atau di sini kita hanya kirim email update jika stage BUKAN offering
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

export async function createOfferLetter({ applicationId, salary, startDate, expiryDate, content }) {
    const supabase = createAdminSupabaseClient()

    // 1. Get Application & Company info
    const { data: app, error: fetchError } = await supabase
        .from('applications')
        .select(`
            id, full_name, email, 
            company_id, 
            jobs(title), 
            companies(name)
        `)
        .eq('id', applicationId)
        .single()

    if (fetchError) throw new Error(fetchError.message)

    // 2. Insert into offer_letters
    const { data: offer, error: offerError } = await supabase
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

    // 3. Update main application stage to 'offering' just in case
    await supabase.from('applications').update({ stage: 'offering' }).eq('id', applicationId)

    // 4. Send Offer Email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const offerUrl = `${siteUrl}/portal/offer` // Update with actual route later

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

export async function submitApplication(payload) {
    const supabase = createAdminSupabaseClient()

    const { data: newApp, error } = await supabase
        .from('applications')
        .insert(payload)
        .select(`
            id, 
            full_name, 
            email, 
            jobs (title), 
            companies (name)
        `)
        .single()

    if (error) {
        if (error.code === '23505') {
            throw new Error('DUPLICATE_APPLY')
        }
        throw new Error(error.message)
    }

    // 2. Auto-Register ke Supabase Auth secara diam-diam (Admin API)
    // Gunakan password default agar user punya 'credential' awal
    const defaultPassword = 'ArvelaCandidate123!'
    const { error: authError } = await supabase.auth.admin.createUser({
        email: payload.email,
        password: defaultPassword,
        email_confirm: true, // Langsung aktifkan tanpa verifikasi email lagi
        user_metadata: {
            full_name: payload.full_name,
            role: 'candidate'
        }
    })

    // Jika error karena user sudah ada (23505 atau sejenis), kita abaikan saja
    // Jika user sudah ada, mereka tetap bisa login dengan password lama/OTP mereka

    // 3. Kirim email konfirmasi lamaran diterima + info akses portal
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


export async function updateNotes(id, internal_notes) {
    const supabase = createAdminSupabaseClient()
    const { error } = await supabase
        .from('applications')
        .update({ internal_notes })
        .eq('id', id)

    if (error) throw new Error(error.message)
}

/**
 * Hire a candidate: transition from application to employee
 */
export async function hireCandidate({ applicationId, department, jobTitle, templateId }) {
    const supabase = createAdminSupabaseClient()

    // 1. Get Application details
    const { data: app, error: fetchError } = await supabase
        .from('applications')
        .select(`
            *,
            jobs(title),
            companies(name)
        `)
        .eq('id', applicationId)
        .single()
    if (fetchError) throw new Error(fetchError.message)

    // 2. Resolve profile — 3 possible paths:
    //    (a) profile exists → use it
    //    (b) auth user exists but trigger didn't create profile → sync manually
    //    (c) completely new → createUser
    let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', app.email)
        .single()

    if (!profile) {
        // Try to find if auth user already exists (candidate registered before)
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        const existingAuthUser = authUsers?.users?.find(u => u.email === app.email)

        let authUserId
        if (existingAuthUser) {
            // Auth user exists but profile row is missing — create it
            authUserId = existingAuthUser.id
        } else {
            // Completely new user — create auth account
            const tempPassword = Math.random().toString(36).slice(2, 10) + 'Aa1!'
            const { data: newAuth, error: createAuthError } = await supabase.auth.admin.createUser({
                email: app.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name: app.full_name, role: 'employee' }
            })
            if (createAuthError || !newAuth?.user) {
                throw new Error('Gagal membuat akun untuk kandidat: ' + (createAuthError?.message ?? 'Unknown error'))
            }
            authUserId = newAuth.user.id
        }

        // Wait for DB trigger, then fetch or insert profile manually
        await new Promise(r => setTimeout(r, 800))
        const { data: maybeProfile } = await supabase.from('profiles').select('*').eq('id', authUserId).single()
        if (!maybeProfile) {
            await supabase.from('profiles').upsert({
                id: authUserId,
                email: app.email,
                full_name: app.full_name,
                company_id: app.company_id,
                role: 'employee'
            }, { onConflict: 'id' })
            const { data: upserted } = await supabase.from('profiles').select('*').eq('id', authUserId).single()
            profile = upserted
        } else {
            profile = maybeProfile
        }

        if (!profile) throw new Error('Gagal mendapatkan profil setelah pembuatan akun.')
    }

    // 3. Update Profile role to employee (ONLY if not already admin)
    const adminRoles = ['hr', 'super_admin', 'hiring_manager', 'boss']
    const isExistingAdmin = adminRoles.includes(profile.role)

    if (!isExistingAdmin) {
        const { error: roleUpdateError } = await supabase
            .from('profiles')
            .update({
                role: 'employee',
                company_id: app.company_id,
                department: department || 'General'
            })
            .eq('id', profile.id)
        if (roleUpdateError) throw new Error(roleUpdateError.message)

        // Sync to auth metadata for middleware (ONLY if not admin)
        await supabase.auth.admin.updateUserById(profile.id, {
            user_metadata: { role: 'employee' }
        })
    } else {
        // Just update department/company if needed, but keep role
        await supabase.from('profiles').update({
            company_id: app.company_id,
            department: department || 'General'
        }).eq('id', profile.id)
    }

    // 4. Update Application Stage to 'hired'
    const { error: stageError } = await supabase
        .from('applications')
        .update({ stage: 'hired', updated_at: new Date().toISOString() })
        .eq('id', applicationId)
    if (stageError) throw new Error(stageError.message)

    // 5. Create Employee record
    const { data: employee, error: empError } = await supabase
        .from('employees')
        .insert({
            profile_id: profile.id,
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
        // Copy tasks from template
        const { data: templateTasks } = await supabase
            .from('onboarding_tasks')
            .select('*')
            .eq('template_id', templateId)

        if (templateTasks?.length > 0) {
            await supabase.from('onboarding_progress').insert(
                templateTasks.map(task => ({
                    employee_id: employee.id,
                    task_id: task.id,
                    is_completed: false
                }))
            )
        }
    } else {
        // Create manual/legacy tasks if needed or skip
        // For now, if no template, we might want a "Generic" template handled in UI
    }

    // 7. Send Welcome Email
    let loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`
    let loginInstruction = `Silakan login menggunakan email Anda untuk memulai proses <strong>Onboarding</strong> dan melihat target <strong>OKR</strong> Anda.`

    try {
        const { data: resetLink } = await supabase.auth.admin.generateLink({
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

/**
 * Undo Hiring: Remove employee record and revert stage
 */
export async function cancelHire({ applicationId }) {
    const supabase = createAdminSupabaseClient()

    // 1. Get Employee & Application
    const { data: app } = await supabase.from('applications').select('*, employees(id, profile_id)').eq('id', applicationId).single()
    if (!app || !app.employees?.[0]) throw new Error('Data karyawan tidak ditemukan untuk kandidat ini.')

    const employeeId = app.employees[0].id
    const profileId = app.employees[0].profile_id

    // 2. Delete Employee (Cascades to onboarding_progress & okrs)
    const { error: delError } = await supabase.from('employees').delete().eq('id', employeeId)
    if (delError) throw new Error('Gagal menghapus data karyawan: ' + delError.message)

    // 3. Reset Profile role back to user (ONLY if they were previously an employee)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', profileId).single()
    const adminRoles = ['hr', 'super_admin', 'hiring_manager', 'boss']
    const isCurrentlyAdmin = adminRoles.includes(profile?.role)

    if (!isCurrentlyAdmin) {
        await supabase.from('profiles').update({ role: 'user' }).eq('id', profileId)
        await supabase.auth.admin.updateUserById(profileId, { user_metadata: { role: 'user' } })
    }

    // 4. Update Application Stage back to 'offering'
    const { error: stageError } = await supabase.from('applications').update({ stage: 'offering' }).eq('id', applicationId)
    if (stageError) throw new Error('Gagal mengembalikan status kandidat: ' + stageError.message)

    revalidatePath(`/dashboard/candidates/${applicationId}`)
    return { success: true }
}

/**
 * Generate a magic link or recovery link for a user
 */
export async function getMagicLink({ email, type = 'magiclink', redirectTo }) {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase.auth.admin.generateLink({
        email,
        type,
        options: { redirectTo }
    })

    if (error) throw new Error(error.message)
    return data?.properties?.action_link
}
