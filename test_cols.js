const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.trim().match(/^([^=]+)=(.*)$/);
    if (match) {
        let key = match[1].trim(); let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        env[key] = val;
    }
});
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const templ = await s.from('onboarding_templates').insert({ title: 'Template 1', company_id: '00000000-0000-0000-0000-000000000000' }).select().single();
    console.log("Template:", templ.error?.message);

    // Check old style directly to see if it allows employee_id?
    const op = await s.from('onboarding_tasks').insert({ employee_id: '00000000-0000-0000-0000-000000000000' });
    console.log("Tasks:", op.error?.message);
}
check();
