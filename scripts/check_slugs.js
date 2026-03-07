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

    const { data: jobs } = await sb.from('jobs').select('title, slug, status, companies(name, slug)')

    console.log('--- JOBS SLUGS ---')
    jobs?.forEach(j => {
        console.log(`Job: ${j.title} | Slug: ${j.slug} | Status: ${j.status} | Co: ${j.companies?.name} | Co Slug: ${j.companies?.slug}`);
    })
}

check().catch(console.error)
