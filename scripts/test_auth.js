const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const env = fs.readFileSync('.env', 'utf8')
const envDict = {}
env.split('\n').forEach(line => {
    if (line.includes('=')) {
        const [k, v] = line.split('=')
        envDict[k.trim()] = v.trim().replace(/^"|"$/g, '')
    }
})

const URL = envDict.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = envDict.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = envDict.SUPABASE_SERVICE_ROLE_KEY

async function main() {
    const supabaseAdmin = createClient(URL, SERVICE_KEY)
    const supabase = createClient(URL, ANON_KEY)

    console.log("Signing up dummy...")
    const dummyEmail = `dummy_${Date.now()}@test.com`
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: 'password123',
        options: {
            data: { company_name: 'Test Corp', full_name: 'Mr Test', role: 'hr' }
        }
    })

    if (authError) return console.error("Signup error:", authError)

    console.log("Signup success:", authData.user.id)
    await new Promise(r => setTimeout(r, 2000))

    console.log("Querying profile with user's access token...")
    // In @supabase/supabase-js, signing up automatically logs in and sets session
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, company_id, role, full_name')
        .eq('id', authData.user.id)
        .single()

    console.log("Profile Result:", profile, "Error:", profileError?.message)

    console.log("Querying company with user's access token...")
    if (profile) {
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single()
        console.log("Company Result:", company, "Error:", companyError?.message)
    }

    // Cleanup
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
}
main()
