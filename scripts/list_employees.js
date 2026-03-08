require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listAll() {
    const { data, error } = await supabase
        .from('employees')
        .select('*, profiles!employees_profile_id_fkey(*)');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}
listAll();
