import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { decryptToken, getLinearProjectsForTeam } from '@/lib/linear'

/**
 * GET /api/linear/projects?teamId=xxx
 *
 * Returns Linear projects for a given team using the current user's token.
 * Used in Project Settings to let admins pick an optional project-level mapping.
 */
export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teamId = req.nextUrl.searchParams.get('teamId')
    if (!teamId) return NextResponse.json({ error: 'Missing teamId' }, { status: 400 })

    const tokenRecord = await prisma.linearUserToken.findFirst({ where: { userId: session.user.id } })
    if (!tokenRecord) return NextResponse.json([])

    try {
        const accessToken = decryptToken(tokenRecord.accessToken)
        const projects = await getLinearProjectsForTeam(accessToken, teamId)
        return NextResponse.json(projects)
    } catch (err) {
        console.error('[Linear] /api/linear/projects error:', err)
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }
}
