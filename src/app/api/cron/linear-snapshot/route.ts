import { NextRequest, NextResponse } from 'next/server'
import pLimit from 'p-limit'

export const maxDuration = 60
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/linear-genql'
import type { MemberAllocationData, LinearIssue, WeekAllocation } from '@/app/reports/linear/page'

const ACTIVE_STATES = [
    'In Progress',
    'QA',
    'Pending Code Review',
    'Client Blocked',
    'Client Review',
    'Blocked',
    'Not Started',
    'Evaluation',
    'Triage',
]

export async function GET(req: NextRequest) {
    const secret = process.env.CRON_SECRET
    if (secret) {
        const auth = req.headers.get('authorization')
        if (auth !== `Bearer ${secret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    const apiKey = process.env.LINEAR_SERVICE_ACCOUNT_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'LINEAR_SERVICE_ACCOUNT_API_KEY not configured' }, { status: 500 })
    }

    const workspace = await prisma.workspace.findFirst({ select: { id: true } })
    if (!workspace) {
        return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const today = new Date()

    const [members, projectMembers, weekAllocations] = await Promise.all([
        prisma.workspaceMember.findMany({
            where: { workspaceId: workspace.id },
            include: {
                user: {
                    include: { linearTokens: { take: 1, orderBy: { updatedAt: 'desc' } } },
                },
            },
            orderBy: { joinedAt: 'asc' },
        }),
        prisma.projectMember.findMany({
            where: {
                project: { workspaceId: workspace.id, linearTeamId: { not: null } },
            },
            include: {
                project: { include: { linearTeam: true } },
            },
        }),
        prisma.allocation.findMany({
            where: {
                startDate: { lte: today },
                endDate: { gte: today },
                memberId: { not: null },
                project: { workspaceId: workspace.id },
            },
            include: {
                project: { select: { code: true, name: true, linearTeam: { select: { name: true } } } },
            },
        }),
    ])

    // Build memberId → allocated Linear team names map
    const memberAllocatedTeams = new Map<string, Set<string>>()
    for (const pm of projectMembers) {
        const teamName = pm.project.linearTeam?.name
        if (!teamName) continue
        const set = memberAllocatedTeams.get(pm.memberId) ?? new Set()
        set.add(teamName)
        memberAllocatedTeams.set(pm.memberId, set)
    }

    // Build memberId → current-week allocations map (deduplicated by project, highest hours wins)
    const memberWeekAllocsMap = new Map<string, Map<string, WeekAllocation>>()
    for (const a of weekAllocations) {
        if (!a.memberId) continue
        const byProject = memberWeekAllocsMap.get(a.memberId) ?? new Map<string, WeekAllocation>()
        const existing = byProject.get(a.projectId)
        if (!existing || a.hoursPerDay > existing.hoursPerDay) {
            byProject.set(a.projectId, {
                projectCode: a.project.code ?? a.project.name.slice(0, 6),
                projectName: a.project.name,
                linearTeamName: a.project.linearTeam?.name ?? null,
                hoursPerDay: a.hoursPerDay,
            })
        }
        memberWeekAllocsMap.set(a.memberId, byProject)
    }
    const memberWeekAllocs = new Map<string, WeekAllocation[]>()
    for (const [memberId, byProject] of memberWeekAllocsMap) {
        memberWeekAllocs.set(memberId, [...byProject.values()])
    }

    const genql = createClient({ headers: { Authorization: apiKey } })

    // Build email → linearUserId map (DB cache first, live API fallback)
    const emailToLinearId = new Map<string, string>()
    for (const m of members) {
        const token = m.user.linearTokens[0]
        if (token?.linearUserId) {
            emailToLinearId.set(m.user.email.toLowerCase(), token.linearUserId)
        }
    }

    const uncached = members.filter((m) => !emailToLinearId.has(m.user.email.toLowerCase()))
    if (uncached.length > 0) {
        try {
            const usersData = await genql.query({
                users: {
                    __args: { first: 250 },
                    nodes: { id: true, email: true },
                },
            })
            for (const u of usersData.users?.nodes ?? []) {
                if (u.id && u.email) emailToLinearId.set(u.email.toLowerCase(), u.id)
            }
        } catch (err) {
            console.error('[linear-snapshot] Failed to fetch Linear users list:', err)
        }
    }

    // Fetch issues for each member — concurrency limited to avoid Linear rate limits
    const limit = pLimit(5)
    const memberData: MemberAllocationData[] = await Promise.all(
        members.map((m) => limit(async () => {
            const linearUserId = emailToLinearId.get(m.user.email.toLowerCase())
            const base: Omit<MemberAllocationData, 'issues' | 'ipTasks' | 'ipPts' | 'ipUnestimated' | 'totalTasks' | 'totalPts' | 'coveragePct'> = {
                memberId: m.id,
                name: m.user.name ?? m.user.email,
                email: m.user.email,
                avatarUrl: m.user.image ?? null,
                roles: m.roles,
                hasLinearToken: !!linearUserId,
                linearUserId: linearUserId ?? null,
                isPlaceholder: false,
                allocatedTeams: [...(memberAllocatedTeams.get(m.id) ?? [])],
                currentWeekAllocations: memberWeekAllocs.get(m.id) ?? [],
                podIds: [],
            }

            if (!linearUserId) {
                return { ...base, issues: [], ipTasks: 0, ipPts: 0, ipUnestimated: 0, totalTasks: 0, totalPts: 0, coveragePct: 0 }
            }

            let issues: LinearIssue[] = []
            try {
                const data = await genql.query({
                    issues: {
                        __args: {
                            filter: {
                                assignee: { id: { eq: linearUserId } },
                                state: { name: { in: ACTIVE_STATES } },
                            },
                            first: 100,
                            orderBy: 'updatedAt' as 'createdAt',
                        },
                        nodes: {
                            id: true,
                            identifier: true,
                            title: true,
                            url: true,
                            priority: true,
                            dueDate: true,
                            updatedAt: true,
                            estimate: true,
                            state: { name: true },
                            team: { name: true },
                            project: { name: true },
                            history: {
                                __args: { first: 25, orderBy: 'createdAt' as const },
                                nodes: {
                                    actor: { id: true, name: true, avatarUrl: true },
                                },
                            },
                        },
                    },
                })
                issues = (data.issues?.nodes ?? [])
                    .filter((i) => i.id)
                    .map((i) => {
                        const actorMap = new Map<string, { id: string; name: string; avatarUrl: string | null }>()
                        for (const h of i.history?.nodes ?? []) {
                            const a = h.actor
                            if (a?.id && a.id !== linearUserId) {
                                actorMap.set(a.id, { id: a.id, name: a.name ?? '', avatarUrl: a.avatarUrl ?? null })
                            }
                        }
                        return {
                            id: i.id!,
                            identifier: i.identifier ?? '',
                            title: i.title ?? '',
                            url: i.url ?? '',
                            priority: typeof i.priority === 'number' ? i.priority : null,
                            dueDate: i.dueDate ?? null,
                            updatedAt: i.updatedAt ?? null,
                            estimate: typeof i.estimate === 'number' ? i.estimate : null,
                            stateName: i.state?.name ?? '',
                            teamName: i.team?.name ?? '',
                            projectName: i.project?.name ?? null,
                            involvedUsers: [...actorMap.values()],
                        }
                    })
            } catch (err) {
                console.error(`[linear-snapshot] Failed to fetch issues for ${m.user.email}:`, err)
            }

            const ipIssues = issues.filter((i) => i.stateName === 'In Progress')
            const ipPts = ipIssues.reduce((s, i) => s + (i.estimate ?? 0), 0)
            const ipUnestimated = ipIssues.filter((i) => i.estimate === null).length
            const totalPts = issues.reduce((s, i) => s + (i.estimate ?? 0), 0)
            const estimated = issues.filter((i) => i.estimate !== null).length
            const coveragePct = issues.length > 0 ? Math.round((estimated / issues.length) * 100) : 0

            return { ...base, issues, ipTasks: ipIssues.length, ipPts, ipUnestimated, totalTasks: issues.length, totalPts, coveragePct }
        })),
    )

    const fetchedAt = new Date()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).linearAllocationSnapshot.upsert({
        where: { workspaceId: workspace.id },
        create: { workspaceId: workspace.id, data: memberData as object[], fetchedAt },
        update: { data: memberData as object[], fetchedAt },
    })

    return NextResponse.json({ ok: true, count: memberData.length, fetchedAt })
}
