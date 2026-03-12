import { redirect } from 'next/navigation'

/**
 * Public registration is disabled.
 * All user accounts must be created by authorized admins.
 * This page redirects to /login.
 */
export default function RegisterPage() {
    redirect('/login')
}
