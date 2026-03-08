const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pedhthbsbafqybshaefv.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZGh0aGJzYmFmcXlic2hhZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkwMjA5NywiZXhwIjoyMDg4NDc4MDk3fQ.RLMRfBICvstj-85N0Yyz_vmSqgknuFi0L366WNyptCc'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function run() {
    console.log('Checking lms_content_progress columns and constraints...')

    const { data, error } = await supabase.from('lms_content_progress').select('*').limit(1)
    if (error) {
        console.error('Error:', error.message)
    } else {
        console.log('Sample Data:', data[0])
        console.log('Columns:', Object.keys(data[0] || {}))
    }
}
run()
