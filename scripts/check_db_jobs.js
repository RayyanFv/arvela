const fs = require('fs')

function parseEnv() {
    const env = fs.readFileSync('.env', 'utf8')
    const envDict = {}
    env.split('\n').forEach(line => {
        if (line.includes('=')) {
            const [k, v] = line.split('=')
            envDict[k.trim()] = v.trim().replace(/^"|"$/g, '')
        }
    })
    return envDict
}

async function main() {
    const envData = parseEnv()
    const url = envData.NEXT_PUBLIC_SUPABASE_URL
    const key = envData.SUPABASE_SERVICE_ROLE_KEY

    const res = await fetch(`${url}/rest/v1/jobs?select=id,title,company_id&apikey=${key}`, {
        headers: {
            'Authorization': `Bearer ${key}`
        }
    })

    const data = await res.json()
    console.log(JSON.stringify(data, null, 2))
}

main().catch(console.error)
