import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'better-auth.session_token'
const SESSION_COOKIE_SECURE = '__Secure-better-auth.session_token'

const PUBLIC_PATHS = ['/login', '/uat/login', '/api/auth', '/api/v1', '/invite', '/_next', '/favicon']

const PORTAL_PATH = '/uat'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
        const hasSession =
            request.cookies.has(SESSION_COOKIE) ||
            request.cookies.has(SESSION_COOKIE_SECURE)

        if (pathname === '/login' && hasSession) {
            return NextResponse.redirect(new URL('/', request.url))
        }

        const reqHeaders = new Headers(request.headers)
        reqHeaders.set('x-pathname', pathname)
        return NextResponse.next({ request: { headers: reqHeaders } })
    }

    const hasSession =
        request.cookies.has(SESSION_COOKIE) ||
        request.cookies.has(SESSION_COOKIE_SECURE)

    if (!hasSession) {
        const target = pathname.startsWith('/uat') ? '/uat/login' : '/login'
        return NextResponse.redirect(new URL(target, request.url))
    }

    // Apply role check to all non-public, non-portal authenticated paths.
    // This deny-by-default approach ensures new routes are protected automatically.
    const needsRoleCheck = !pathname.startsWith(PORTAL_PATH)
    if (needsRoleCheck) {
        try {
            const sessionRes = await fetch(new URL('/api/auth/session-access', request.url), {
                headers: { cookie: request.headers.get('cookie') ?? '' },
            })
            const session = await sessionRes.json()

            if (session.authenticated && session.client && !session.member) {
                return NextResponse.redirect(new URL(PORTAL_PATH, request.url))
            }
        } catch (err) {
            console.error('[middleware] session-access fetch failed', err)
        }
    }

    const reqHeaders = new Headers(request.headers)
    reqHeaders.set('x-pathname', pathname)
    return NextResponse.next({ request: { headers: reqHeaders } })
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
