const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkJob() {
    const { data, error } = await supabase
        .from('jobs')
        .select('*, companies(slug)')
        .eq('slug', 'frontend-engineer')
        .eq('status', 'published');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Job Match Found:', data.length);
    data.forEach(j => {
        console.log(`Job: ${j.title} | Status: ${j.status} | Company Slug: ${j.companies?.slug}`);
    });
}

checkJob();
