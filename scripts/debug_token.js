const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

async function checkToken() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const token = '40ded0c0-dcd9-42a3-802c-4de7253c058a'

    const { data, error } = await supabase
        .from('assessment_assignments')
        .select('id, status, token')
        .eq('token', token)
        .single()

    if (error) {
        console.error('Error fetching token:', error.message)
    } else {
        console.log('Token found:', data)
    }
}

checkToken()
