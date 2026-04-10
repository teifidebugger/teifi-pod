import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/app/actions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/linear-genql'
import { LinearAllocationView } from './LinearAllocationView'

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

export type InvolvedUser = {
    id: string
    name: string
    avatarUrl: string | null
}

export type LinearIssue = {
    id: string
    identifier: string
    title: string
    url: string
    priority: number | null
    dueDate: string | null
    updatedAt: string | null
    estimate: number | null
    stateName: string
    teamName: string
    projectName: string | null
    /** People who interacted with this issue (moved state, commented, etc.) — excludes assignee */
    involvedUsers: InvolvedUser[]
}

export type WeekAllocation = {
    projectCode: string
    projectName: string
    linearTeamName: string | null
    hoursPerDay: number
}

export type MemberAllocationData = {
    memberId: string
    name: string
    email: string
    avatarUrl: string | null
    roles: string[]
    hasLinearToken: boolean
    /** Linear user ID — used for cross-member involvement matching */
    linearUserId: string | null
    isPlaceholder: boolean
    issues: LinearIssue[]
    /** Linear team names from assigned Forecast projects (via TeifiProject.linearTeam) */
    allocatedTeams: string[]
    /** Current-week schedule allocations from Forecast */
    currentWeekAllocations: WeekAllocation[]
    // computed
    ipTasks: number
    ipPts: number
    ipUnestimated: number
    totalTasks: number
    totalPts: number
    coveragePct: number
}

export type LinearReportFilters = {
    q: string
    team: string
    role: string
    sort: 'ip_desc' | 'tasks_desc' | 'coverage_asc' | 'name_asc' | 'default'
}

function sortMembers(members: MemberAllocationData[], sort: LinearReportFilters['sort']): MemberAllocationData[] {
    const sorted = [...members]
    switch (sort) {
        case 'ip_desc':
            return sorted.sort((a, b) => b.ipTasks - a.ipTasks || b.ipPts - a.ipPts)
        case 'tasks_desc':
            return sorted.sort((a, b) => b.totalTasks - a.totalTasks)
        case 'coverage_asc':
            return sorted.sort((a, b) => {
                if (!a.hasLinearToken && !b.hasLinearToken) return 0
                if (!a.hasLinearToken) return 1
                if (!b.hasLinearToken) return -1
                return a.coveragePct - b.coveragePct
            })
        case 'name_asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name))
        default:
            return sorted
    }
}

export default async function LinearReportPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>
}) {
    const params = await searchParams
    const q = (params.q ?? '').toLowerCase().trim()
    const teamFilter = params.team ?? ''
    const roleFilter = params.role ?? ''
    const sort = (['ip_desc', 'tasks_desc', 'coverage_asc', 'name_asc'].includes(params.sort)
        ? params.sort
        : 'default') as LinearReportFilters['sort']

    const user = await getSessionUser()

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { workspaceId: true, role: true, id: true },
    })
    if (!member) redirect('/')
    const isAdmin = ['OWNER', 'ADMIN', 'MANAGER'].includes(member.role)

    const apiKey = process.env.LINEAR_SERVICE_ACCOUNT_API_KEY
    if (!apiKey) {
        return (
            <div className="flex-1 space-y-6 pt-6 px-8">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Schedule vs Linear</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Cross-reference Forecast schedule allocations with active Linear workload.
                    </p>
                </div>
                <div className="border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-4 py-2.5 rounded-md">
                    <p className="text-sm text-foreground/80">
                        <span className="font-medium text-foreground">LINEAR_SERVICE_ACCOUNT_API_KEY</span> is not
                        configured. Add it to your environment variables to enable this report.
                    </p>
                </div>
            </div>
        )
    }

    const today = new Date()

    // Check snapshot cache (< 30 min old → serve from DB)
    const SNAPSHOT_TTL_MS = 30 * 60 * 1000
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapshot = await (prisma as any).linearAllocationSnapshot.findUnique({
        where: { workspaceId: member.workspaceId },
    })
    const snapshotAge = snapshot ? today.getTime() - new Date(snapshot.fetchedAt).getTime() : Infinity
    const useSnapshot = snapshotAge < SNAPSHOT_TTL_MS

    const [members, placeholders, projectMembers, weekAllocations] = await Promise.all([
        prisma.workspaceMember.findMany({
            where: { workspaceId: member.workspaceId },
            include: {
                user: {
                    include: { linearTokens: { take: 1, orderBy: { updatedAt: 'desc' } } },
                },
            },
            orderBy: { joinedAt: 'asc' },
        }),
        prisma.placeholder.findMany({
            where: { workspaceId: member.workspaceId, archivedAt: null },
            orderBy: { createdAt: 'asc' },
        }),
        prisma.projectMember.findMany({
            where: {
                project: { workspaceId: member.workspaceId, linearTeamId: { not: null } },
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
                project: { workspaceId: member.workspaceId },
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

    const allRoles = [
        ...new Set([
            ...members.flatMap((m) => m.roles),
            ...placeholders.flatMap((p) => p.roles),
        ]),
    ].sort()

    // Serve from snapshot if fresh enough
    if (useSnapshot) {
        const snapshotData = snapshot!.data as MemberAllocationData[]
        const placeholderData: MemberAllocationData[] = placeholders.map((p) => ({
            memberId: `placeholder:${p.id}`,
            name: p.name,
            email: '',
            avatarUrl: null,
            roles: p.roles,
            hasLinearToken: false,
            linearUserId: null,
            isPlaceholder: true,
            issues: [],
            allocatedTeams: [],
            currentWeekAllocations: [],
            ipTasks: 0, ipPts: 0, ipUnestimated: 0, totalTasks: 0, totalPts: 0, coveragePct: 0,
        }))
        const allTeams = [...new Set(snapshotData.flatMap((m) => m.issues.map((i) => i.teamName)).filter(Boolean))].sort()
        let filtered = snapshotData
        if (q) filtered = filtered.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
        if (teamFilter) filtered = filtered.filter((m) => m.issues.some((i) => i.teamName === teamFilter))
        if (roleFilter) filtered = filtered.filter((m) => m.roles.includes(roleFilter))
        filtered = sortMembers(filtered, sort)
        if (!isAdmin) filtered = filtered.filter((m) => m.memberId === member!.id)
        return (
            <div className="flex-1 space-y-6 pt-6">
                <div className="px-4 md:px-8">
                    <h2 className="text-xl font-semibold tracking-tight">Schedule vs Linear</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Cross-reference Forecast schedule allocations with active Linear workload.
                    </p>
                </div>
                <LinearAllocationView
                    members={filtered}
                    placeholders={placeholderData}
                    allTeams={allTeams}
                    allRoles={allRoles}
                    fetchedAt={snapshot!.fetchedAt.toISOString()}
                    filters={{ q: params.q ?? '', team: teamFilter, role: roleFilter, sort }}
                />
            </div>
        )
    }

    const genql = createClient({ headers: { Authorization: apiKey } })
    let linearApiError: string | null = null

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
        console.log(`[linear-report] ${uncached.length} members not in DB cache — fetching from Linear API`)
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
            const msg = err instanceof Error ? err.message : String(err)
            console.error('[linear-report] Failed to fetch Linear users list:', msg)
            if (msg.includes('502') || msg.includes('Bad gateway') || msg.includes('503') || msg.includes('504')) {
                linearApiError = 'Linear API is temporarily unavailable (gateway error). Data shown may be incomplete.'
            }
        }
    }

    // Parallel fetch: one Linear query per member, includes history actors inline
    const memberData: MemberAllocationData[] = await Promise.all(
        members.map(async (m) => {
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
                                    actor: {
                                        id: true,
                                        name: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                    },
                })
                issues = (data.issues?.nodes ?? [])
                    .filter((i) => i.id)
                    .map((i) => {
                        // Collect unique actors from history, excluding the assignee themselves
                        const actorMap = new Map<string, InvolvedUser>()
                        for (const h of i.history?.nodes ?? []) {
                            const a = h.actor
                            if (a?.id && a.id !== linearUserId) {
                                actorMap.set(a.id, {
                                    id: a.id,
                                    name: a.name ?? '',
                                    avatarUrl: a.avatarUrl ?? null,
                                })
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
                const msg = err instanceof Error ? err.message : String(err)
                console.error(`[linear-report] Failed to fetch issues for ${m.user.email}:`, msg)
                if (msg.includes('502') || msg.includes('Bad gateway') || msg.includes('503') || msg.includes('504')) {
                    linearApiError = 'Linear API is temporarily unavailable (gateway error). Data shown may be incomplete.'
                }
            }

            const ipIssues = issues.filter((i) => i.stateName === 'In Progress')
            const ipPts = ipIssues.reduce((s, i) => s + (i.estimate ?? 0), 0)
            const ipUnestimated = ipIssues.filter((i) => i.estimate === null).length
            const totalPts = issues.reduce((s, i) => s + (i.estimate ?? 0), 0)
            const estimated = issues.filter((i) => i.estimate !== null).length
            const coveragePct = issues.length > 0 ? Math.round((estimated / issues.length) * 100) : 0

            return {
                ...base,
                issues,
                ipTasks: ipIssues.length,
                ipPts,
                ipUnestimated,
                totalTasks: issues.length,
                totalPts,
                coveragePct,
            }
        }),
    )

    const placeholderData: MemberAllocationData[] = placeholders.map((p) => ({
        memberId: `placeholder:${p.id}`,
        name: p.name,
        email: '',
        avatarUrl: null,
        roles: p.roles,
        hasLinearToken: false,
        linearUserId: null,
        isPlaceholder: true,
        issues: [],
        allocatedTeams: [],
        currentWeekAllocations: [],
        ipTasks: 0,
        ipPts: 0,
        ipUnestimated: 0,
        totalTasks: 0,
        totalPts: 0,
        coveragePct: 0,
    }))

    const fetchedAt = new Date()

    // Upsert snapshot for future requests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (prisma as any).linearAllocationSnapshot.upsert({
        where: { workspaceId: member.workspaceId },
        create: { workspaceId: member.workspaceId, data: memberData as object[], fetchedAt },
        update: { data: memberData as object[], fetchedAt },
    }).catch((err: unknown) => console.error('[linear-report] Failed to upsert snapshot:', err))

    const allTeams = [...new Set(memberData.flatMap((m) => m.issues.map((i) => i.teamName)).filter(Boolean))].sort()

    let filtered = memberData
    if (q) {
        filtered = filtered.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
    }
    if (teamFilter) {
        filtered = filtered.filter((m) => m.issues.some((i) => i.teamName === teamFilter))
    }
    if (roleFilter) {
        filtered = filtered.filter((m) => m.roles.includes(roleFilter))
    }
    filtered = sortMembers(filtered, sort)
    if (!isAdmin) filtered = filtered.filter((m) => m.memberId === member.id)

    return (
        <div className="flex-1 space-y-6 pt-6">
            <div className="px-4 md:px-8">
                <h2 className="text-xl font-semibold tracking-tight">Schedule vs Linear</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Cross-reference Forecast schedule allocations with active Linear workload.
                </p>
            </div>
            {linearApiError && (
                <div className="px-4 md:px-8">
                    <div className="border-l-2 border-l-red-400 border border-border/50 bg-muted/30 px-4 py-2.5 rounded-md">
                        <p className="text-sm text-foreground/80">{linearApiError}</p>
                    </div>
                </div>
            )}
            <LinearAllocationView
                members={filtered}
                placeholders={placeholderData}
                allTeams={allTeams}
                allRoles={allRoles}
                fetchedAt={fetchedAt.toISOString()}
                filters={{ q: params.q ?? '', team: teamFilter, role: roleFilter, sort }}
            />
        </div>
    )
}
