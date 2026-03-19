import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

// Role constants (duplicated from lib/constants/roles.js because middleware
// runs in the Edge runtime and can't import from 'use server' modules reliably)
const ADMIN_ROLES = ['super_admin', 'owner', 'hr_admin']

// --- Granular Permissions Mapping ---
const ROLE_PERMISSIONS = {
    super_admin: ['/dashboard', '/dashboard/settings'],
    owner: ['/dashboard'], // owner typically has access to everything but let's be explicit
    hr_admin: ['/dashboard'],
}

export async function middleware(request) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // IMPORTANT: Only use user_metadata from JWT here.
    // DO NOT query the profiles table in middleware — it uses the anon key
    // which triggers RLS evaluation and causes 403 errors.
    const role = user?.user_metadata?.role || 'user'

    const url = request.nextUrl.clone()
    const path = url.pathname

    const isAdmin = ADMIN_ROLES.includes(role)
    const isEmployee = role === 'employee'
    const isCandidate = role === 'candidate'

    // 1. Dashboard Access Control
    if (path.startsWith('/dashboard')) {
        if (!isAdmin) {
            url.pathname = isEmployee ? '/staff' : '/portal'
            return NextResponse.redirect(url)
        }
    }

    // 2. Staff Access Control
    if (path.startsWith('/staff')) {
        if (!isEmployee && !isAdmin) {
            url.pathname = '/portal'
            return NextResponse.redirect(url)
        }
    }

    // 3. Auth Page Redirection
    if (path === '/login' || path === '/portal/login') {
        if (user) {
            if (isAdmin) url.pathname = '/dashboard'
            else if (isEmployee) url.pathname = '/staff'
            else url.pathname = '/portal'
            return NextResponse.redirect(url)
        }
    }
    
    // Block registration
    if (path === '/register') {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
