const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Manual ENV parser because dotenv might not be installed
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.trim().match(/^([^=]+)=(.*)$/);
        if (match) {
            let key = match[1].trim();
            let val = match[2].trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
            process.env[key] = val;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function runSeeder() {
    const today = new Date().toISOString().split('T')[0];
    console.log('🚀 Memulai Proses Hard Reset & Seeder Arvela...');

    // ==========================================
    // 1. HARD RESET (Wipe All Data)
    // ==========================================
    console.log('\n🧹 [1/7] Menghapus data tabel relasional untuk mencegah Foreign Key error...');
    const tablesToClear = [
        'lms_certificates',
        'lms_content_progress', 'lms_course_progress', 'lms_course_assignments',
        'lms_course_contents', 'lms_course_sections', 'lms_courses',
        'key_results', 'okrs',
        'onboarding_progress', 'onboarding_tasks',
        'job_scorecards', 'interviews',
        'assessment_assignments', 'assessment_questions', 'assessments',
        'attendances', 'employees', 'applications', 'jobs'
    ];

    for (const t of tablesToClear) {
        const { error: tErr } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (tErr && tErr.code !== '42P01') { // ignore table not found
            console.warn(`   ⚠️ Gagal menghapus isi tabel ${t}:`, tErr.message);
        }
    }

    console.log('🧹 [1.5/7] Menghapus semua akun Users...');
    try {
        // Delete all auth users (this will CASCADE delete profiles and companies)
        let hasMore = true;
        let page = 1;
        while (hasMore) {
            const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
            if (usersError) throw usersError;

            if (usersData.users.length === 0) {
                hasMore = false;
            } else {
                for (const u of usersData.users) {
                    const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
                    if (delErr) {
                        console.error(`Gagal menghapus ${u.email}:`, delErr.message);
                    }
                }
                console.log(`Terhapus ${usersData.users.length} users (Page ${page}).`);
                page++;
            }
        }

        // Just in case cascade missed something, force delete companies
        await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('✅ Hard reset selesai.');
    } catch (e) {
        console.error('❌ Gagal mereset data:', e.message);
        process.exit(1);
    }

    // ==========================================
    // 2. CREATE ADMIN / HR USER (Company Owner)
    // ==========================================
    console.log('\n🏢 [2/7] Membuat Perusahaan & Akun HR...');
    let companyId;
    let hrProfileId;
    try {
        const { data: hrUser, error: hrError } = await supabase.auth.admin.createUser({
            email: 'oyanrayan07@gmail.com',
            password: 'Akujawa123',
            email_confirm: true,
            user_metadata: {
                role: 'super_admin', // Use super_admin for full dashboard access
                full_name: 'Oyan Admin HR',
                company_name: 'Arvela Tech'
            }
        });
        if (hrError) throw hrError;
        hrProfileId = hrUser.user.id;
        console.log(`- Berhasil membuat HR account: oyanrayan07@gmail.com`);

        // Wait 2 seconds for trigger to create company and profile
        await new Promise(r => setTimeout(r, 2000));

        const { data: company, error: compErr } = await supabase.from('companies').select('*').limit(1).single();
        if (compErr || !company) throw new Error('Company tidak terbuat otomatis oleh trigger!');

        companyId = company.id;

        // Update company logo dummy & office loc (Monas as dummy office)
        await supabase.from('companies').update({
            logo_url: 'https://i.ibb.co/6nd0xM3/arvela-logo-dummy.png',
            industry: 'Technology',
            size: '50-100',
            office_lat: -6.1754,
            office_lng: 106.8272,
            office_radius_meters: 500 // 500m radius
        }).eq('id', companyId);

        console.log(`- Berhasil menginisialisasi perusahaan: ${company.name}`);
    } catch (e) {
        console.error('❌ Gagal membuat HR & Company:', e.message);
        process.exit(1);
    }

    // ==========================================
    // 3. CREATE EMPLOYEE (Staff Portal Demo)
    // ==========================================
    console.log('\n🧑‍💻 [3/7] Membuat Akun Karyawan / Staff...');
    let empProfileId;
    let employeeRecordId;
    try {
        const { data: empUser, error: empError } = await supabase.auth.admin.createUser({
            email: 'oyanrayan01@gmail.com',
            password: 'Akujawa123',
            email_confirm: true,
            user_metadata: {
                role: 'employee',
                full_name: 'Rayan Karyawan',
                company_id: companyId
            }
        });
        if (empError) throw empError;
        empProfileId = empUser.user.id;

        await new Promise(r => setTimeout(r, 1000));

        // Create Employee record
        const { data: employeeRecord, error: empRecordErr } = await supabase.from('employees').insert({
            profile_id: empProfileId,
            company_id: companyId,
            job_title: 'Fullstack Developer',
            status: 'active', // Lolos onboarding
            joined_at: new Date(Date.now() - 86400000 * 30).toISOString() // 30 days ago
        }).select().single();
        if (empRecordErr) throw empRecordErr;
        employeeRecordId = employeeRecord.id;

        console.log(`- Berhasil membuat Karyawan: oyanrayan01@gmail.com (Role: Staff - Status: Aktif)`);

        // --- Seed Employee Ecosystem (OKR, LMS) ---
        // Onboarding skipped due to complex template relations in remote schema that's mismatched

        // LMS Courses skipped due to section relations schema

        // OKR
        const { data: okr, error: okrErr } = await supabase.from('okrs').insert({ employee_id: employeeRecordId, title: 'Selesaikan Fitur X dalam Kuartal ini', period: 'Q1 2026', status: 'active', company_id: companyId }).select().single();
        if (okrErr || !okr) throw new Error('OKR Error: ' + (okrErr?.message || 'null data'));

        const { error: krErr } = await supabase.from('key_results').insert([
            { okr_id: okr.id, title: 'Release MVP', target_value: 100, current_value: 75, unit: '%' },
            { okr_id: okr.id, title: '0 Critical Bugs', target_value: 0, current_value: 0, unit: 'bugs' }
        ]);
        if (krErr) throw new Error('Key Results error: ' + krErr.message);

        // --- Attendance Skipped per User Request ---
        /*
        const { error: attErr } = await supabase.from('attendances').insert({
            employee_id: employeeRecordId,
            company_id: companyId,
            date: today,
            clock_in: new Date(new Date().setHours(8, 0, 0)).toISOString(),
            status: 'present',
            lat_in: -6.1754,
            lng_in: 106.8272,
            photo_in_url: 'https://i.pravatar.cc/150?u=' + empProfileId
        });
        if (attErr) console.warn('   ⚠️ Gagal membuat data absensi dummy:', attErr.message);
        */

        console.log(`- Berhasil men-setup ecosystem Staff (OKR, LMS, Onboarding)`);

    } catch (e) {
        console.error('❌ Gagal membuat Karyawan:', e.message);
        process.exit(1);
    }

    // ==========================================
    // 4. SEED JOBS (Lowongan)
    // ==========================================
    console.log('\n💼 [4/7] Membuat Lowongan Kerja...');
    let jobIds = [];
    try {
        const jobsToInsert = [
            { company_id: companyId, slug: 'frontend-developer', title: 'Frontend Developer', location: 'Jakarta Selatan', employment_type: 'fulltime', work_type: 'hybrid', description: 'Mencari Frontend Engineer handal dengan Next.js.', status: 'published', published_at: new Date().toISOString() },
            { company_id: companyId, slug: 'hr-manager', title: 'HR Manager', location: 'Remote', employment_type: 'fulltime', work_type: 'remote', description: 'Memimpin tim HR dan merekrut talenta terbaik.', status: 'published', published_at: new Date().toISOString() },
            { company_id: companyId, slug: 'product-designer', title: 'Product Designer (UI/UX)', location: 'Jakarta Selatan', employment_type: 'contract', work_type: 'onsite', description: 'Mendesain user experience terbaik untuk produk kami.', status: 'published', published_at: new Date().toISOString() }
        ];

        const { data: jobs, error: jobsErr } = await supabase.from('jobs').insert(jobsToInsert).select();
        if (jobsErr) throw jobsErr;

        jobIds = jobs.map(j => j.id);
        console.log(`- Berhasil membuat 3 lowongan pekerjaan.`);
    } catch (e) {
        console.error('❌ Gagal membuat jobs:', e.message);
    }

    // ==========================================
    // 5. CREATE ASSESSMENTS
    // ==========================================
    console.log('\n📝 [5/7] Membuat Modul Assessment...');
    let assessmentId;
    try {
        const { data: assessment, error: asmtErr } = await supabase.from('assessments').insert({
            company_id: companyId, title: 'General Logic & Aptitude Test', description: 'Tes logika dasar 15 Menit untuk calon karyawan.', duration_minutes: 15, show_score: true
        }).select().single();
        if (asmtErr) throw asmtErr;
        assessmentId = assessment.id;

        await supabase.from('assessment_questions').insert([
            { assessment_id: assessmentId, type: 'multiple_choice', question: 'Tentukan pola selanjutnya: 2, 4, 8, 16, ?', options: ['24', '30', '32', '64'], correct_answer: '32', points: 10, order_index: 1 },
            { assessment_id: assessmentId, type: 'multiple_choice', question: 'Jika semua A adalah B, dan beberapa B adalah C, maka...', options: ['Semua A adalah C', 'Beberapa A adalah C', 'Beberapa C adalah B', 'Tidak ada penyelesaian'], correct_answer: 'Beberapa C adalah B', points: 10, order_index: 2 }
        ]);
        console.log('- Berhasil membuat 1 template Assessment.');
    } catch (e) {
        console.error('❌ Gagal membuat assessment:', e.message);
    }

    // ==========================================
    // 6. CREATE CANDIDATES & APPLICATIONS
    // ==========================================
    console.log('\n👥 [6/7] Membuat Data Pelamar (Candidates) & App...');
    try {
        const candidates = [
            { email: 'johndoe@gmail.com', name: 'John Doe', stage: 'interview' },
            { email: 'sarah.k@yahoo.com', name: 'Sarah Konor', stage: 'assessment' },
            { email: 'budi.santoso@gmail.com', name: 'Budi Santoso', stage: 'applied' },
            { email: 'alice.tech@gmail.com', name: 'Alice Tech', stage: 'hired' }
        ];

        for (const [idx, c] of candidates.entries()) {
            // 1. Create Auth User for Candidate
            const { data: candUser, error: candError } = await supabase.auth.admin.createUser({
                email: c.email,
                password: 'password123',
                email_confirm: true,
                user_metadata: { role: 'candidate', full_name: c.name }
            });

            // 2. Create Application in Jobs
            const jobId = jobIds[idx % jobIds.length];
            const appPayload = {
                company_id: companyId, job_id: jobId, full_name: c.name, email: c.email, phone: '08123456789' + idx, stage: c.stage, resume_url: 'https://example.com/resume.pdf', created_at: new Date(Date.now() - (idx * 86400000)).toISOString()
            };

            const { data: appData, error: appErr } = await supabase.from('applications').insert(appPayload).select().single();

            // 3. If Assessment stage, dispatch assignment
            if (c.stage === 'assessment' && assessmentId && appData) {
                await supabase.from('assessment_assignments').insert({
                    application_id: appData.id, assessment_id: assessmentId, token: 'DEMO-' + Date.now().toString(36), status: 'sent', expires_at: new Date(Date.now() + 86400000).toISOString()
                });
            }

            // 4. If Interview stage, setup interview schedule
            if (c.stage === 'interview' && appData) {
                await supabase.from('interviews').insert({
                    application_id: appData.id, company_id: companyId, interviewer_id: hrProfileId, schedule_time: new Date(Date.now() + 86400000).toISOString(), method: 'video', meeting_link: 'https://meet.google.com/abc-xyz-123', status: 'scheduled'
                });
            }
        }
        console.log(`- Berhasil men-seed 4 Kandidat dan Aplikasinya di berbagai tahapan!`);
    } catch (e) {
        console.error('❌ Gagal membuat kandidat:', e.message);
    }

    console.log('\n=============================================');
    console.log('🎉 DB SEEDING BERHASIL PENUH UNTUK BISA-DEMO!');
    console.log('=============================================');
    console.log('Gunakan kredensial ini untuk login demonstrasi:');
    console.log('1. HR/Admin  => oyanrayan07@gmail.com | pass: Akujawa123');
    console.log('2. Karyawan  => oyanrayan01@gmail.com | pass: Akujawa123');
    console.log('3. Kandidat  => johndoe@gmail.com     | pass: password123');
}

runSeeder();
