import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
    exchangeLinearCode,
    getLinearViewer,
    syncLinearTeams,
    encryptToken,
} from '@/lib/linear'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.redirect(new URL('/settings/integrations?error=linear_denied', req.url))
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL('/settings/integrations?error=linear_invalid', req.url))
    }

    // Validate CSRF state
    const storedState = req.cookies.get('linear_oauth_state')?.value
    if (!storedState || storedState !== state) {
        return NextResponse.redirect(new URL('/settings/integrations?error=linear_state_mismatch', req.url))
    }

    // Require session
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    const userId = session.user.id

    // Exchange code for access token
    const { accessToken } = await exchangeLinearCode(code)

    // Get Linear user profile
    const linearUser = await getLinearViewer(accessToken)

    // Store encrypted token
    const encrypted = encryptToken(accessToken)
    await prisma.linearUserToken.upsert({
        where: { userId_linearUserId: { userId, linearUserId: linearUser.id } },
        create: {
            userId,
            accessToken: encrypted,
            linearUserId: linearUser.id,
            email: linearUser.email,
        },
        update: {
            accessToken: encrypted,
            email: linearUser.email,
        },
    })

    // Kick off a background team/cycle sync for the user's workspace
    const member = await prisma.workspaceMember.findFirst({ where: { userId } })
    if (member) {
        // Schedule after response — safe on Vercel serverless
        after(() => syncLinearTeams(member.workspaceId, accessToken).catch(console.error))
    }

    // Clear state cookie and redirect back to origin page (or fallback to integrations)
    const returnTo = req.cookies.get('linear_oauth_return_to')?.value
    const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : '/settings/integrations'
    const redirectUrl = new URL(safeReturnTo + (safeReturnTo.includes('?') ? '&' : '?') + 'success=linear_connected', req.url)

    const response = NextResponse.redirect(redirectUrl)
    response.cookies.set('linear_oauth_state', '', { maxAge: 0, path: '/' })
    response.cookies.set('linear_oauth_return_to', '', { maxAge: 0, path: '/' })
    return response
}
