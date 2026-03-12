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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const query = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'holidays';
    `;
    const { data, error } = await supabase.rpc('get_table_columns', { t_name: 'holidays' }).catch(async () => {
         // If RPC fails, try generic query via anon/authenticated if enabled or use this trick
         return supabase.from('holidays').select('*').limit(0);
    });
    
    // Fallback: try to select 0 rows to see columns in data if error is null
    const { data: cols, error: err } = await supabase.from('holidays').select('*').limit(0);
    if (err) {
        console.log('Error fetching columns:', err.message);
    } else {
        console.log('Columns in holidays:', Object.keys(cols[0] || {}));
    }
    
    const { data: cols2 } = await supabase.from('interview_scorecards').select('*').limit(0);
    console.log('Columns in interview_scorecards:', Object.keys(cols2?.[0] || {}));
}

check();
