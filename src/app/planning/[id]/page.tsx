import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/app/actions'
import { PodDetailTabs } from './PodDetailTabs'
import type { MemberAllocationData, PodOption, WeekAllocation, CycleOption } from '@/app/reports/linear/page'
import { createClient } from '@/lib/linear-genql'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const ACTIVE_STATES = [
    'In Progress', 'QA', 'Pending Code Review', 'Client Blocked',
    'Client Review', 'Blocked', 'Not Started', 'Evaluation', 'Triage',
]

export default async function PodDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await getSessionUser().catch(() => null)
    if (!user) redirect('/login')

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        select: { workspaceId: true, role: true, id: true },
    })
    if (!member) redirect('/')

    const pod = await prisma.pod.findFirst({
        where: { id, workspaceId: member.workspaceId },
        include: {
            slots: {
                include: {
                    member: {
                        include: {
                            user: { select: { name: true, email: true, image: true } },
                        },
                    },
                },
                orderBy: { roleName: 'asc' },
            },
        },
    })
    if (!pod) notFound()

    const memberIds = pod.slots.map((s) => s.memberId).filter(Boolean) as string[]

    const today = new Date()

    const [projects, allocations, allPods, projectMembers, podMembersDb, cyclesRaw] = await Promise.all([
        prisma.teifiProject.findMany({
            where: { podId: id, status: { not: 'ARCHIVED' } },
            include: { client: { select: { name: true } } },
            orderBy: [{ status: 'asc' }, { name: 'asc' }],
        }),
        prisma.allocation.findMany({
            where: {
                memberId: { in: memberIds },
                endDate: { gte: today },
                startDate: { lte: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000) },
                project: { workspaceId: member.workspaceId },
            },
            include: {
                project: { select: { id: true, name: true, color: true, code: true, linearTeam: { select: { name: true } } } },
                member: { select: { user: { select: { name: true } } } },
            },
            orderBy: { startDate: 'asc' },
        }),
        prisma.pod.findMany({
            where: { workspaceId: member.workspaceId },
            select: { id: true, name: true, slots: { select: { memberId: true } } },
            orderBy: { name: 'asc' },
        }),
        prisma.projectMember.findMany({
            where: { project: { workspaceId: member.workspaceId, linearTeamId: { not: null } } },
            include: { project: { include: { linearTeam: true } } },
        }),
        prisma.workspaceMember.findMany({
            where: { id: { in: memberIds } },
            include: { user: { include: { linearTokens: { take: 1, orderBy: { updatedAt: 'desc' } } } } },
        }),
        prisma.linearCycle.findMany({
            where: { team: { workspaceId: member.workspaceId } },
            include: { team: { select: { name: true } } },
            orderBy: { startsAt: 'desc' },
            take: 30,
        }),
    ])

    const allCycles: CycleOption[] = cyclesRaw.map((c) => ({
        id: c.id,
        number: c.number,
        name: c.name ?? null,
        teamId: c.teamId,
        teamName: c.team.name,
        startsAt: c.startsAt?.toISOString() ?? null,
        endsAt: c.endsAt?.toISOString() ?? null,
    }))

    // Build pod membership map
    const memberPodIds = new Map<string, Set<string>>()
    for (const p of allPods) {
        for (const slot of p.slots) {
            if (!slot.memberId) continue
            const set = memberPodIds.get(slot.memberId) ?? new Set()
            set.add(p.id)
            memberPodIds.set(slot.memberId, set)
        }
    }

    // Build current-week allocations map — reuse allocations already fetched above
    const weekAllocsMap = new Map<string, Map<string, WeekAllocation>>()
    const currentWeekAllocations = allocations.filter(
        (a) => new Date(a.startDate) <= today && new Date(a.endDate) >= today
    )
    for (const a of currentWeekAllocations) {
        if (!a.memberId) continue
        const byProject = weekAllocsMap.get(a.memberId) ?? new Map()
        const existing = byProject.get(a.projectId)
        if (!existing || a.hoursPerDay > existing.hoursPerDay) {
            byProject.set(a.projectId, {
                projectCode: a.project.code ?? a.project.name.slice(0, 6),
                projectName: a.project.name,
                linearTeamName: a.project.linearTeam?.name ?? null,
                hoursPerDay: a.hoursPerDay,
            })
        }
        weekAllocsMap.set(a.memberId, byProject)
    }

    // Build allocated teams map
    const memberAllocatedTeams = new Map<string, Set<string>>()
    for (const pm of projectMembers) {
        const teamName = pm.project.linearTeam?.name
        if (!teamName) continue
        const set = memberAllocatedTeams.get(pm.memberId) ?? new Set()
        set.add(teamName)
        memberAllocatedTeams.set(pm.memberId, set)
    }

    const allPodsOptions: PodOption[] = allPods.map((p) => ({ id: p.id, name: p.name }))

    // Build workload data for pod members
    const apiKey = process.env.LINEAR_SERVICE_ACCOUNT_API_KEY
    let workloadMembers: MemberAllocationData[] = []
    let fetchedAt = new Date().toISOString()

    // Try snapshot first
    const SNAPSHOT_TTL_MS = 30 * 60 * 1000
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapshot = await (prisma as any).linearAllocationSnapshot.findUnique({
        where: { workspaceId: member.workspaceId },
    })
    const snapshotAge = snapshot ? today.getTime() - new Date(snapshot.fetchedAt).getTime() : Infinity

    if (snapshot && snapshotAge < SNAPSHOT_TTL_MS) {
        fetchedAt = snapshot.fetchedAt.toISOString()
        const snapshotData = (snapshot.data as MemberAllocationData[])
            .filter((m) => memberIds.includes(m.memberId))
            .map((m) => ({ ...m, podIds: [...(memberPodIds.get(m.memberId) ?? [])] }))
        workloadMembers = snapshotData
    } else if (apiKey) {
        const genql = createClient({ headers: { Authorization: apiKey } })
        const emailToLinearId = new Map<string, string>()
        for (const m of podMembersDb) {
            const token = m.user.linearTokens[0]
            if (token?.linearUserId) emailToLinearId.set(m.user.email.toLowerCase(), token.linearUserId)
        }

        workloadMembers = await Promise.all(
            podMembersDb.map(async (m) => {
                const linearUserId = emailToLinearId.get(m.user.email.toLowerCase())
                const base = {
                    memberId: m.id,
                    name: m.user.name ?? m.user.email,
                    email: m.user.email,
                    avatarUrl: m.user.image ?? null,
                    roles: m.roles,
                    hasLinearToken: !!linearUserId,
                    linearUserId: linearUserId ?? null,
                    isPlaceholder: false,
                    allocatedTeams: [...(memberAllocatedTeams.get(m.id) ?? [])],
                    currentWeekAllocations: [...(weekAllocsMap.get(m.id)?.values() ?? [])],
                    podIds: [...(memberPodIds.get(m.id) ?? [])],
                }
                if (!linearUserId) {
                    return { ...base, issues: [], ipTasks: 0, ipPts: 0, ipUnestimated: 0, totalTasks: 0, totalPts: 0, coveragePct: 0 }
                }
                try {
                    const data = await genql.query({
                        issues: {
                            __args: {
                                filter: { assignee: { id: { eq: linearUserId } }, state: { name: { in: ACTIVE_STATES } } },
                                first: 100,
                                orderBy: 'updatedAt' as 'createdAt',
                            },
                            nodes: {
                                id: true, identifier: true, title: true, url: true,
                                priority: true, dueDate: true, updatedAt: true, estimate: true,
                                state: { name: true }, team: { name: true }, project: { name: true },
                                cycle: { id: true, number: true, name: true },
                                history: {
                                    __args: { first: 25, orderBy: 'createdAt' as const },
                                    nodes: { actor: { id: true, name: true, avatarUrl: true } },
                                },
                            },
                        },
                    })
                    const issues = (data.issues?.nodes ?? []).filter((i) => i.id).map((i) => {
                        const actorMap = new Map()
                        for (const h of i.history?.nodes ?? []) {
                            const a = h.actor
                            if (a?.id && a.id !== linearUserId) actorMap.set(a.id, { id: a.id, name: a.name ?? '', avatarUrl: a.avatarUrl ?? null })
                        }
                        return {
                            id: i.id!, identifier: i.identifier ?? '', title: i.title ?? '', url: i.url ?? '',
                            priority: typeof i.priority === 'number' ? i.priority : null,
                            dueDate: i.dueDate ?? null, updatedAt: i.updatedAt ?? null,
                            estimate: typeof i.estimate === 'number' ? i.estimate : null,
                            stateName: i.state?.name ?? '', teamName: i.team?.name ?? '',
                            projectName: i.project?.name ?? null,
                            cycle: i.cycle?.id ? { id: i.cycle.id, number: i.cycle.number ?? 0, name: i.cycle.name ?? null } : null,
                            involvedUsers: [...actorMap.values()],
                        }
                    })
                    const ip = issues.filter((i) => i.stateName === 'In Progress')
                    const ipPts = ip.reduce((s, i) => s + (i.estimate ?? 0), 0)
                    const ipUnestimated = ip.filter((i) => i.estimate === null).length
                    const totalPts = issues.reduce((s, i) => s + (i.estimate ?? 0), 0)
                    const estimated = issues.filter((i) => i.estimate !== null).length
                    const coveragePct = issues.length > 0 ? Math.round((estimated / issues.length) * 100) : 0
                    return { ...base, issues, ipTasks: ip.length, ipPts, ipUnestimated, totalTasks: issues.length, totalPts, coveragePct }
                } catch {
                    return { ...base, issues: [], ipTasks: 0, ipPts: 0, ipUnestimated: 0, totalTasks: 0, totalPts: 0, coveragePct: 0 }
                }
            })
        )
    }

    const allTeams = [...new Set(workloadMembers.flatMap((m) => m.issues.map((i) => i.teamName)).filter(Boolean))].sort()
    const allRoles = [...new Set(workloadMembers.flatMap((m) => m.roles))].sort()

    return (
        <div className="flex-1 space-y-6 pt-6 max-w-6xl">
            <div className="flex items-center gap-3">
                <Link
                    href="/planning"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
                >
                    <ChevronLeft className="size-4" />
                    Pods
                </Link>
                <span className="text-muted-foreground/40">/</span>
                <h1 className="text-xl font-semibold tracking-tight">{pod.name}</h1>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border border-border/50 bg-muted/50">
                    {pod.type === 'DELIVERY' ? 'Delivery' : pod.type === 'SUPPORT' ? 'Support' : 'Shared Services'}
                </span>
            </div>

            <PodDetailTabs
                pod={{ id: pod.id, name: pod.name, type: pod.type }}
                slots={pod.slots.map((s) => ({
                    id: s.id,
                    roleName: s.roleName,
                    allocationPercent: s.allocationPercent,
                    memberId: s.memberId,
                    memberName: s.member?.user.name ?? null,
                    memberEmail: s.member?.user.email ?? null,
                    memberImage: s.member?.user.image ?? null,
                    memberRoles: s.member?.roles ?? [],
                }))}
                projects={projects.map((p) => ({
                    id: p.id,
                    name: p.name,
                    color: p.color,
                    status: p.status,
                    clientName: p.client?.name ?? null,
                    startsOn: p.startsOn?.toISOString() ?? null,
                    endsOn: p.endsOn?.toISOString() ?? null,
                    budgetHours: p.budgetHours,
                }))}
                allocations={allocations.map((a) => ({
                    id: a.id,
                    memberId: a.memberId,
                    memberName: a.member?.user.name ?? null,
                    projectId: a.projectId,
                    projectName: a.project.name,
                    projectColor: a.project.color,
                    startDate: a.startDate.toISOString(),
                    endDate: a.endDate.toISOString(),
                    hoursPerDay: a.hoursPerDay,
                }))}
                workloadMembers={workloadMembers}
                allTeams={allTeams}
                allRoles={allRoles}
                allPods={allPodsOptions}
                allCycles={allCycles}
                fetchedAt={fetchedAt}
                hasLinearKey={!!apiKey}
            />
        </div>
    )
}
