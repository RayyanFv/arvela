const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

function parseEnv() {
    const env = fs.readFileSync('.env', 'utf8')
    const d = {}
    env.split('\n').forEach(l => {
        if (l.includes('=')) {
            const [k, ...v] = l.split('=')
            d[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '')
        }
    })
    return d
}

async function check() {
    const e = parseEnv()
    const sb = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY)

    const { data: profiles } = await sb.from('profiles').select('id,email,company_id')
    const { data: jobs } = await sb.from('jobs').select('id,title,company_id,status')

    console.log('--- PROFILES ---')
    profiles?.forEach(p => console.log(p.email, '| company_id:', p.company_id))

    console.log('\n--- JOBS ---')
    if (!jobs?.length) {
        console.log('NO JOBS IN DATABASE!')
    } else {
        jobs?.forEach(j => console.log(j.title, '| company_id:', j.company_id, '| status:', j.status))
    }

    console.log('\n--- MATCH CHECK (jobs per user) ---')
    profiles?.forEach(p => {
        const matched = jobs?.filter(j => j.company_id === p.company_id)
        console.log(p.email, '->', matched?.length || 0, 'jobs matched')
    })
}

check().catch(console.error)
