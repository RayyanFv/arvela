const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const lines = fs.readFileSync('.env', 'utf8').split('\n');
let url = '', key = '';
for (let l of lines) {
    if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = l.split('=')[1].trim().replace(/"/g, '');
    if (l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = l.split('=')[1].trim().replace(/"/g, '');
}

const supabase = createClient(url, key);

async function run() {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) console.log(error);
    if (profiles) {
        const hr = profiles.find(p => p.role === 'hr' || p.role === 'super_admin');
        const employees = profiles.filter(p => p.role === 'employee' || !p.role);
        console.log('--- HR Accounts ---');
        if (hr) console.log(hr.email, 'password123');
        console.log('\n--- Employee Accounts ---');
        employees.forEach(e => console.log(e.email, 'password123'));
    }
}
run();
