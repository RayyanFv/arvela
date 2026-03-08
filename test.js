const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.trim().match(/^([^=]+)=(.*)$/);
    if (match) {
        let key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[key] = val;
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    const { data: t } = await supabase.from('onboarding_tasks').select('*').limit(1);
    const { data: op } = await supabase.from('onboarding_progress').select('*').limit(1);
    console.log('Tasks cols:', t ? Object.keys(t[0] || {}) : 'null', t?.length === 0 ? 'Empty table but got array' : '');
    console.log('Progress cols:', op ? Object.keys(op[0] || {}) : 'null', op?.length === 0 ? 'Empty table but got array' : '');
}
test();
