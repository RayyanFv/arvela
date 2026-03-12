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
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log('--- COMPANIES ---');
    const { data: companies } = await supabase.from('companies').select('id, name').limit(3);
    console.log(companies);
    
    console.log('\n--- JOBS ---');
    const { data: jobs } = await supabase.from('jobs').select('id, title, company_id').limit(3);
    console.log(jobs);

    console.log('\n--- PROFILES (super admins) ---');
    const { data: profs } = await supabase.from('profiles').select('id, email, company_id').eq('role', 'super_admin').limit(3);
    console.log(profs);
}

check();
