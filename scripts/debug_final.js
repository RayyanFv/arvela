const { createClient } = require('@supabase/supabase-js')

const URL = "https://pedhthbsbafqybshaefv.supabase.co"
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZGh0aGJzYmFmcXlic2hhZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkwMjA5NywiZXhwIjoyMDg4NDc4MDk3fQ.RLMRfBICvstj-85N0Yyz_vmSqgknuFi0L366WNyptCc"

async function debug() {
    const supabase = createClient(URL, KEY)
    const token = 'c3a51d7e-64f8-4de1-8b82-9228e1b5fc1c'

    console.log('Checking assignment for token:', token)

    const { data, error } = await supabase
        .from('assessment_assignments')
        .select('id, status, token')
        .or(`id.eq.${token},token.eq.${token}`)
        .maybeSingle()

    if (error) {
        console.error('SQL Error:', error.message)
    } else if (!data) {
        console.log('RECORD NOT FOUND IN DB!')
    } else {
        console.log('RECORD FOUND:', data)
    }
}

debug()
