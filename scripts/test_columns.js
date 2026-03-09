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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { error: e1 } = await supabase.from('onboarding_tasks').insert({ __dummy_col: 1 });
    console.log("Tasks err:", e1?.message);

    // We can extract columns by reading a single row or requesting an OPTIONS call, or we can just fetch one row that exists (but they are deleted)
    // Wait, let's insert a valid minimum row or just see what the error says.

    // What if we test OKRs?
    const { error: e2 } = await supabase.from('okrs').insert({ __dummy_col: 1 });
    console.log("OKRs err:", e2?.message);
}
check();
