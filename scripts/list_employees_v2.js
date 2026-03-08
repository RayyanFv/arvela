const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listAll() {
    const { data, error } = await supabase
        .from('employees')
        .select(`
            id,
            job_title,
            department,
            profile_id,
            profiles:profiles!employees_profile_id_fkey(full_name, email)
        `);
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}
listAll();
