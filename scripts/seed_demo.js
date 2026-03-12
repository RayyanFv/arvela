const fs = require('fs');
const path = require('path');

// Basic .env parser
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split(/\r?\n/).forEach(line => {
            const match = line.match(/^([^#=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let val = match[2].trim();
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                process.env[key] = val;
            }
        });
    }
} catch (e) {
    console.warn('Gagal membaca .env', e.message);
}

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
    console.log('🌱 Memulai Seeder Lengkap untuk Alur Bisnis (Recruitment, HR, LMS)...');

    // --- HELPER UNTUK PERUSAHAAN ---
    async function createCompany(name, slug, desc) {
        const { data: existing } = await supabase.from('companies').select('*').eq('slug', slug).single();
        if (existing) return existing;

        const { data, error } = await supabase.from('companies').insert({
            name, slug, description: desc, website: `https://${slug}.arvela.demo`,
            office_lat: -6.1751, office_lng: 106.8272, office_radius_meters: 100
        }).select().single();
        
        if (error) console.error(`Error create company ${name}:`, error);
        return data;
    }

    // --- HELPER UNTUK USER & PROFILE ---
    async function createUser(email, name, role, dept, companyId) {
        const { data: exist } = await supabase.from('profiles').select('id').eq('email', email).single();
        if (exist) return exist.id;

        const { data: authUser, error: auErr } = await supabase.auth.admin.createUser({
            email,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { 
                full_name: name, 
                role: role,
                company_id: companyId 
            }
        });

        if (auErr && auErr.status !== 422) {
            console.error(`Gagal membuat auth user ${email}:`, auErr);
            return null;
        }

        const uid = authUser?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id;
        if (!uid) return null;

        await new Promise(r => setTimeout(r, 800));
        await supabase.from('profiles').upsert({
            id: uid, email, full_name: name, role, company_id: companyId, department: dept
        });

        return uid;
    }

    // --- 1. SET UP COMPANIES & ADMINS ---
    const compA = await createCompany('PT Inovasi Nusantara', 'inovasi-nusantara', 'SaaS HR Solutions');
    const compB = await createCompany('Karya Kreatif Agency', 'karya-kreatif', 'Digital Creative Agency');

    const hrA = await createUser('hr@comp-a.local', 'Indah HR A', 'hr_admin', 'HR', compA.id);
    const hrB = await createUser('hr@comp-b.local', 'Budi HR B', 'hr_admin', 'HR', compB.id);
    
    await createUser('owner@comp-a.local', 'Owner A', 'owner', 'Executive', compA.id);
    await createUser('superadmin@arvela.local', 'Super Admin Global', 'super_admin', 'Sistem', compA.id);

    // --- 2. JOBS (LOWONGAN) ---
    console.log('💼 Membuat Lowongan Kerja...');
    const jobList = [
        { company_id: compA.id, title: 'Senior Software Engineer', slug: 'sr-eng-a', status: 'published', work_type: 'onsite', requirements: 'React, Node.js' },
        { company_id: compA.id, title: 'UI/UX Designer', slug: 'uiux-a', status: 'published', work_type: 'remote', requirements: 'Figma, Prototyping' },
        { company_id: compA.id, title: 'Marketing Specialist', slug: 'mkt-a', status: 'draft', work_type: 'hybrid' },
        { company_id: compB.id, title: 'Creative Director', slug: 'cd-b', status: 'published', work_type: 'onsite' },
        { company_id: compB.id, title: 'Social Media Admin', slug: 'socmed-b', status: 'published', work_type: 'remote' }
    ];

    for (const j of jobList) {
        await supabase.from('jobs').upsert(j, { onConflict: 'company_id, slug' });
    }

    const { data: jobsA } = await supabase.from('jobs').select('*').eq('company_id', compA.id);
    const { data: jobsB } = await supabase.from('jobs').select('*').eq('company_id', compB.id);

    const srEngJob = jobsA.find(j => j.slug === 'sr-eng-a');
    const uiuxJob = jobsA.find(j => j.slug === 'uiux-a');

    // --- 3. CANDIDATES (KANDIDAT) ---
    console.log('👥 Mendaftarkan Pelamar...');
    const apps = [
        // Comp A - Senior Eng
        { company_id: compA.id, job_id: srEngJob.id, full_name: 'Andi Sukarno', email: 'andi@test.com', stage: 'hired' },
        { company_id: compA.id, job_id: srEngJob.id, full_name: 'Budi Santoso', email: 'budi@test.com', stage: 'interview' },
        { company_id: compA.id, job_id: srEngJob.id, full_name: 'Citra Lestari', email: 'citra@test.com', stage: 'applied' },
        // Comp A - UIUX
        { company_id: compA.id, job_id: uiuxJob.id, full_name: 'Diana Putri', email: 'diana@test.com', stage: 'screening' },
        // Comp B
        { company_id: compB.id, job_id: jobsB[0].id, full_name: 'Eko Wijaya', email: 'eko@test.com', stage: 'applied' }
    ];

    for (const a of apps) {
        await supabase.from('applications').upsert(a, { onConflict: 'job_id, email' });
    }

    const { data: allAppsA } = await supabase.from('applications').select('*').eq('company_id', compA.id);
    const andiApp = allAppsA.find(a => a.email === 'andi@test.com');
    const budiApp = allAppsA.find(a => a.email === 'budi@test.com');

    // --- 4. INTERVIEWS ---
    console.log('🤝 Menjadwalkan Interview...');
    const today = new Date().toISOString().split('T')[0];
    
    const interviewList = [
        // Budi's interview today
        { application_id: budiApp.id, company_id: compA.id, scheduled_date: today, scheduled_time: '10:00:00', status: 'scheduled', format: 'online' },
        // Andi's done interview
        { application_id: andiApp.id, company_id: compA.id, scheduled_date: today, scheduled_time: '09:00:00', status: 'done', format: 'offline' }
    ];

    for (const iv of interviewList) {
        // Upsert unique check for interview is not easy because no unique key, 
        // but for demo we just insert if not exists
        const { data: existingIv } = await supabase.from('interviews').select('id').eq('application_id', iv.application_id).limit(1);
        if (!existingIv || existingIv.length === 0) {
            await supabase.from('interviews').insert(iv);
        }
    }

    // Scorecard for Andi
    if (andiApp) {
        await supabase.from('interview_scorecards').upsert({
            application_id: andiApp.id,
            created_by: hrA,
            score_communication: 5,
            score_technical: 5,
            score_problem_solving: 4,
            score_culture_fit: 5,
            score_leadership: 4,
            recommendation: 'Strong Yes',
            notes: 'Kandidat luar biasa.'
        }, { onConflict: 'application_id' });
    }

    // --- 5. EMPLOYEES & HR STUFF ---
    console.log('👤 Setup Karyawan & Simulasi Harian...');
    
    // Andi hired -> Make employee
    const andiUid = await createUser('andi@test.com', 'Andi Sukarno', 'employee', 'Engineering', compA.id);
    if (andiUid) {
        await supabase.from('employees').upsert({
            profile_id: andiUid, company_id: compA.id, job_title: 'Senior Software Engineer', status: 'active', department: 'Engineering'
        }, { onConflict: 'profile_id' });
    }

    const otherEmpUid = await createUser('karyawan1@comp-a.local', 'Siti Aminah', 'employee', 'Design', compA.id);
    if (otherEmpUid) {
        await supabase.from('employees').upsert({
            profile_id: otherEmpUid, company_id: compA.id, job_title: 'Junior Designer', status: 'active', department: 'Design'
        }, { onConflict: 'profile_id' });
    }

    const { data: empsA } = await supabase.from('employees').select('*').eq('company_id', compA.id);
    
    // Attendance simulation
    for (const emp of empsA) {
        if (emp.profile_id === andiUid) {
            // Andi clocked in
            await supabase.from('attendances').upsert({
                employee_id: emp.id, company_id: compA.id, date: today, status: 'present', clock_in: new Date().toISOString()
            }, { onConflict: 'employee_id, date' });
        }
        // Siti Aminah NOT clocked in -> Simulation for HR to see missing presence
    }

    // Leave Request
    const { data: leaveType } = await supabase.from('leave_types').upsert({
        company_id: compA.id, name: 'Cuti Tahunan', code: 'ANNUAL'
    }, { onConflict: 'company_id, code' }).select().single();

    if (leaveType && andiUid) {
        const andiEmp = empsA.find(e => e.profile_id === andiUid);
        await supabase.from('attendance_requests').insert({
            company_id: compA.id, employee_id: andiEmp.id, type: 'LEAVE', leave_type_id: leaveType.id,
            start_date: today, end_date: today, reason: 'Testing cuti', status: 'PENDING'
        });
    }

    console.log('\n=======================================');
    console.log('✅ SEEDING LENGKAP SELESAI');
    console.log('---------------------------------------');
    console.log('Company A User : hr@comp-a.local / Password123!');
    console.log('Jobs           : Senior Software Engineer, UI/UX Designer, dsb.');
    console.log('Kandidat       : Andi (Hired), Budi (Interview), Citra (Applied), Diana (Screening)');
    console.log('Interview      : Budi (Scheduled @ 10:00 Today)');
    console.log('Simulasi       : Siti Aminah belum presensi, Andi sudah presensi.');
    console.log('=======================================\n');
}

seed().catch(console.error);
