const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pedhthbsbafqybshaefv.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZGh0aGJzYmFmcXlic2hhZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkwMjA5NywiZXhwIjoyMDg4NDc4MDk3fQ.RLMRfBICvstj-85N0Yyz_vmSqgknuFi0L366WNyptCc'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function run() {
    console.log('Adding column lms_courses.has_certificate...')
    // We can't run schema migrations via Supabase client easily, 
    // but we can try to check if it's really missing.

    const { data, error } = await supabase.from('lms_courses').select('id, has_certificate').limit(1)
    if (error) {
        console.error('Column has_certificate missing or error:', error.message)
        // To add the column, we usually need the SQL API or similar.
        // If we can't do it, we'll just report it.
    } else {
        console.log('Column has_certificate exists!')
    }
}
run()
