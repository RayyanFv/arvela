const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
    }
});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOnboarding(email) {
    console.log(`Checking onboarding for: ${email}`);

    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (!profile) {
        console.log('Profile not found.');
        return;
    }

    const { data: employee } = await supabase.from('employees').select('id, profile_id, company_id').eq('profile_id', profile.id).single();
    if (!employee) {
        console.log('Employee record not found.');
        return;
    }

    console.log('Employee ID:', employee.id);

    const { data: okrs } = await supabase
        .from('okrs')
        .select('*, key_results(*)')
        .eq('employee_id', employee.id) // Changed 'emp.id' to 'employee.id'

    console.log('OKR COUNT:', okrs?.length || 0)
    if (okrs) {
        okrs.forEach(o => {
            console.log(`- [${o.period}] ${o.title}: ${o.total_progress}%`)
            o.key_results.forEach(kr => {
                console.log(`  > ${kr.title}: ${kr.current_value}/${kr.target_value} ${kr.unit}`)
            })
        })
    }

    // 5. Check LMS
    const { data: lms } = await supabase
        .from('lms_course_assignments')
        .select('*, lms_courses(*)')
        .eq('employee_id', employee.id) // Changed 'emp.id' to 'employee.id'

    console.log('LMS ASSIGNMENTS:', lms?.length || 0)
    if (lms) {
        lms.forEach(l => {
            console.log(`- Course: ${l.lms_courses?.title}, Status: ${l.status}, Deadline: ${l.deadline}`)
        })
    }
    const { data: progress, error: pError } = await supabase
        .from('onboarding_progress')
        .select('*, onboarding_tasks(*)')
        .eq('employee_id', employee.id);

    if (pError) {
        console.error('Progress Error:', pError.message);
    } else {
        console.log(`Found ${progress.length} progress records.`);
        progress.forEach(p => {
            console.log(`- Task: ${p.onboarding_tasks?.title || 'NULL TASK'} (Completed: ${p.is_completed})`);
        });
    }
}

const email = process.argv[2];
if (!email) {
    console.log('Usage: node check_onboarding.js <email>');
} else {
    checkOnboarding(email);
}
