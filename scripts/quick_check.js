const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    "https://pedhthbsbafqybshaefv.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZGh0aGJzYmFmcXlic2hhZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkwMjA5NywiZXhwIjoyMDg4NDc4MDk3fQ.RLMRfBICvstj-85N0Yyz_vmSqgknuFi0L366WNyptCc"
)

async function check() {
    const email = 'rayyanfv@gmail.com'
    const { data, error } = await supabase
        .from('applications')
        .select('full_name, email')

    console.log('--- ALL APPLICATIONS ---')
    data.forEach(app => console.log(`[${app.email}] - ${app.full_name}`))
}

check()
