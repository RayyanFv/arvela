const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
    }
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- EMPLOYEES ---');
    const { data: emps } = await supabase.from('employees').select('id, profile_id, company_id, profiles!employees_profile_id_fkey(full_name, email, role)');
    console.log(JSON.stringify(emps, null, 2));

    console.log('--- LMS COURSES ---');
    const { data: courses } = await supabase.from('lms_courses').select('id, title, company_id, status');
    console.log(JSON.stringify(courses, null, 2));

    console.log('--- LMS ASSIGNMENTS ---');
    const { data: assigns } = await supabase.from('lms_course_assignments').select('*');
    console.log(JSON.stringify(assigns, null, 2));

    console.log('--- ONBOARDING PROGRESS ---');
    const { data: progress } = await supabase.from('onboarding_progress').select('*, onboarding_tasks(*)');
    console.log(JSON.stringify(progress, null, 2));
}
check();
