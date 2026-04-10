import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { buildLinearAuthUrl } from '@/lib/linear'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const WRITE_ROLES = ['OWNER', 'ADMIN', 'MANAGER']

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // OWNER/ADMIN/MANAGER may use portal preview (writes) — request read,write scope
    // MEMBER/CONTRACTOR only need read (issue picker in timer)
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { role: true },
    })
    const scope = member && WRITE_ROLES.includes(member.role) ? 'read,write' : 'read'

    // Generate a random state to prevent CSRF — store in cookie
    const state = crypto.randomBytes(16).toString('hex')
    const authUrl = buildLinearAuthUrl(state, scope)

    // Optional returnTo — validated to only allow relative paths
    const returnTo = req.nextUrl.searchParams.get('returnTo')
    const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : '/settings/integrations'

    const response = NextResponse.redirect(authUrl)
    const cookieOpts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 5,
        path: '/',
    }
    response.cookies.set('linear_oauth_state', state, cookieOpts)
    response.cookies.set('linear_oauth_return_to', safeReturnTo, cookieOpts)
    return response
}
