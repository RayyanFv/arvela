const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

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

async function fixStoragePolicy() {
    const envData = parseEnv()
    const url = envData.NEXT_PUBLIC_SUPABASE_URL
    const key = envData.SUPABASE_SERVICE_ROLE_KEY

    // We cannot easily run raw SQL from JS client.
    // So let's create a server action inside Next.js to upload! Alternatively, if the bucket cvs works fine... Wait, what was the error before?
    // "Gagal mengunggah CV. Pastikan ukuran dan format file sesuai." - That's because supabase upload error occurs!
}
