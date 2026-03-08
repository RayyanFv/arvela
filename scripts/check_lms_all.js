const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
    }
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLMS() {
    const { data: assignments, error } = await supabase
        .from('lms_course_assignments')
        .select(`
            *,
            lms_courses(title),
            employees(profiles!employees_profile_id_fkey(full_name, email))
        `);
    if (error) console.error(error);
    else console.log(JSON.stringify(assignments, null, 2));
}
checkLMS();
