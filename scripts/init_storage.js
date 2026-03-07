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

async function setupStorage() {
    const envData = parseEnv()
    const url = envData.NEXT_PUBLIC_SUPABASE_URL
    const key = envData.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        console.error("Missing Superbase keys")
        return
    }

    const supabaseAdmin = createClient(url, key)

    // Attempt to create bucket 'cvs'
    const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket('cvs', {
        public: true,
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 5242880 // 5MB
    })

    if (createError) {
        if (createError.message.includes('already exists') || createError.message.includes('Duplicate')) {
            console.log("Bucket 'cvs' might already exist. Updating to public just in case.")
            const { error: updateError } = await supabaseAdmin.storage.updateBucket('cvs', {
                public: true,
                allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                fileSizeLimit: 5242880 // 5MB
            })
            if (updateError) {
                console.error("Error updating bucket:", updateError.message)
            } else {
                console.log("Bucket 'cvs' updated successfully.")
            }
        } else {
            console.error("Error creating bucket:", createError.message)
        }
    } else {
        console.log("Bucket 'cvs' created successfully:", createData)
    }
}

setupStorage()
