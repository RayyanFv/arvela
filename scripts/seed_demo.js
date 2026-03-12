const fs = require('fs');
const path = require('path');

// Parser .env.local sederhana agar bisa jalan di semua OS tanpa alat bantu
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
    console.warn('Gagal membaca .env.local, pastikan variabel ter-set.', e.message);
}

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
    console.log('🌱 Memulai proses Seeding Demo Client lengkap...');

    // 1. Buat Perusahaan
    const companyName = 'PT Inovasi Teknologi Nusantara (Demo)';
    const companyDesc = 'Perusahaan SaaS yang bergerak di bidang HR Solutions.';
    const companySlug = 'inovasi-nusantara-demo';

    let { data: company, error: errC } = await supabase
        .from('companies')
        .insert({
            name: companyName,
            description: companyDesc,
            slug: companySlug,
            website: 'https://inovasi.arvela.demo'
        })
        .select().single();

    if (errC) {
        if (errC.code === '23505') {
            console.log('🏢 Perusahaan sudah ada. Mencari ulang...');
            const res = await supabase.from('companies').select('*').eq('slug', companySlug).single();
            company = res.data;
        } else {
            console.error('❌ Gagal membuat perusahaan:', errC);
            return;
        }
    }

    const cid = company.id;
    console.log(`✅ Perusahaan Demo Siap: ${companyName}`);

    // --- HELPER FUNCTION UNTUK MEMBUAT USER ---
    async function createUser(email, name, role, dept) {
        // Cek jika sudah ada
        const { data: exist } = await supabase.from('profiles').select('id').eq('email', email).single();
        if (exist) return exist.id;

        const { data: authUser, error: auErr } = await supabase.auth.admin.createUser({
            email,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { 
                full_name: name, 
                role: role,
                company_id: cid 
            }
        });

        if (auErr && auErr.status !== 422) {
            console.error(`Gagal membuat auth user ${email}:`, auErr);
            return null;
        }

        const uid = authUser?.user?.id;
        if (!uid) {
            const list = await supabase.auth.admin.listUsers();
            const u = list.data.users.find(u => u.email === email);
            if (u) return u.id;
            return null;
        }

        // Tunggu trigger DB (biarkan handle_new_user selesai), lalu upsert profile untuk memastikan data lengkap
        await new Promise(r => setTimeout(r, 1000));
        await supabase.from('profiles').upsert({
            id: uid,
            email,
            full_name: name,
            role,
            company_id: cid,
            department: dept
        });

        return uid;
    }

    // 2. Buat Akun Sistem (Super Admin, Owner, HR, dll)
    console.log('👤 Menciptakan Akun Sistem Eksekutif & HR...');
    const superAdminId = await createUser('superadmin@arvelademo.local', 'Budi Harjo', 'super_admin', 'Management');
    const ownerId = await createUser('owner@arvelademo.local', 'Ibu Kartini', 'owner', 'Board of Directors');
    const hrAdminId = await createUser('hr@arvelademo.local', 'Indah Pramesti', 'hr_admin', 'Human Resources');

    // 3. Buat Lowongan Pekerjaan (Jobs)
    console.log('💼 Membuat Lowongan Pekerjaan...');
    const jobsData = [
        { company_id: cid, title: 'Senior UX Designer', work_type: 'remote', location: 'Jakarta Selatan', description: 'Membuat desain yang indah dan ramah pengguna', requirements: 'Cakap menggunakan Figma', status: 'published', slug: 'senior-ux-designer-demo' },
        { company_id: cid, title: 'Backend Engineer (Node.js)', work_type: 'onsite', location: 'Bandung', description: 'Mengembangkan sistem backend yang kuat dengan Node.js', requirements: '3+ pengalaman kerja dengan Node.js', status: 'published', slug: 'backend-engineer-node-demo' },
        { company_id: cid, title: 'Product Manager', work_type: 'hybrid', location: 'Jakarta Pusat', description: 'Mengarahkan visi misi dan roadmap', requirements: 'Memiliki kemampuan komunikasi dan analitik yang superior', status: 'published', slug: 'product-manager-demo' },
        { company_id: cid, title: 'Customer Support Lead', work_type: 'remote', location: 'Surabaya', description: 'Membangun koneksi humanis dengan klien enterprise.', requirements: 'Pengalaman memimpin tim minimal 2 tahun.', status: 'published', slug: 'cs-lead-demo' },
    ];
    let jobs = [];
    for (const j of jobsData) {
        let job = null
        const { data: existing } = await supabase.from('jobs').select('*').eq('slug', j.slug).single()
        
        if (existing) {
            job = existing
        } else {
            const { data, error: jErr } = await supabase.from('jobs').insert(j).select().single()
            if (jErr) console.error('Error inserting job:', jErr)
            if (data) job = data
        }
        
        if (job) jobs.push(job)
    }

    // 4. Seeding Karyawan secara acak (beserta profil)
    console.log('👥 Menginisiasi Tenaga Kerja (Karyawan)...');
    const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'Human Resources', 'Finance'];
    let employees = [];
    for (let i = 1; i <= 20; i++) {
        const dept = departments[i % departments.length];
        const email = `karyawan${i}@arvelademo.local`;
        const name = `Karyawan Demo ${i}`;
        const uid = await createUser(email, name, 'employee', dept);
        
        if (uid) {
            const title = `Staff ${dept}`;
            const { data: emp, error } = await supabase.from('employees')
                .upsert({ profile_id: uid, company_id: cid, department: dept, job_title: title, status: 'active' }, { onConflict: 'profile_id' })
                .select().single();
            if (emp) employees.push(emp);
        }
    }

    // 5. Buat OKR untuk setiap karyawan
    console.log('🎯 Menerbitkan OKR Ke Karyawan...');
    const periods = ['Q1 2026', 'Q2 2026'];
    for (const emp of employees) {
        // Buat 1 atau 2 OKR tiap Karyawan
        const okrCount = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < okrCount; j++) {
            const { data: okr } = await supabase.from('okrs').insert({
                employee_id: emp.id,
                company_id: cid,
                title: `Target ${emp.department} - Obj ${j+1}`,
                period: periods[j % 2],
                description: `Sasaran kuartal untuk meningkatkan efisiensi proses di tim ${emp.department}.`,
                status: 'active',
                total_progress: Math.floor(Math.random() * 80) // Progress acak 0-80%
            }).select().single();

            // Buat 2-3 Key Results
            if (okr) {
                const krCount = 3;
                let krs = [];
                for (let k = 0; k < krCount; k++) {
                    const targetVal = 100;
                    const currVal = Math.floor(Math.random() * 100);
                    krs.push({
                        okr_id: okr.id,
                        title: `Key Result ${k+1} dari OKR ${okr.title}`,
                        target_value: targetVal,
                        current_value: currVal,
                        unit: '%'
                    });
                }
                await supabase.from('key_results').insert(krs);
            }
        }
    }

    // 6. Buat Assessment dan Penugasan (LMS / Course)
    console.log('📚 Manufaktur Training LMS dan Assessment...');
    const { data: lms } = await supabase.from('lms_courses').upsert({
        company_id: cid,
        title: 'Pengenalan Budaya Inovasi',
        description: 'Pahami nilai-nilai dasar dan visi misi perusahaan.',
        status: 'published'
    }, { onConflict: 'title' }).select().single();
    
    if (lms) {
        // Assign ke setengah karyawan
        for (let i = 0; i < employees.length / 2; i++) {
            await supabase.from('lms_course_assignments').upsert({
                course_id: lms.id,
                employee_id: employees[i].id,
                company_id: cid,
                status: Math.random() > 0.5 ? 'in_progress' : 'completed'
            }, { onConflict: 'course_id, employee_id' });
        }
    }

    const { data: assessment } = await supabase.from('assessments').upsert({
        company_id: cid,
        title: 'Tes Psikometri Lanjutan',
        description: 'Digunakan saat tahapan interview.',
        duration_minutes: 45,
        show_score: true
    }, { onConflict: 'title' }).select().single();

    // 7. Pipeline Rekrutmen (Pelamar dan Tahapannya)
    console.log('📂 Memasukkan Data Kandidat / Pelamar...');
    console.log(` > Jumlah lowongan aktif: ${jobs.length}`);
    const stages = ['applied', 'screening', 'assessment', 'interview', 'offering', 'hired'];
    if (jobs.length > 0) {
        let appCount = 0;
        for (let i = 1; i <= 30; i++) {
            const jobObj = jobs[i % jobs.length];
            const stage = stages[Math.floor(Math.random() * stages.length)];
            const email = `kandidat_demo${i}@gmail.example.com`;
            const name = `Bagus Pelamar ${i}`;
            
            const { data: appData, error: appErr } = await supabase.from('applications').insert({
                company_id: cid,
                job_id: jobObj.id,
                full_name: name,
                email: email,
                phone: `08123456789${i}`,
                stage: stage,
                internal_notes: 'Kandidat potensial dari job portal lokal.'
            }).select().single();

            if (appErr) console.error(`Error inserting application ${i}:`, appErr);

            if (appData && stage === 'interview') {
                // Beri jadwal interview
                await supabase.from('interviews').insert({
                    application_id: appData.id,
                    company_id: cid,
                    scheduled_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days from now
                    scheduled_time: '14:00',
                    format: 'Online - Video Call',
                    status: 'scheduled'
                });
            }

            if (appData && stage === 'assessment' && assessment) {
                // Beri assessment
                await supabase.from('assessment_assignments').insert({
                    application_id: appData.id,
                    assessment_id: assessment.id,
                    token: crypto.randomUUID(),
                    status: 'sent'
                });
            }
            appCount++;
        }
        console.log(` > ${appCount} data lamaran kandidat berhasil dimasukkan.`);
    }

    // 8. Kehadiran Karyawan (Attendance Seeding untuk 7 Hari Terakhir)
    console.log('⏰ Injecting Record Kehadiran (7 Hari Terakhir)...');
    const attendances = [];
    const today = new Date();
    for (let dayOff = 0; dayOff < 7; dayOff++) {
        const d = new Date(today);
        d.setDate(d.getDate() - dayOff);
        const dateStr = d.toLocaleDateString('en-CA');

        for (const emp of employees) {
            // Peluang hadir 85%, cuti/sakit 10%, telat 5%
            const r = Math.random();
            let stateCode = 'present';
            if (r > 0.95) stateCode = 'early_leave';
            else if (r > 0.90) stateCode = 'sick';
            else if (r > 0.85) stateCode = 'leave';

            let checkIn = '08:00:00';
            let checkOut = '17:00:00';
            if (stateCode === 'early_leave') checkOut = '14:30:00';
            
            attendances.push({
                employee_id: emp.id,
                company_id: cid,
                date: dateStr,
                clock_in: ['leave', 'sick'].includes(stateCode) ? null : `2026-03-12T${checkIn}Z`,
                clock_out: ['leave', 'sick'].includes(stateCode) ? null : `2026-03-12T${checkOut}Z`,
                status: stateCode
            });
        }
    }
    await supabase.from('attendances').upsert(attendances, { onConflict: 'employee_id, date' });

    // 9. Data Permohonan Lembur
    console.log('🌙 Mengajukan Data Permohonan Lembur (Overtime)...');
    const otReqs = [];
    for (let i = 0; i < 5; i++) {
        const emp = employees[i];
        otReqs.push({
            employee_id: emp.id,
            company_id: cid,
            overtime_date: today.toLocaleDateString('en-CA'),
            start_time: '18:00',
            end_time: '21:00',
            reason: 'Mengejar deadline peluncuran fitur baru modul finance.',
            tasks_completed: 'Modul finance',
            status: i % 2 === 0 ? 'approved' : 'pending' // Setengah disetujui, setengah pending
        });
    }
    await supabase.from('overtime_requests').insert(otReqs);


    console.log('\n=======================================');
    console.log('🎉 SEEDING DEMO SELESAI 🎉');
    console.log('Perusahaan  :', companyName);
    console.log('URL Web     : https://inovasi.arvela.demo');
    console.log('Super Admin : superadmin@arvelademo.local');
    console.log('Owner       : owner@arvelademo.local');
    console.log('HR Admin    : hr@arvelademo.local');
    console.log('Passwords   : Password123!');
    console.log('Silakan diujicobakan pada dashboard panel.');
    console.log('=======================================\n');

}

seed().catch(err => {
    console.error('Terjadi kesalahan fatal:', err);
});
