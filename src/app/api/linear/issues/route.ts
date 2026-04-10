import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { decryptToken, LinearIssueInfo } from '@/lib/linear'
import { createClient as createLinearGenqlClient } from '@/lib/linear-genql'

/**
 * GET /api/linear/issues?projectId=xxx
 *
 * Fetches Linear issues for the team mapped to the given project.
 * Uses the current user's own Linear token (user-scoped, not shared).
 * Filters: only active states (not completed/canceled), all assignees (team view).
 *
 * RBAC: Any authenticated user with a connected Linear account can use this.
 *       If either the project has no linearTeamId or the user has no token → returns [].
 */
export async function GET(req: NextRequest) {
    // 1. Auth
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Read projectId from query
    const projectId = req.nextUrl.searchParams.get('projectId')
    if (!projectId) {
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    // 3. Look up the project's mapped Linear team and ensure user has access
    const project = await prisma.teifiProject.findFirst({
        where: {
            id: projectId,
            workspace: { members: { some: { userId: session.user.id } } }
        },
        select: { linearTeamId: true, linearProjectId: true },
    })

    if (!project) {
        return NextResponse.json({ error: 'Unauthorized or project not found' }, { status: 403 })
    }

    if (!project.linearTeamId) {
        // No team mapped — return empty list gracefully
        return NextResponse.json([])
    }

    // 4. Get this user's Linear token
    const tokenRecord = await prisma.linearUserToken.findFirst({
        where: { userId: session.user.id },
    })

    if (!tokenRecord) {
        return NextResponse.json([])
    }

    const accessToken = decryptToken(tokenRecord.accessToken)
    const teamId = project.linearTeamId
    const linearProjectId = project.linearProjectId

    // 5. Fetch issues via genql (type-safe, single request, no N+1)
    try {
        const client = createLinearGenqlClient({
            headers: { Authorization: `Bearer ${accessToken}` },
        })

        const data = await client.query({
            issues: {
                __args: {
                    filter: {
                        team: { id: { eq: teamId } },
                        state: { type: { nin: ['completed', 'canceled'] } },
                        // When a specific Linear project is mapped, scope issues to it
                        ...(linearProjectId ? { project: { id: { eq: linearProjectId } } } : {}),
                    },
                    first: 100,
                    orderBy: 'updatedAt' as const,
                },
                nodes: {
                    id: true,
                    identifier: true,
                    title: true,
                    url: true,
                    state: { name: true },
                    team: { id: true },
                    assignee: { id: true, name: true },
                },
            },
        })

        // Deduplicate by issue ID
        const uniqueIssues = new Map<string, LinearIssueInfo>()
        for (const issue of (data.issues?.nodes ?? [])) {
            if (issue.id && !uniqueIssues.has(issue.id)) {
                uniqueIssues.set(issue.id, {
                    id: issue.id,
                    identifier: issue.identifier ?? '',
                    title: issue.title ?? '',
                    state: issue.state?.name ?? '',
                    url: issue.url ?? '',
                    teamId: issue.team?.id ?? teamId,
                })
            }
        }

        return NextResponse.json(Array.from(uniqueIssues.values()))
    } catch (err) {
        console.error('[Linear] /api/linear/issues error:', err)
        return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 })
    }
}
