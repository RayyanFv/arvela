import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

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
                        // Using modern header techniques for setting tokens via res.cookie in Next.js ServerActions/Middleware
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

    let role = user?.user_metadata?.role || 'user'
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // If DB profile found, it takes precedence
        if (profile?.role) {
            role = profile.role
        }
    }

    const url = request.nextUrl.clone()

    // Roles detected in Arvela System:
    // Admin: super_admin, hr, hiring_manager, boss
    // Staff: employee
    // Public: candidate, user

    const ADMIN_ROLES = ['hr', 'super_admin', 'hiring_manager', 'boss']
    const isAdmin = ADMIN_ROLES.includes(role)
    const isEmployee = role === 'employee'
    const isCandidate = role === 'candidate'

    // --- ACCESS CONTROL LOGIC ---

    // 1. Restriction: ONLY Admin can access /dashboard
    if (url.pathname.startsWith('/dashboard')) {
        if (!isAdmin) {
            url.pathname = isEmployee ? '/staff' : '/portal'
            return NextResponse.redirect(url)
        }
    }

    // 2. Restriction: ONLY Employees or Admins can access /staff
    if (url.pathname.startsWith('/staff')) {
        if (!isEmployee && !isAdmin) {
            url.pathname = '/portal'
            return NextResponse.redirect(url)
        }
    }

    // 3. Handle Login Page Redirection (Redirect authenticated users away from /login)
    if (url.pathname === '/login' || url.pathname === '/portal/login') {
        if (user) {
            if (isAdmin) url.pathname = '/dashboard'
            else if (isEmployee) url.pathname = '/staff'
            else url.pathname = '/portal'
            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
