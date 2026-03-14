const { createClient } = require('@supabase/supabase-js');
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
} catch (e) {}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
    console.log('--- DEBUG PHOTOJO ---');
    
    const { data: company } = await supabase.from('companies').select('*').eq('slug', 'photojo').single();
    if (!company) {
        console.log('Company PhotoJo NOT FOUND');
        return;
    }
    console.log('Company:', company.id, company.name);

    const { data: profile } = await supabase.from('profiles').select('*').eq('email', 'photojo@demo.com').single();
    console.log('HR Profile:', profile ? { id: profile.id, role: profile.role, company_id: profile.company_id } : 'NOT FOUND');

    const { data: courses } = await supabase.from('lms_courses').select('id, title').eq('company_id', company.id);
    console.log('Courses Count:', courses.length);
    courses.forEach(c => console.log(' - Course:', c.title));

    const { data: templates } = await supabase.from('onboarding_templates').select('id, name').eq('company_id', company.id);
    console.log('Onboarding Templates Count:', templates.length);
    templates.forEach(t => console.log(' - Template:', t.name));

    const { data: okrs } = await supabase.from('okrs').select('id, title').eq('company_id', company.id);
    console.log('OKRs Count:', okrs.length);
    okrs.forEach(o => console.log(' - OKR:', o.title));

    const { data: employees } = await supabase.from('employees').select('id, profile_id').eq('company_id', company.id);
    console.log('Employees Count:', employees.length);
}

debug();
