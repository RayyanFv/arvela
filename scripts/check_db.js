const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

async function check() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('--- DB Check ---')
    const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: empCount } = await supabase.from('employees').select('*', { count: 'exact', head: true })
    const { data: emps } = await supabase.from('employees').select('*, profiles(full_name, email, department)')

    console.log('Profiles:', profileCount)
    console.log('Employees:', empCount)
    console.log('Employee Data:', JSON.stringify(emps, null, 2))
}

check()
