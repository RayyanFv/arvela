require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser(email) {
    console.log(`Checking user: ${email}`);

    // 1. Get from Profiles
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (pError) {
        console.error('Profile Error:', pError.message);
    } else {
        console.log('Profile Role:', profile.role);
    }

    // 2. Get from Auth
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found in Auth');
    } else {
        console.log('Auth Metadata Role:', user.user_metadata?.role);

        if (profile && profile.role !== user.user_metadata?.role) {
            console.warn('MISMATCH DETECTED! Auth metadata does not match profile role.');
            console.log('Updating Auth Metadata to match Profile...');

            const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
                user_metadata: { role: profile.role }
            });

            if (updateError) {
                console.error('Update Error:', updateError.message);
            } else {
                console.log('SUCCESS: Auth metadata updated.');
            }
        } else {
            console.log('Roles match.');
        }
    }
}

const emailToCheck = process.argv[2];
if (!emailToCheck) {
    console.log('Usage: node check_user_role.js <email>');
} else {
    checkUser(emailToCheck);
}
