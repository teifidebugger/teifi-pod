import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Settings2, CalendarOff } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ScheduleGrid, NewAllocationButton } from "./ScheduleGrid"
import { GanttChart, type GanttProject } from "./GanttChart"
import { format } from "date-fns"
import { getCachedWorkspaceRoles } from "@/lib/cached-data"

// Shared type for both members and placeholders in the schedule
export type ScheduleRow = {
    id: string                     // WorkspaceMember.id or Placeholder.id
    kind: "member" | "placeholder"
    name: string
    image: string | null           // null for placeholders -> yellow `?` avatar
    weeklyCapacityHours: number
    role: string                   // member role or first role tag
    roles: string[]                // skill/department tags for filtering
    userId: string | null          // null for placeholders (no time entries)
}

export default async function SchedulePage({
    searchParams,
}: {
    searchParams: Promise<{ offset?: string; view?: string }>
}) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    const resolvedParams = await searchParams
    const offsetDays = parseInt(resolvedParams?.offset ?? "0", 10)
    const view = resolvedParams?.view === "projects" ? "projects" : "people"

    // Generate 187 days (-7 to +180) to support zoom up to 6 months
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const baseDate = new Date(today)
    baseDate.setDate(baseDate.getDate() + offsetDays)

    const dates: Date[] = []
    for (let i = -7; i < 180; i++) {
        const d = new Date(baseDate)
        d.setDate(baseDate.getDate() + i)
        dates.push(d)
    }

    const todayStr = format(today, "yyyy-MM-dd")
    const dateStrings = dates.map((d) => format(d, "yyyy-MM-dd"))

    const windowStart = dates[0]
    const windowEnd = new Date(dates[dates.length - 1])
    windowEnd.setHours(23, 59, 59, 999)

    // ─── Shared data (both views) ───────────────────────────────────────────────

    const workspaceMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId: member.workspaceId, disabledAt: null },
        select: {
            id: true,
            role: true,
            roles: true,
            weeklyCapacityHours: true,
            user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { user: { name: "asc" } },
    })

    const projectsRaw = await prisma.teifiProject.findMany({
        where: { workspaceId: member.workspaceId, status: { in: ["ACTIVE", "TENTATIVE"] } },
        select: { id: true, name: true, color: true, status: true, client: { select: { name: true } } },
        orderBy: { name: "asc" },
    })
    const projects = projectsRaw.map((p) => ({ id: p.id, name: p.name, color: p.color, clientName: p.client?.name ?? null, isTentative: p.status === "TENTATIVE" }))

    // ─── Holidays & Time-Off ─────────────────────────────────────────────────────

    const workspaceHolidays = await prisma.workspaceHoliday.findMany({
        where: { workspaceId: member.workspaceId },
        orderBy: { date: "asc" },
    })

    const memberTimeOffRaw = await prisma.memberTimeOff.findMany({
        where: { workspaceId: member.workspaceId },
        orderBy: { date: "asc" },
    })

    // holidays as { date, name }[] for components that need names
    const holidays = workspaceHolidays.map((h) => ({ date: h.date, name: h.name }))

    // memberTimeOff grouped by memberId → date[]
    const memberTimeOff: Record<string, string[]> = {}
    for (const entry of memberTimeOffRaw) {
        if (!memberTimeOff[entry.memberId]) memberTimeOff[entry.memberId] = []
        memberTimeOff[entry.memberId].push(entry.date)
    }

    // Serialize members as ScheduleRows (used by both views)
    const memberRows: ScheduleRow[] = workspaceMembers.map((wm) => ({
        id: wm.id,
        kind: "member" as const,
        name: wm.user.name ?? "Unknown",
        image: wm.user.image,
        weeklyCapacityHours: wm.weeklyCapacityHours,
        role: wm.role,
        roles: wm.roles,
        userId: wm.user.id,
    }))

    // ─── Placeholders (fetched for both views) ───────────────────────────────────

    const placeholders = await prisma.placeholder.findMany({
        where: { workspaceId: member.workspaceId, archivedAt: null },
        orderBy: { name: "asc" },
    })

    const placeholderRows: ScheduleRow[] = placeholders.map((p) => ({
        id: p.id,
        kind: "placeholder" as const,
        name: p.name,
        image: null,
        weeklyCapacityHours: p.weeklyCapacityHours,
        role: p.roles[0] ?? "Placeholder",
        roles: p.roles,
        userId: null,
    }))

    // ─── People view data (only fetched when view === "people") ──────────────────

    let workspaceRoles: { id: string; name: string }[] = []
    let allRows: ScheduleRow[] = memberRows
    let serializedAllocations: Array<{
        id: string; rowId: string; memberId: string | null; placeholderId: string | null
        projectId: string; startDate: string; endDate: string; hoursPerDay: number
        type: "SOFT" | "HARD"; notes: string | null
        project: { id: string; name: string; color: string; clientName: string | null; isTentative: boolean }
    }> = []
    const timeEntriesByMember: Record<
        string,
        Array<{ projectId: string; projectName: string; dateIndex: number; durationSeconds: number }>
    > = {}

    if (view === "people") {
        const [roles, allocations, timeEntries] = await Promise.all([
            getCachedWorkspaceRoles(member.workspaceId),
            (() => {
                const allocationLookback = new Date(today)
                allocationLookback.setMonth(allocationLookback.getMonth() - 6)
                return prisma.allocation.findMany({
                    where: {
                        endDate: { gte: allocationLookback },
                        OR: [
                            { member: { workspaceId: member.workspaceId } },
                            { placeholder: { workspaceId: member.workspaceId } },
                        ],
                    },
                    include: {
                        project: { select: { id: true, name: true, color: true, status: true, client: { select: { name: true } } } },
                        member: { select: { id: true, weeklyCapacityHours: true } },
                        placeholder: { select: { id: true, weeklyCapacityHours: true } },
                    },
                })
            })(),
            prisma.timeEntry.findMany({
                where: {
                    date: { gte: dateStrings[0], lte: dateStrings[dateStrings.length - 1] },
                    project: { workspaceId: member.workspaceId },
                },
                select: {
                    userId: true,
                    date: true,
                    durationSeconds: true,
                    projectId: true,
                    project: { select: { id: true, name: true } },
                },
            }),
        ])

        workspaceRoles = roles

        allRows = [...placeholderRows, ...memberRows]

        serializedAllocations = allocations.map((a) => ({
            id: a.id,
            rowId: a.memberId ?? a.placeholderId ?? "",
            memberId: a.memberId,
            placeholderId: a.placeholderId,
            projectId: a.projectId,
            startDate: format(a.startDate, "yyyy-MM-dd"),
            endDate: format(a.endDate, "yyyy-MM-dd"),
            hoursPerDay: a.hoursPerDay,
            type: a.type as "SOFT" | "HARD",
            notes: a.notes,
            project: { id: a.project.id, name: a.project.name, color: a.project.color, clientName: a.project.client?.name ?? null, isTentative: a.project.status === "TENTATIVE" },
        }))

        for (const entry of timeEntries) {
            const entryDateStr = entry.date
            const dateIndex = dateStrings.indexOf(entryDateStr)
            if (dateIndex === -1) continue

            if (!timeEntriesByMember[entry.userId]) {
                timeEntriesByMember[entry.userId] = []
            }
            timeEntriesByMember[entry.userId].push({
                projectId: entry.projectId,
                projectName: entry.project?.name ?? "Unknown",
                dateIndex,
                durationSeconds: entry.durationSeconds,
            })
        }
    }

    // ─── Gantt view data (only fetched when view === "projects") ─────────────────

    let ganttProjects: GanttProject[] = []
    let ganttClients: { id: string; name: string }[] = []
    let ganttManagers: { id: string; name: string | null; email: string; role: string }[] = []

    if (view === "projects") {
        const ganttWindowStart = new Date(today)
        ganttWindowStart.setMonth(ganttWindowStart.getMonth() - 2)
        const ganttWindowEnd = new Date(today)
        ganttWindowEnd.setMonth(ganttWindowEnd.getMonth() + 7)

        const ganttProjectsRaw = await prisma.teifiProject.findMany({
            where: {
                workspaceId: member.workspaceId,
                status: { in: ["ACTIVE", "PAUSED", "TENTATIVE"] },
            },
            include: {
                client: { select: { id: true, name: true } },
                allocations: {
                    where: {
                        startDate: { lte: ganttWindowEnd },
                        endDate: { gte: ganttWindowStart },
                    },
                    include: {
                        member: {
                            include: {
                                user: { select: { name: true, image: true } },
                            },
                        },
                        placeholder: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
        })

        const [ganttClientsRaw, ganttManagersRaw] = await Promise.all([
            prisma.client.findMany({
                where: { workspaceId: member.workspaceId },
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            }),
            prisma.workspaceMember.findMany({
                where: { workspaceId: member.workspaceId, role: { in: ["OWNER", "ADMIN", "MANAGER"] } },
                select: { id: true, role: true, user: { select: { name: true, email: true } } },
                orderBy: { user: { name: "asc" } },
            }),
        ])

        ganttClients = ganttClientsRaw
        ganttManagers = ganttManagersRaw.map((m) => ({
            id: m.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
        }))

        ganttProjects = ganttProjectsRaw.map((proj) => ({
            id: proj.id,
            name: proj.name,
            color: proj.color,
            clientName: proj.client?.name ?? null,
            clientId: proj.clientId,
            isTentative: proj.status === "TENTATIVE",
            code: proj.code,
            description: proj.description,
            status: proj.status,
            billingType: proj.billingType,
            billBy: proj.billBy,
            hourlyRateCents: proj.hourlyRateCents,
            budgetHours: proj.budgetHours,
            budgetCents: proj.budgetCents,
            feeCents: proj.feeCents,
            budgetBy: proj.budgetBy,
            costBudgetCents: proj.costBudgetCents,
            costBudgetIncludeExpenses: proj.costBudgetIncludeExpenses,
            notifyWhenOverBudget: proj.notifyWhenOverBudget,
            overBudgetNotificationPercent: proj.overBudgetNotificationPercent,
            startsOn: proj.startsOn ? format(proj.startsOn, "yyyy-MM-dd") : null,
            endsOn: proj.endsOn ? format(proj.endsOn, "yyyy-MM-dd") : null,
            budgetIsMonthly: proj.budgetIsMonthly,
            showBudgetToAll: proj.showBudgetToAll,
            managerId: proj.managerId,
            allocations: proj.allocations.map((alloc) => ({
                id: alloc.id,
                memberId: alloc.memberId,
                placeholderId: alloc.placeholderId,
                projectId: alloc.projectId,
                startDate: format(alloc.startDate, "yyyy-MM-dd"),
                endDate: format(alloc.endDate, "yyyy-MM-dd"),
                hoursPerDay: alloc.hoursPerDay,
                type: alloc.type as "SOFT" | "HARD",
                notes: alloc.notes,
                member: alloc.member
                    ? {
                          id: alloc.member.id,
                          name: alloc.member.user.name ?? "Unknown",
                          image: alloc.member.user.image,
                      }
                    : alloc.placeholder
                      ? {
                            id: alloc.placeholder.id,
                            name: alloc.placeholder.name,
                            image: null,
                        }
                      : { id: "unknown", name: "Unknown", image: null },
                isPlaceholder: !!alloc.placeholderId,
            })),
        }))
    }

    const prevOffset = offsetDays - 7
    const nextOffset = offsetDays + 7

    const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(member.role)

    const rangeStart = dates[0]
    const rangeEnd = dates[dates.length - 1]
    const rangeLabel = `${rangeStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${rangeEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`

    return (
        <div className="flex-1 flex flex-col pt-6 pb-20 [overflow-x:clip]">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">Schedule</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {view === "people"
                            ? `${rangeLabel} — allocations and logged time`
                            : "Project timelines — drag bars to adjust allocations"}
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    {view === "people" && (
                        <div className="flex items-center gap-1 mr-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                                <Link href={`/schedule?view=people&offset=${prevOffset}`}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium" asChild>
                                <Link href="/schedule?view=people">Today</Link>
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                                <Link href={`/schedule?view=people&offset=${nextOffset}`}>
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    )}
                    {canManage && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1.5 px-2.5" asChild>
                            <Link href="/schedule/holidays">
                                <CalendarOff className="h-3.5 w-3.5" />
                                Holidays
                            </Link>
                        </Button>
                    )}
                    {canManage && view === "people" && (
                        <>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1.5 px-2.5" asChild>
                                <Link href="/schedule/placeholders">
                                    <Settings2 className="h-3.5 w-3.5" />
                                    Placeholders
                                </Link>
                            </Button>
                            <NewAllocationButton
                                rows={allRows}
                                projects={projects}
                                holidays={holidays.map((h) => h.date)}
                                memberTimeOff={memberTimeOff}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex border-b border-sidebar-border sticky top-0 z-40 bg-background">
                <Link
                    href={`/schedule?view=people&offset=${offsetDays}`}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
                        ${view === "people"
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                >
                    People
                </Link>
                <Link
                    href="/schedule?view=projects"
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
                        ${view === "projects"
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                >
                    Projects
                </Link>
            </div>

            {/* Content */}
            {view === "people" ? (
                <ScheduleGrid
                    rows={allRows}
                    allocations={serializedAllocations}
                    timeEntriesByMember={timeEntriesByMember}
                    projects={projects}
                    dates={dateStrings}
                    today={todayStr}
                    canManage={canManage}
                    holidays={holidays}
                    memberTimeOff={memberTimeOff}
                    availableRoles={workspaceRoles.map((r) => r.name)}
                />
            ) : (
                <GanttChart
                    ganttProjects={ganttProjects}
                    members={memberRows.map((m) => ({ id: m.id, name: m.name, weeklyCapacityHours: m.weeklyCapacityHours }))}
                    placeholders={placeholderRows.map((p) => ({ id: p.id, name: p.name, weeklyCapacityHours: p.weeklyCapacityHours }))}
                    projects={projects}
                    today={todayStr}
                    offsetDays={offsetDays}
                    canManage={canManage}
                    holidays={holidays}
                    clients={ganttClients}
                    managers={ganttManagers}
                />
            )}
        </div>
    )
}
