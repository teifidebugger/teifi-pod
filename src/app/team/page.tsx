import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import { TeamTable, type MemberRow } from "./TeamTable"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import {
    startOfWeek,
    endOfWeek,
    format,
    addWeeks,
    subWeeks,
    parseISO,
    eachDayOfInterval,
    isSameDay,
    differenceInDays,
    getDay,
} from "date-fns"
import { TeamFilter } from "./TeamFilter"
import {
    MemberRoleSelect,
    ManagerSelect,
    EditProfileButton,
    RemoveMemberButton,
    SyncFromLinearButton,
    ManagerPermissions,
    DisableMemberButton,
} from "./MemberActions"
import { InviteButton } from "./InviteButton"
import { MemberSearch } from "./MemberSearch"
import { PendingInvites } from "./PendingInvites"

function initials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}


function utilizationColor(pct: number) {
    if (pct >= 100) return "text-red-500"
    if (pct >= 80) return "text-amber-500"
    return "text-green-600"
}

export default async function TeamPage({
    searchParams,
}: {
    searchParams: Promise<{ week_of?: string; team?: string; view?: string; section?: string; q?: string }>
}) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const callerMember = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { id: true, workspaceId: true, role: true, workspace: { select: { hiddenNavItems: true } } },
    })
    if (!callerMember) redirect("/")

    const hiddenNavItems = callerMember.workspace?.hiddenNavItems ?? []
    const timeHidden = hiddenNavItems.includes("time")

    const sp = await searchParams
    const weekOf = sp.week_of ? parseISO(sp.week_of) : new Date()
    const weekStart = startOfWeek(weekOf, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekOf, { weekStartsOn: 1 })
    const weekOfStr = format(weekStart, "yyyy-MM-dd")
    const weekEndStr = format(weekEnd, "yyyy-MM-dd")

    const prevUrl = `/team?week_of=${format(subWeeks(weekStart, 1), "yyyy-MM-dd")}`
    const nextUrl = `/team?week_of=${format(addWeeks(weekStart, 1), "yyyy-MM-dd")}`

    const isCurrentWeek =
        format(weekStart, "yyyy-MM-dd") === format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")

    const weekLabel = `${format(weekStart, "dd MMM")} – ${format(weekEnd, "dd MMM yyyy")}`

    // Load workspace roles for role editor suggestions
    const workspaceRoles = await prisma.workspaceRole.findMany({
        where: { workspaceId: callerMember.workspaceId },
        orderBy: { name: "asc" },
    })
    const availableRoles = workspaceRoles.map((r) => r.name)

    // Load all members
    const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: callerMember.workspaceId, disabledAt: null },
        include: {
            user: { select: { id: true, name: true, email: true, image: true } },
            allocations: {
                where: { startDate: { lte: weekEnd }, endDate: { gte: weekStart } },
                select: { hoursPerDay: true, startDate: true, endDate: true },
            },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    })

    // Load all time entries for the week
    const timeEntries = await prisma.timeEntry.findMany({
        where: {
            project: { workspaceId: callerMember.workspaceId },
            date: { gte: weekOfStr, lte: weekEndStr },
            timerStartedAt: null,
        },
        include: {
            project: { select: { billingType: true } },
            user: { select: { id: true } },
        },
    })

    // Compute per-member stats
    type MemberStats = {
        hoursTracked: number
        billableSeconds: number
        nonBillableSeconds: number
        scheduledHours: number
        capacity: number
        utilization: number
        billableHours: number
    }

    const statsByMember = new Map<string, MemberStats>()

    for (const m of members) {
        const entries = timeEntries.filter(e => e.user.id === m.user.id)
        const hoursTrackedSec = entries.reduce((s, e) => s + e.durationSeconds, 0)
        const billableSec = entries
            .filter(e => e.project.billingType !== "NON_BILLABLE")
            .reduce((s, e) => s + e.durationSeconds, 0)

        // Scheduled = sum of allocation hoursPerDay * overlap workdays (Mon–Fri)
        let scheduledHours = 0
        for (const alloc of m.allocations) {
            const overlapStart = alloc.startDate > weekStart ? alloc.startDate : weekStart
            const overlapEnd = alloc.endDate < weekEnd ? alloc.endDate : weekEnd
            if (overlapStart <= overlapEnd) {
                const workdays = eachDayOfInterval({ start: overlapStart, end: overlapEnd })
                    .filter(d => { const dow = getDay(d); return dow !== 0 && dow !== 6 }).length
                scheduledHours += alloc.hoursPerDay * workdays
            }
        }

        const capacity = m.weeklyCapacityHours
        const utilization = capacity > 0 ? (hoursTrackedSec / 3600 / capacity) * 100 : 0

        statsByMember.set(m.id, {
            hoursTracked: hoursTrackedSec / 3600,
            billableSeconds: billableSec,
            nonBillableSeconds: hoursTrackedSec - billableSec,
            scheduledHours,
            capacity,
            utilization,
            billableHours: billableSec / 3600,
        })
    }

    // All distinct team names for the filter
    const teams = [...new Set(members.map(m => m.teamName).filter((t): t is string => Boolean(t)))]

    // Apply team filter
    const teamFilter = sp.team && sp.team !== "__all__" ? sp.team : null
    const filteredMembers = teamFilter ? members.filter(m => m.teamName === teamFilter) : members

    // Totals (based on filtered members)
    let totalHours = 0
    let totalCapacity = 0
    let totalBillable = 0
    let totalNonBillable = 0
    for (const m of filteredMembers) {
        const s = statsByMember.get(m.id)!
        totalHours += s.hoursTracked
        totalCapacity += s.capacity
        totalBillable += s.billableHours
        totalNonBillable += s.nonBillableSeconds / 3600
    }
    const totalBillablePct = totalCapacity > 0 ? (totalBillable / totalCapacity) * 100 : 0
    const totalTrackedPct = totalCapacity > 0 ? (totalHours / totalCapacity) * 100 : 0

    const employees = filteredMembers.filter(m => m.role !== "CONTRACTOR" && !m.disabledAt)
    const contractors = filteredMembers.filter(m => m.role === "CONTRACTOR" && !m.disabledAt)

    // All distinct skill tags for the role filter
    const allSkills = [...new Set(filteredMembers.flatMap(m => m.roles))].sort()

    function toMemberRow(m: typeof filteredMembers[0]): MemberRow {
        const s = statsByMember.get(m.id)!
        return {
            id: m.id,
            userId: m.userId,
            role: m.role,
            roles: m.roles,
            title: m.title,
            teamName: m.teamName,
            displayName: m.user.name ?? m.user.email,
            email: m.user.email,
            hoursTracked: s.hoursTracked,
            billableHours: s.billableHours,
            billableSeconds: s.billableSeconds,
            nonBillableSeconds: s.nonBillableSeconds,
            scheduledHours: s.scheduledHours,
            capacity: s.capacity,
            utilization: s.utilization,
        }
    }

    const employeeRows = employees.map(toMemberRow)
    const contractorRows = contractors.map(toMemberRow)

    const canManage = ["OWNER", "ADMIN"].includes(callerMember.role)
    const isManageView = (sp.view === "manage" && canManage) || (timeHidden && canManage && sp.view !== "manage")

    // Auto-redirect to manage view when Directory is hidden
    if (timeHidden && canManage && sp.view !== "manage") {
        redirect("/team?view=manage")
    }

    // Manage view — inline the manage page content
    if (isManageView) {
        const [manageMembers, activeProjects, pendingInvites] = await Promise.all([
            prisma.workspaceMember.findMany({
                where: { workspaceId: callerMember.workspaceId },
                include: {
                    user: { select: { id: true, name: true, email: true, image: true, defaultBillableCents: true, costRateCents: true } },
                    manager: { include: { user: { select: { name: true, email: true } } } },
                },
                orderBy: [{ disabledAt: "asc" }, { joinedAt: "asc" }],
            }),
            prisma.teifiProject.findMany({
                where: { workspaceId: callerMember.workspaceId, status: { in: ["ACTIVE", "PAUSED"] } },
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            }),
            prisma.invite.findMany({
                where: { workspaceId: callerMember.workspaceId, usedAt: null, expiresAt: { gt: new Date() } },
                select: { id: true, email: true, role: true, token: true, expiresAt: true, createdAt: true },
                orderBy: { createdAt: "desc" },
            }),
        ])

        const searchQuery = (sp.q ?? "").toLowerCase().trim()

        const memberList = manageMembers
            .filter(m => !m.disabledAt)
            .sort((a, b) => (a.user.name ?? a.user.email).localeCompare(b.user.name ?? b.user.email))
            .map(m => ({
                id: m.id,
                name: m.user.name ?? m.user.email,
            }))

        const potentialManagers = memberList

        const reportsByManager = new Map<string | null, typeof manageMembers>()
        for (const m of manageMembers) {
            const key = m.managerId ?? null
            if (!reportsByManager.has(key)) reportsByManager.set(key, [])
            reportsByManager.get(key)!.push(m)
        }

        const topLevel = (reportsByManager.get(null) ?? []).filter(m => !m.disabledAt)
        const manageSection = sp.section === "org" ? "org" : "members"

        // Recursive org tree renderer (server-side, returns JSX)
        function renderOrgNode(member: typeof manageMembers[0], depth: number): React.ReactNode {
            const reports = (reportsByManager.get(member.id) ?? []).filter(r => !r.disabledAt)
            const name = member.user.name ?? member.user.email
            const avatarSize = depth === 0 ? "h-9 w-9" : "h-7 w-7"
            const nameSize = depth === 0 ? "text-sm font-medium" : "text-xs font-medium"
            const paddingLeft = 16 + depth * 32
            return (
                <div key={member.id}>
                    <div
                        className="flex items-center gap-3 py-2.5 hover:bg-sidebar/30 transition-colors"
                        style={{ paddingLeft: `${paddingLeft}px`, paddingRight: "16px" }}
                    >
                        {depth > 0 && (
                            <div className="w-3 h-px bg-sidebar-border/60 shrink-0" style={{ marginLeft: "-4px" }} />
                        )}
                        <Avatar className={`${avatarSize} shrink-0`}>
                            {member.user.image && <AvatarImage src={member.user.image} alt={name} />}
                            <AvatarFallback className={`text-xs text-white ${avatarBg(name)}`}>{initials(name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <a href={`/team/${member.id}/profile`} className={`${nameSize} hover:underline truncate`}>{name}</a>
                                <Badge variant={ROLE_VARIANTS[member.role] ?? "outline"} className="text-[10px] h-4 px-1.5 shrink-0">
                                    {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                                </Badge>
                            </div>
                            {(member.title || member.teamName) && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {[member.title, member.teamName].filter(Boolean).join(" · ")}
                                </div>
                            )}
                        </div>
                        {reports.length > 0 && (
                            <span className="text-xs text-muted-foreground shrink-0">
                                {reports.length} report{reports.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                    {reports.map(r => renderOrgNode(r, depth + 1))}
                </div>
            )
        }

        const roleCounts = {
            OWNER: manageMembers.filter(m => m.role === "OWNER" && !m.disabledAt).length,
            ADMIN: manageMembers.filter(m => m.role === "ADMIN" && !m.disabledAt).length,
            MANAGER: manageMembers.filter(m => m.role === "MANAGER" && !m.disabledAt).length,
            MEMBER: manageMembers.filter(m => (m.role === "MEMBER" || m.role === "CONTRACTOR") && !m.disabledAt).length,
        }

        const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
            OWNER: "default",
            ADMIN: "default",
            MANAGER: "secondary",
            MEMBER: "outline",
            CONTRACTOR: "outline",
        }

        return (
            <div className="flex-1 space-y-6 pt-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-semibold tracking-tight">Team</h2>
                            {!timeHidden && (
                                <div className="flex rounded-md border border-sidebar-border overflow-hidden">
                                    <a href="/team" className="px-3 py-1.5 text-xs font-medium bg-background text-muted-foreground hover:bg-muted transition-colors">
                                        Directory
                                    </a>
                                    <a href="/team?view=manage" className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground border-l border-sidebar-border">
                                        Manage
                                    </a>
                                </div>
                            )}
                        </div>
                        <p className="text-muted-foreground">Roles, permissions, and reporting structure.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <SyncFromLinearButton />
                        <InviteButton availableProjects={activeProjects} />
                    </div>
                </div>

                <PendingInvites invites={pendingInvites} />

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["OWNER", "ADMIN", "MANAGER", "MEMBER"] as const).map(role => (
                        <Card key={role} className="border-sidebar-border bg-sidebar/30">
                            <CardContent className="px-4 py-3">
                                <div className="text-lg font-semibold tabular-nums">{roleCounts[role]}</div>
                                <div className="text-xs text-muted-foreground capitalize mt-0.5">
                                    {role.charAt(0) + role.slice(1).toLowerCase()}{roleCounts[role] !== 1 ? "s" : ""}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Section tabs */}
                <div className="flex gap-1 border-b border-sidebar-border">
                    {[
                        { label: "Members", href: "/team?view=manage&section=members", active: manageSection === "members" },
                        { label: "Organization", href: "/team?view=manage&section=org", active: manageSection === "org" },
                    ].map(tab => (
                        <a
                            key={tab.label}
                            href={tab.href}
                            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                tab.active
                                    ? "border-primary text-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tab.label}
                        </a>
                    ))}
                </div>

                {manageSection === "members" && (
                    <Card className="border-sidebar-border">
                        {/* Search bar */}
                        <MemberSearch />
                        <div className="divide-y divide-sidebar-border/50">
                            {(() => {
                                const activeMembers = manageMembers
                                    .filter(m => !m.disabledAt)
                                    .filter(m => !searchQuery || (m.user.name ?? m.user.email).toLowerCase().includes(searchQuery) || m.user.email.toLowerCase().includes(searchQuery))
                                const disabledMembers = manageMembers
                                    .filter(m => !!m.disabledAt)
                                    .filter(m => !searchQuery || (m.user.name ?? m.user.email).toLowerCase().includes(searchQuery) || m.user.email.toLowerCase().includes(searchQuery))

                                const renderRow = (m: typeof manageMembers[0]) => {
                                    const isSelf = m.id === callerMember.id
                                    const isOwner = m.role === "OWNER"
                                    const isDisabled = !!m.disabledAt
                                    const displayName = m.user.name ?? m.user.email
                                    const managerName = m.manager ? (m.manager.user.name ?? m.manager.user.email) : null

                                    return (
                                        <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 transition-colors group ${isDisabled ? "opacity-50 bg-muted/20" : "hover:bg-sidebar/30"}`}>
                                            <Avatar className="h-9 w-9 shrink-0">
                                                {m.user.image && <AvatarImage src={m.user.image} alt={displayName} />}
                                                <AvatarFallback className={`text-xs text-white ${avatarBg(displayName)}`}>{initials(displayName)}</AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <a href={`/team/${m.id}/profile`} className="text-sm font-medium hover:underline">{displayName}</a>
                                                    {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                                                    <Badge variant={ROLE_VARIANTS[m.role] ?? "outline"} className="text-[10px] h-4 px-1.5">
                                                        {m.role.charAt(0) + m.role.slice(1).toLowerCase()}
                                                    </Badge>
                                                    {isDisabled && (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-400 text-amber-600">
                                                            Disabled
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                    <span>{m.user.email}</span>
                                                    {m.title && <><span>·</span><span>{m.title}</span></>}
                                                    {m.teamName && <><span>·</span><span>{m.teamName}</span></>}
                                                    {managerName && <><span>·</span><span className="opacity-70">↑ {managerName}</span></>}
                                                </div>
                                            </div>

                                            {!isDisabled && (
                                                <ManagerPermissions
                                                    memberId={m.id}
                                                    role={m.role}
                                                    canManageProjects={m.canManageProjects}
                                                    canEditOthersTime={m.canEditOthersTime}
                                                    canSeeRates={m.canSeeRates}
                                                    canEditClients={m.canEditClients}
                                                    canWithdrawApprovals={m.canWithdrawApprovals}
                                                />
                                            )}

                                            {!isDisabled && (
                                                <div className="shrink-0 w-36">
                                                    <MemberRoleSelect memberId={m.id} currentRole={m.role} isOwner={isOwner} callerRole={callerMember.role} />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                {!isDisabled && (
                                                    <EditProfileButton
                                                        memberId={m.id}
                                                        title={m.title}
                                                        teamName={m.teamName}
                                                        weeklyCapacityHours={m.weeklyCapacityHours}
                                                        defaultBillableCents={m.user.defaultBillableCents}
                                                        costRateCents={m.user.costRateCents}
                                                    />
                                                )}
                                                {!isSelf && !isOwner && <DisableMemberButton memberId={m.id} isDisabled={isDisabled} />}
                                                {!isSelf && isDisabled && <RemoveMemberButton memberId={m.id} />}
                                            </div>
                                        </div>
                                    )
                                }

                                return (
                                    <>
                                        {activeMembers.map(renderRow)}
                                        {disabledMembers.length > 0 && (
                                            <>
                                                <div className="px-4 py-2 bg-muted/30 border-t border-sidebar-border">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                        Disabled ({disabledMembers.length})
                                                    </span>
                                                </div>
                                                {disabledMembers.map(renderRow)}
                                            </>
                                        )}
                                        {manageMembers.length === 0 && (
                                            <div className="px-6 py-10 text-center text-sm text-muted-foreground">No team members yet.</div>
                                        )}
                                    </>
                                )
                            })()}
                        </div>
                    </Card>
                )}

                {manageSection === "org" && (
                    <div className="space-y-4">
                        {/* Org tree */}
                        <Card className="border-sidebar-border">
                            <div className="px-4 py-3 border-b border-sidebar-border">
                                <div className="text-base font-semibold flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Organization chart
                                </div>
                            </div>
                            <div className="divide-y divide-sidebar-border/50">
                                {topLevel.length === 0 ? (
                                    <div className="px-6 py-10 text-center text-sm text-muted-foreground">No team members yet.</div>
                                ) : (
                                    topLevel.map(m => renderOrgNode(m, 0))
                                )}
                            </div>
                        </Card>

                        {/* Reporting structure editor */}
                        <Card className="border-sidebar-border">
                            <div className="px-4 py-3 border-b border-sidebar-border">
                                <div className="text-base font-semibold">Reporting Structure</div>
                                <p className="text-xs text-muted-foreground mt-0.5">Set who each member reports to.</p>
                            </div>
                            <div className="divide-y divide-sidebar-border/50">
                                {manageMembers.filter(m => !m.disabledAt).map(m => {
                                    const displayName = m.user.name ?? m.user.email
                                    return (
                                        <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-sidebar/30 transition-colors">
                                            <Avatar className="h-7 w-7 shrink-0">
                                                {m.user.image && <AvatarImage src={m.user.image} alt={displayName} />}
                                                <AvatarFallback className={`text-[10px] text-white ${avatarBg(displayName)}`}>{initials(displayName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{displayName}</div>
                                                <div className="text-xs text-muted-foreground truncate">{m.user.email}</div>
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0">reports to →</span>
                                            <div className="w-44 shrink-0">
                                                <ManagerSelect memberId={m.id} currentManagerId={m.managerId} members={memberList} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-5 pt-6">
            {/* Header row */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" asChild>
                        <a href={prevUrl}><ChevronLeft className="h-4 w-4" /></a>
                    </Button>
                    <div className="min-w-0">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
                            {isCurrentWeek ? "This week" : "Week of"}
                        </div>
                        <h2 className="text-lg font-semibold leading-tight tracking-tight">{weekLabel}</h2>
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" asChild>
                        <a href={nextUrl}><ChevronRight className="h-4 w-4" /></a>
                    </Button>
                    {!isCurrentWeek && (
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" asChild>
                            <a href="/team">Today</a>
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <TeamFilter teams={teams} weekOf={weekOfStr} />
                    {canManage && !timeHidden && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                            <a href="/team?view=manage">Manage Team</a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary card */}
            <Card className="border-sidebar-border bg-sidebar/20">
                <CardContent className="px-5 py-4">
                    <div className="flex flex-wrap items-start gap-8">
                        {/* Stat: Total hours */}
                        <div className="space-y-0.5">
                            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total hours</div>
                            <div className="text-lg font-semibold tabular-nums tracking-tight">{totalHours.toFixed(2)}</div>
                            <div className="text-[11px] text-muted-foreground tabular-nums">
                                {totalCapacity > 0 ? `${totalTrackedPct.toFixed(0)}% of capacity` : "no capacity set"}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="self-stretch w-px bg-sidebar-border hidden sm:block" />

                        {/* Stat: Team capacity */}
                        <div className="space-y-0.5">
                            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Team capacity</div>
                            <div className="text-lg font-semibold tabular-nums tracking-tight">{totalCapacity.toFixed(2)}</div>
                            <div className="text-[11px] text-muted-foreground">hrs / week</div>
                        </div>

                        {/* Divider */}
                        <div className="self-stretch w-px bg-sidebar-border hidden sm:block" />

                        {/* Billable breakdown */}
                        <div className="flex-1 min-w-[220px] space-y-2.5">
                            <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 shrink-0" />
                                    <span className="text-xs text-muted-foreground">Billable</span>
                                    <span className="text-xs font-semibold tabular-nums">{totalBillable.toFixed(2)}h</span>
                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                        ({totalCapacity > 0 ? `${totalBillablePct.toFixed(0)}%` : "—"})
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-200 dark:bg-blue-900 shrink-0" />
                                    <span className="text-xs text-muted-foreground">Non-billable</span>
                                    <span className="text-xs font-semibold tabular-nums">{totalNonBillable.toFixed(2)}h</span>
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${Math.min(totalBillablePct, 100)}%` }}
                                />
                                <div
                                    className="h-full bg-blue-200 dark:bg-blue-900 transition-all duration-500"
                                    style={{ width: `${Math.min(totalTrackedPct - totalBillablePct, 100 - totalBillablePct)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground/60 select-none">
                                {[0, 25, 50, 75, 100].map(p => (
                                    <span key={p}>{p}%</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Team table */}
            <TeamTable
                employees={employeeRows}
                contractors={contractorRows}
                canManage={canManage}
                availableRoles={availableRoles}
                allSkills={allSkills}
                weekOfStr={weekOfStr}
            />
        </div>
    )
}
