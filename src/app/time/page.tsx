import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    parseISO,
    isValid,
    isSameDay,
    isThisWeek,
} from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Lock, History, UserCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import { TimerForms } from "./TimerForms"
import { StopTimerButton, DeleteEntryButton, EditEntryButton } from "./TimeEntryActions"
import { WeekNav } from "./WeekNav"
import { WeekGridView } from "./WeekGridView"
import { TeammatesSwitcher } from "./TeammatesSwitcher"
import { SubmitWeekButton } from "./SubmitWeekButton"
import { RunningTimerBadge } from "./RunningTimerBadge"



function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
}

export default async function TimeTrackingPage({
    searchParams,
}: {
    searchParams: Promise<{ week?: string; day?: string; view?: string; memberId?: string }>
}) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const userId = session.user.id

    const member = await prisma.workspaceMember.findFirst({
        where: { userId },
        select: { id: true, role: true, workspaceId: true, canEditOthersTime: true },
    })

    const canViewOthers =
        member !== null &&
        (["OWNER", "ADMIN"].includes(member.role) ||
            (member.role === "MANAGER" && member.canEditOthersTime))

    const { week, day: dayParam, view: viewParam, memberId: rawMemberId } = await searchParams
    const view = viewParam === "day" ? "day" : "week"

    // ─── Resolve viewed member ────────────────────────────────────────────
    let viewedUserId = userId
    let viewedMember: { memberId: string; name: string; email: string; image: string | null } | null = null

    if (canViewOthers && rawMemberId && member && rawMemberId !== member.id) {
        const target = await prisma.workspaceMember.findFirst({
            where: { id: rawMemberId, workspaceId: member.workspaceId },
            select: { id: true, user: { select: { id: true, name: true, email: true, image: true } } },
        })
        if (target) {
            viewedUserId = target.user.id
            viewedMember = {
                memberId: target.id,
                name: target.user.name ?? target.user.email,
                email: target.user.email,
                image: target.user.image,
            }
        }
    }

    // ─── Teammates list ───────────────────────────────────────────────────
    const allWorkspaceMembers = canViewOthers && member
        ? await prisma.workspaceMember.findMany({
              where: { workspaceId: member.workspaceId, disabledAt: null },
              select: { id: true, user: { select: { name: true, email: true } } },
              orderBy: { user: { name: "asc" } },
          })
        : []

    const teammateList = allWorkspaceMembers.map(m => ({
        memberId: m.id,
        name: m.user.name ?? m.user.email,
    }))

    // ─── Projects for timer ───────────────────────────────────────────────
    const workspaceMemberIdForProjects = viewedMember?.memberId ?? member?.id
    let projects: { id: string; name: string; code: string | null; linearTeamId: string | null; client: { name: string } | null }[] = []
    if (member) {
        const isAdminOrOwner = ["OWNER", "ADMIN"].includes(member.role)
        const projectSelect = { id: true, name: true, code: true, linearTeamId: true, client: { select: { name: true } } } as const
        if (isAdminOrOwner) {
            projects = await prisma.teifiProject.findMany({
                where: { workspaceId: member.workspaceId, status: "ACTIVE" },
                select: projectSelect,
                orderBy: { name: "asc" },
            })
        } else {
            // Fetch assignments and all workspace projects in parallel, then filter client-side
            const [assignments, allProjects] = await Promise.all([
                prisma.projectMember.findMany({
                    where: { memberId: workspaceMemberIdForProjects },
                    select: { projectId: true },
                }),
                prisma.teifiProject.findMany({
                    where: { workspaceId: member.workspaceId, status: "ACTIVE" },
                    select: projectSelect,
                    orderBy: { name: "asc" },
                }),
            ])
            if (assignments.length === 0) {
                projects = allProjects
            } else {
                const assignedIds = new Set(assignments.map(a => a.projectId))
                projects = allProjects.filter(p => assignedIds.has(p.id))
            }
        }
    }

    const workspace = member
        ? await prisma.workspace.findFirst({
              where: { id: member.workspaceId },
              select: { timerMode: true, weekStartDay: true, energyTrackingEnabled: true },
          })
        : null

    const weekStartsOn = (workspace?.weekStartDay ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6

    // ─── Week boundaries ──────────────────────────────────────────────────
    const parsedWeek = week ? parseISO(week) : new Date()
    const safeWeekBase = isValid(parsedWeek) ? parsedWeek : new Date()
    const weekStart = startOfWeek(safeWeekBase, { weekStartsOn })
    const weekEnd = endOfWeek(safeWeekBase, { weekStartsOn })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const weekStartStr = format(weekStart, "yyyy-MM-dd")

    // ─── Selected day (for day view) ──────────────────────────────────────
    const parsedDay = dayParam ? parseISO(dayParam) : new Date()
    const selectedDay = isValid(parsedDay) ? parsedDay : new Date()

    // ─── Fetch entries + timesheet week + projects with tasks ─────────────
    const weekEndStr = format(weekEnd, "yyyy-MM-dd")

    const [allEntries, timesheetWeek, projectsWithTasks, hasLinear, runningTimer] = await Promise.all([
        member
            ? prisma.timeEntry.findMany({
                  where: {
                      userId: viewedUserId,
                      project: { workspaceId: member.workspaceId },
                      date: { gte: weekStartStr, lte: weekEndStr },
                  },
                  orderBy: { date: "desc" },
                  include: {
                      project: { select: { name: true, client: { select: { name: true } } } },
                      task: { select: { name: true } },
                  },
              })
            : Promise.resolve([]),
        // Only fetch for own timesheet (not when viewing a teammate)
        member && !viewedMember
            ? prisma.timesheetWeek.findUnique({
                  where: { userId_workspaceId_weekStart: { userId, workspaceId: member.workspaceId, weekStart: weekStartStr } },
              })
            : Promise.resolve(null),
        // Projects with tasks for the AddRowCombobox (own timesheet only)
        member && !viewedMember
            ? (async () => {
                  const isAdminOrOwner = ["OWNER", "ADMIN"].includes(member.role)
                  const projectSelect = {
                      id: true, name: true, code: true,
                      client: { select: { name: true } },
                      tasks: { select: { id: true, name: true }, orderBy: { name: "asc" } },
                  } as const
                  const projectList = isAdminOrOwner
                      ? await prisma.teifiProject.findMany({
                            where: { workspaceId: member.workspaceId, status: "ACTIVE" },
                            select: projectSelect,
                            orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
                        })
                      : await (async () => {
                            const assignments = await prisma.projectMember.findMany({
                                where: { memberId: member.id },
                                select: { projectId: true },
                            })
                            if (assignments.length === 0) {
                                return prisma.teifiProject.findMany({
                                    where: { workspaceId: member.workspaceId, status: "ACTIVE" },
                                    select: projectSelect,
                                    orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
                                })
                            }
                            return prisma.teifiProject.findMany({
                                where: { id: { in: assignments.map(a => a.projectId) }, workspaceId: member.workspaceId, status: "ACTIVE" },
                                select: projectSelect,
                                orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
                            })
                        })()
                  return projectList
              })()
            : Promise.resolve([]),
        // hasLinear and runningTimer are independent — run in parallel with entries
        prisma.linearUserToken.findFirst({ where: { userId } }).then(t => !!t),
        member
            ? prisma.timeEntry.findFirst({
                  where: { userId, timerStartedAt: { not: null } },
                  select: { id: true, timerStartedAt: true, project: { select: { name: true } } },
              })
            : Promise.resolve(null),
    ])

    // For day view: filter to selected day
    const selectedDayStr = format(selectedDay, "yyyy-MM-dd")
    const dayEntries = allEntries.filter(e => e.date === selectedDayStr)

    // For day view total (completed only)
    const dayTotalSeconds = dayEntries
        .filter(e => e.timerStartedAt === null)
        .reduce((s, e) => s + e.durationSeconds, 0)

    // For week view total (completed only)
    const weekTotalSeconds = allEntries
        .filter(e => e.timerStartedAt === null)
        .reduce((s, e) => s + e.durationSeconds, 0)

    const displayTotalSeconds = view === "day" ? dayTotalSeconds : weekTotalSeconds

    // Is the viewed week the current week (for "Today" badge in day view)
    const isCurrentWeek = isThisWeek(weekStart, { weekStartsOn })
    const today = new Date()

    const editProjects = projects.map(p => ({ id: p.id, name: p.name }))

    function initials(name: string) {
        return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    }

    return (
        <div className="flex-1 space-y-6 pt-6">
            {/* ─── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between pb-2">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Time Tracking</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Log your hours or start a live timer.</p>
                </div>
                <div className="flex items-center gap-2">
                    {canViewOthers && (
                        <TeammatesSwitcher
                            members={teammateList}
                            currentMemberId={viewedMember?.memberId ?? null}
                        />
                    )}
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                        <Link href="/time/audit">
                            <History className="h-3.5 w-3.5" />
                            Audit Log
                        </Link>
                    </Button>
                </div>
            </div>

            {/* ─── Viewing banner ───────────────────────────────────────── */}
            {viewedMember && (
                <div className="flex items-center gap-2.5 rounded-md border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-3 py-2">
                    <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className={`text-xs text-white ${avatarBg(viewedMember.name)}`}>{initials(viewedMember.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 leading-tight">
                            {viewedMember.name}&apos;s timesheet
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                            Viewing in read-only mode.{" "}
                            <Link href="/time" className="font-medium underline underline-offset-2">
                                Back to your timesheet →
                            </Link>
                        </p>
                    </div>
                    <UserCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                </div>
            )}

            {/* ─── Timer forms (own timesheet only) ────────────────────── */}
            {!viewedMember && (
                <TimerForms
                    projects={projects}
                    hasLinear={hasLinear}
                    timerMode={workspace?.timerMode ?? "start_end"}
                    runningTimer={runningTimer ? {
                        entryId: runningTimer.id,
                        projectName: runningTimer.project.name,
                        timerStartedAt: runningTimer.timerStartedAt!.toISOString(),
                    } : null}
                    energyTrackingEnabled={workspace?.energyTrackingEnabled ?? false}
                />
            )}

            {/* ─── Nav + view toggle ────────────────────────────────────── */}
            <div className="space-y-4">
                <WeekNav
                    weekStart={weekStartStr}
                    weekEnd={format(weekEnd, "yyyy-MM-dd")}
                    totalSeconds={displayTotalSeconds}
                    view={view}
                    day={format(selectedDay, "yyyy-MM-dd")}
                    weekStartsOn={weekStartsOn}
                    submissionStatus={timesheetWeek?.status ?? null}
                />

                {/* ─── Submit week button (own timesheet, week view) ────── */}
                {view === "week" && !viewedMember && (
                    <div className="flex items-center justify-end">
                        <SubmitWeekButton
                            weekStart={weekStartStr}
                            status={timesheetWeek?.status ?? null}
                            reviewNote={timesheetWeek?.reviewNote}
                            hasEntries={allEntries.some(e => e.timerStartedAt === null)}
                            hasRunningTimer={!!runningTimer}
                            isOwnTimesheet={true}
                        />
                    </div>
                )}

                {/* ─── Week grid view ───────────────────────────────────── */}
                {view === "week" && (
                    <WeekGridView
                        entries={allEntries}
                        days={days}
                        weekStart={weekStartStr}
                        memberId={viewedMember?.memberId}
                        timesheetStatus={timesheetWeek?.status ?? null}
                        projectsWithTasks={projectsWithTasks}
                    />
                )}

                {/* ─── Day log view ─────────────────────────────────────── */}
                {view === "day" && (
                    <DayLogView
                        entries={dayEntries}
                        selectedDay={selectedDay}
                        isCurrentWeek={isCurrentWeek}
                        today={today}
                        editProjects={editProjects}
                        viewedMember={viewedMember}
                    />
                )}
            </div>
        </div>
    )
}

// ─── Day log sub-component ───────────────────────────────────────────────────

interface DayEntry {
    id: string
    date: string
    timerStartedAt: Date | null
    durationSeconds: number
    description: string | null
    projectId: string
    isBillable: boolean
    isLocked: boolean
    approvalStatus: string
    energyLevel: number | null
    project: { name: string; client: { name: string } | null }
    task: { name: string } | null
}

function DayLogView({
    entries,
    selectedDay,
    isCurrentWeek,
    today,
    editProjects,
    viewedMember,
}: {
    entries: DayEntry[]
    selectedDay: Date
    isCurrentWeek: boolean
    today: Date
    editProjects: { id: string; name: string }[]
    viewedMember: { name: string } | null
}) {
    const isToday = isCurrentWeek && isSameDay(selectedDay, today)
    const completedSeconds = entries
        .filter(e => e.timerStartedAt === null)
        .reduce((s, e) => s + e.durationSeconds, 0)
    const h = Math.floor(completedSeconds / 3600)
    const m = Math.floor((completedSeconds % 3600) / 60)

    if (entries.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-sidebar-border bg-sidebar/20 p-10 text-center text-sm text-muted-foreground">
                {viewedMember
                    ? `${viewedMember.name} has no time logged this day.`
                    : "No time logged this day. Start a timer or log time manually."}
            </div>
        )
    }

    return (
        <div className="rounded-lg border border-sidebar-border overflow-hidden">
            {/* Day header */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-b border-sidebar-border ${isToday ? "bg-sidebar/80" : "bg-sidebar/50"}`}>
                <span className="text-sm font-semibold flex items-center gap-2">
                    {format(selectedDay, "EEEE, MMM d")}
                    {isToday && (
                        <span className="text-xs font-normal text-muted-foreground bg-sidebar-accent/60 px-1.5 py-0.5 rounded">Today</span>
                    )}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">{h}h {m}m</span>
            </div>

            {/* Entry rows */}
            <div className="divide-y divide-sidebar-border/50">
                {entries.map((entry) => {
                    const isActive = entry.timerStartedAt !== null
                    return (
                        <div
                            key={entry.id}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-sidebar/30 transition-colors group${isActive ? " border-l-2 border-emerald-500" : ""}`}
                        >
                            {isActive && (
                                <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                            )}

                            <div className="flex-1 min-w-0">
                                {entry.project.client?.name && (
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground/60 truncate leading-none mb-0.5">
                                        {entry.project.client.name}
                                    </div>
                                )}
                                <div className="text-sm font-semibold truncate leading-tight">{entry.project.name}</div>
                                {entry.task && (
                                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                                        {entry.task.name}
                                        {entry.description && <span className="text-muted-foreground/60"> · {entry.description}</span>}
                                    </div>
                                )}
                                {!entry.task && entry.description && (
                                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                                        {entry.description}
                                    </div>
                                )}
                            </div>

                            {isActive && entry.timerStartedAt ? (
                                <RunningTimerBadge timerStartedAt={entry.timerStartedAt.toISOString()} />
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className="shrink-0 font-mono tabular-nums text-xs min-w-[4.5rem] justify-center"
                                >
                                    {formatDuration(entry.durationSeconds)}
                                </Badge>
                            )}

                            {entry.energyLevel != null && (
                                <span
                                    title={`Energy: ${entry.energyLevel}/5`}
                                    className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${entry.energyLevel <= 2 ? "bg-red-400" : entry.energyLevel === 3 ? "bg-yellow-400" : "bg-green-400"}`}
                                />
                            )}

                            {!isActive && (
                                <Badge
                                    variant={
                                        entry.approvalStatus === "APPROVED"
                                            ? "default"
                                            : entry.approvalStatus === "REJECTED"
                                                ? "destructive"
                                                : "outline"
                                    }
                                    className={`shrink-0 text-xs ${entry.approvalStatus === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-600 text-white border-transparent" : ""} ${entry.isLocked ? "bg-muted text-muted-foreground border-transparent hover:bg-muted" : ""}`}
                                >
                                    {entry.isLocked && <Lock className="h-3 w-3 mr-1" />}
                                    {entry.isLocked && entry.approvalStatus !== "APPROVED"
                                        ? "Locked"
                                        : entry.approvalStatus === "APPROVED"
                                            ? "Approved"
                                            : entry.approvalStatus === "REJECTED"
                                                ? "Rejected"
                                                : "Pending"}
                                </Badge>
                            )}

                            <div className="flex items-center gap-1 shrink-0">
                                {isActive && !viewedMember && <StopTimerButton entryId={entry.id} />}
                                {!isActive && (
                                    <EditEntryButton
                                        entryId={entry.id}
                                        entry={{
                                            description: entry.description,
                                            date: entry.date,
                                            durationSeconds: entry.durationSeconds,
                                            projectId: entry.projectId,
                                            isBillable: entry.isBillable,
                                            isLocked: entry.isLocked,
                                        }}
                                        projects={editProjects}
                                    />
                                )}
                                <DeleteEntryButton entryId={entry.id} isLocked={entry.isLocked} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}


