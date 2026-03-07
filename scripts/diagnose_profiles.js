const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

function parseEnv() {
    const env = fs.readFileSync('.env', 'utf8')
    const envDict = {}
    env.split('\n').forEach(line => {
        if (line.includes('=')) {
            const [k, ...rest] = line.split('=')
            envDict[k.trim()] = rest.join('=').trim().replace(/^"|"$/g, '')
        }
    })
    return envDict
}

async function diagnose() {
    const envData = parseEnv()
    const supabase = createClient(
        envData.NEXT_PUBLIC_SUPABASE_URL,
        envData.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('=== Auth Users ===')
    const { data: users, error: ue } = await supabase.auth.admin.listUsers()
    if (ue) { console.error('Error listing users:', ue.message); return }

    console.table(users.users.map(u => ({
        id: u.id,
        email: u.email,
        meta_company_name: u.user_metadata?.company_name || '—',
        meta_role: u.user_metadata?.role || '—'
    })))

    console.log('\n=== Profiles ===')
    const { data: profiles, error: pe } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, company_id, companies(name, slug)')

    if (pe) { console.error('Error listing profiles:', pe.message); return }

    if (!profiles.length) {
        console.log('⚠️  NO PROFILES FOUND!')
    } else {
        console.table(profiles.map(p => ({
            id: p.id.slice(0, 8) + '...',
            email: p.email,
            role: p.role,
            company_id: p.company_id ? p.company_id.slice(0, 8) + '...' : 'NULL ❌',
            company_name: p.companies?.name || 'NULL ❌',
            company_slug: p.companies?.slug || '—'
        })))
    }

    console.log('\n=== Users without profiles ===')
    const profileIds = new Set(profiles.map(p => p.id))
    const orphaned = users.users.filter(u => !profileIds.has(u.id))
    if (orphaned.length === 0) {
        console.log('✅ All users have profiles')
    } else {
        console.log('⚠️  Users WITH NO PROFILE:')
        orphaned.forEach(u => console.log(`  - ${u.email} (${u.id})`))

        console.log('\n=== Auto-repairing missing profiles... ===')
        for (const u of orphaned) {
            const companyName = u.user_metadata?.company_name
            let companyId = null

            if (companyName) {
                let slug = companyName.toLowerCase().replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'company'
                let counter = 1
                let finalSlug = slug

                while (true) {
                    const { data: existing } = await supabase
                        .from('companies')
                        .select('id')
                        .eq('slug', finalSlug)
                        .single()
                    if (!existing) break
                    finalSlug = `${slug}-${counter++}`
                }

                const { data: company, error: ce } = await supabase
                    .from('companies')
                    .insert({ name: companyName, slug: finalSlug })
                    .select('id')
                    .single()

                if (ce) {
                    console.error(`  ❌ Could not create company for ${u.email}:`, ce.message)
                    continue
                }
                companyId = company.id
                console.log(`  ✅ Created company: ${companyName} (slug: ${finalSlug})`)
            }

            const { error: prErr } = await supabase
                .from('profiles')
                .insert({
                    id: u.id,
                    company_id: companyId,
                    full_name: u.user_metadata?.full_name || u.email.split('@')[0],
                    email: u.email,
                    role: u.user_metadata?.role || 'hr'
                })

            if (prErr) {
                console.error(`  ❌ Could not create profile for ${u.email}:`, prErr.message)
            } else {
                console.log(`  ✅ Created profile for: ${u.email} (company_id: ${companyId || 'null'})`)
            }
        }
    }
}

diagnose().catch(console.error)
