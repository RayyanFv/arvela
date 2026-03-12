const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
} catch (e) {}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAsUser() {
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'superadmin@arvelademo.local',
        password: 'Password123!'
    });

    if (authErr) {
        console.error('Login failed:', authErr.message);
        return;
    }
    console.log('Logged in successfully!');

    console.log('\n--- TESTING GET JOBS ---');
    const { data: jobs, error: jErr } = await supabase.from('jobs').select('*');
    if (jErr) console.error('Jobs Error:', jErr);
    else console.log('Jobs:', jobs.length, 'records');

    console.log('\n--- TESTING GET APPLICATIONS WITH JOIN ---');
    const { data: apps, error: aErr } = await supabase.from('applications').select('id, full_name, stage, jobs(id, title)');
    if (aErr) console.error('Apps Error:', aErr);
    else console.log('Apps:', apps.length, 'records');
}

testAsUser();
