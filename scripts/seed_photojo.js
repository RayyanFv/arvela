const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Konstanta ID agar idempotent
const COMPANY_ID = 'bf4e8d23-a0b8-427a-85fd-2195e18ff499';
const HR_EMAIL = 'photojo@demo.com';
const TEMPLATE_ID = 'bf4e8d23-a0b8-427a-85fd-2195e18ff401';
const COURSE_ID = 'bf4e8d23-a0b8-427a-85fd-2195e18ff402';

async function seed() {
    console.log('🌱 Memulai Seeder PhotoJo (v3 - Final)...');

    // 1. Perusahaan
    const { data: company, error: compErr } = await supabase.from('companies').upsert({
        id: COMPANY_ID,
        name: 'PhotoJo',
        slug: 'photojo',
        website: 'https://photojo.arvela.demo'
    }).select().single();

    if (compErr) return console.error('❌ Error company:', compErr.message);
    console.log(`✅ Company: ${company.name}`);

    // Helper User
    async function setupUser(email, name, role, dept) {
        let { data: exist } = await supabase.from('profiles').select('id').eq('email', email).single();
        let uid = exist?.id;

        if (!uid) {
            const { data, error } = await supabase.auth.admin.createUser({
                email, password: 'PhotoJo123!', email_confirm: true,
                user_metadata: { full_name: name, role, company_id: COMPANY_ID }
            });
            if (error && error.status !== 422) return null;
            uid = data?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id;
        }

        if (uid) {
            await supabase.from('profiles').upsert({ id: uid, email, full_name: name, role, company_id: COMPANY_ID, department: dept });
        }
        return uid;
    }

    // 2. HR & Employees
    const hrId = await setupUser(HR_EMAIL, 'HR PhotoJo', 'hr_admin', 'HR');
    if (hrId) await supabase.from('employees').upsert({ profile_id: hrId, company_id: COMPANY_ID, job_title: 'HR Manager', department: 'HR', status: 'active' }, { onConflict: 'profile_id' });

    const empData = [
        { email: 'karyawan1_photojo@demo.com', name: 'Budi Photo', title: 'Photographer', dept: 'Creative' },
        { email: 'karyawan2_photojo@demo.com', name: 'Siti Jo', title: 'Video Editor', dept: 'Creative' },
        { email: 'karyawan3_photojo@demo.com', name: 'Andi Lens', title: 'Studio Assistant', dept: 'Operations' }
    ];

    const employees = [];
    for (const d of empData) {
        const uid = await setupUser(d.email, d.name, 'employee', d.dept);
        if (uid) {
            const { data } = await supabase.from('employees').upsert({ profile_id: uid, company_id: COMPANY_ID, job_title: d.title, department: d.dept, status: 'active' }, { onConflict: 'profile_id' }).select().single();
            if (data) employees.push(data);
        }
    }

    // 3. Onboarding (Fixed: no 'description' column in templates)
    console.log('📋 Seeding Onboarding...');
    const { error: tErr } = await supabase.from('onboarding_templates').upsert({
        id: TEMPLATE_ID,
        company_id: COMPANY_ID,
        name: 'Onboarding PhotoJo Standard',
        created_by: hrId
    });

    if (tErr) console.error('❌ Onboarding Template Error:', tErr.message);

    const tasks = [
        { title: 'Siapkan Gear Kamera', description: 'Mengecek kelengkapan kamera dan lensa.' },
        { title: 'Akses Server Portofolio', description: 'Meminta hak akses ke server foto.' }
    ];

    for (const t of tasks) {
        const { data: task } = await supabase.from('onboarding_tasks').upsert({
            template_id: TEMPLATE_ID, title: t.title, description: t.description
        }, { onConflict: 'template_id, title' }).select().single();

        if (task) {
            for (const emp of employees) {
                await supabase.from('onboarding_progress').upsert({
                    employee_id: emp.id, task_id: task.id, is_completed: true
                }, { onConflict: 'employee_id, task_id' });
            }
        }
    }

    // 4. LMS
    console.log('📚 Seeding LMS...');
    await supabase.from('lms_courses').upsert({
        id: COURSE_ID, company_id: COMPANY_ID, title: 'Teknik Pencahayaan Studio', status: 'published', created_by: hrId
    });

    const { data: section } = await supabase.from('lms_course_sections').upsert({
        course_id: COURSE_ID, title: 'Dasar Flash', order_index: 1
    }, { onConflict: 'course_id, title' }).select().single();

    if (section) {
        await supabase.from('lms_course_contents').upsert({
            section_id: section.id, title: 'Video Tutorial', type: 'video', content_type: 'video', content_url: 'https://youtu.be/QQhJ3vHdQ3g?si=RVAPLYm4WpkhW3m1'
        }, { onConflict: 'section_id, title' });
    }

    for (const emp of employees) {
        await supabase.from('lms_course_assignments').upsert({
            course_id: COURSE_ID, employee_id: emp.id, company_id: COMPANY_ID, status: 'enrolled'
        }, { onConflict: 'course_id, employee_id' });
    }

    // 5. Performance
    console.log('📈 Seeding Performance...');
    for (const emp of employees) {
        const { data: okr } = await supabase.from('okrs').upsert({
            employee_id: emp.id, company_id: COMPANY_ID, title: 'KPI Q1 2026', period: 'Q1 2026', status: 'active'
        }, { onConflict: 'employee_id, title' }).select().single();

        if (okr) {
            await supabase.from('key_results').upsert({
                okr_id: okr.id, title: 'Project Completion', target_value: 100, current_value: 65, unit: '%'
            }, { onConflict: 'okr_id, title' });
        }
    }

    console.log('\n✅ SEEDING SELESAI. Silakan cek portal kembali.');
}

seed().catch(console.error);
