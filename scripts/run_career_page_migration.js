const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sql = fs.readFileSync(
  path.join(__dirname, '../supabase/migrations/20260728000000_company_career_page.sql'),
  'utf8'
);

s.rpc('exec_sql', { sql }).then(({ data, error }) => {
  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  console.log('Migration applied successfully.', data || '');
});
