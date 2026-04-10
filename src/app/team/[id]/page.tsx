import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import {
    startOfWeek,
    endOfWeek,
    format,
    addWeeks,
    subWeeks,
    parseISO,
    eachDayOfInterval,
} from "date-fns"

function initials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

const PROJECT_COLORS = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-yellow-500",
    "bg-red-500",
]

function projectColor(name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i)
    return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length]
}

export default async function MemberDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ week_of?: string }>
}) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const callerMember = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { id: true, workspaceId: true, role: true },
    })
    if (!callerMember) redirect("/")

    const { id: memberId } = await params
    const sp = await searchParams

    // Load target member — must be in same workspace
    const targetMember = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: callerMember.workspaceId },
        include: {
            user: { select: { id: true, name: true, email: true, image: true, defaultBillableCents: true, costRateCents: true } },
        },
    })
    if (!targetMember) notFound()

    const weekOf = sp.week_of ? parseISO(sp.week_of) : new Date()
    const weekStart = startOfWeek(weekOf, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekOf, { weekStartsOn: 1 })

    const weekStartStr = format(weekStart, "yyyy-MM-dd")
    const weekEndStr = format(weekEnd, "yyyy-MM-dd")
    const weekLabel = `${format(weekStart, "dd MMM")} – ${format(weekEnd, "dd MMM yyyy")}`
    const isCurrentWeek =
        format(weekStart, "yyyy-MM-dd") === format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")

    const prevUrl = `/team/${memberId}?week_of=${format(subWeeks(weekStart, 1), "yyyy-MM-dd")}`
    const nextUrl = `/team/${memberId}?week_of=${format(addWeeks(weekStart, 1), "yyyy-MM-dd")}`
    const backUrl = `/team?week_of=${format(weekStart, "yyyy-MM-dd")}`

    // Time entries for this member this week
    const entries = await prisma.timeEntry.findMany({
        where: {
            userId: targetMember.user.id,
            project: { workspaceId: callerMember.workspaceId },
            date: { gte: weekStartStr, lte: weekEndStr },
            timerStartedAt: null,
        },
        include: {
            project: { select: { id: true, name: true, billingType: true } },
            task: { select: { name: true, linearIssueId: true } },
        },
        orderBy: { date: "asc" },
    })

    // Fetch linear issues for tasks that have them
    const linearIssueIds = entries
        .map(e => e.task?.linearIssueId)
        .filter((id): id is string => !!id)
    const linearIssues = linearIssueIds.length > 0
        ? await prisma.linearIssue.findMany({ where: { id: { in: linearIssueIds } } })
        : []
    const issueMap = new Map(linearIssues.map(i => [i.id, i]))

    // Compute stats
    const totalSeconds = entries.reduce((s, e) => s + e.durationSeconds, 0)
    const billableSeconds = entries
        .filter(e => e.project.billingType !== "NON_BILLABLE")
        .reduce((s, e) => s + e.durationSeconds, 0)
    const nonBillableSeconds = totalSeconds - billableSeconds
    const capacity = targetMember.weeklyCapacityHours
    const billablePct = capacity > 0 ? Math.min((billableSeconds / 3600 / capacity) * 100, 100) : 0
    const trackedPct = capacity > 0 ? Math.min((totalSeconds / 3600 / capacity) * 100, 100) : 0

    // Per-day breakdown
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const hoursByDay = days.map(day => ({
        day,
        seconds: entries.filter(e => e.date === format(day, "yyyy-MM-dd")).reduce((s, e) => s + e.durationSeconds, 0),
    }))

    // Per-project breakdown
    const projectMap = new Map<string, { id: string; name: string; seconds: number }>()
    for (const e of entries) {
        const key = e.project.id
        if (!projectMap.has(key)) projectMap.set(key, { id: key, name: e.project.name, seconds: 0 })
        projectMap.get(key)!.seconds += e.durationSeconds
    }
    const projectBreakdown = Array.from(projectMap.values()).sort((a, b) => b.seconds - a.seconds)

    // Per-task breakdown
    const taskMap = new Map<string, { name: string; seconds: number }>()
    for (const e of entries) {
        const key = e.task?.name ?? "No task"
        if (!taskMap.has(key)) taskMap.set(key, { name: key, seconds: 0 })
        taskMap.get(key)!.seconds += e.durationSeconds
    }
    const taskBreakdown = Array.from(taskMap.values()).sort((a, b) => b.seconds - a.seconds)

    // Group entries by day for right panel
    const entriesByDay = days.map(day => ({
        day,
        entries: entries.filter(e => e.date === format(day, "yyyy-MM-dd")),
    }))

    const canManage = ["OWNER", "ADMIN"].includes(callerMember.role)
    const isSelf = callerMember.id === targetMember.id
    const displayName = targetMember.user.name ?? targetMember.user.email

    return (
        <div className="flex-1 space-y-5 pt-6">
            {/* Back link */}
            <a href={backUrl} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Team
            </a>

            {/* Week nav */}
            <div className="flex items-center gap-3">
                <a href={prevUrl}>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </a>
                <div>
                    <span className="text-xs text-muted-foreground">{isCurrentWeek ? "This week:" : "Week of:"}</span>
                    <h2 className="text-xl font-bold leading-tight">{weekLabel}</h2>
                </div>
                <a href={nextUrl}>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </a>
            </div>

            {/* Member header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 shrink-0">
                        <AvatarFallback className={`text-lg text-white ${avatarBg(displayName)}`}>{initials(displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold">{displayName}</h1>
                            {isSelf && <span className="text-sm text-muted-foreground">(you)</span>}
                        </div>
                        {targetMember.title && (
                            <div className="text-sm text-muted-foreground">{targetMember.title}</div>
                        )}
                        <div className="text-sm text-muted-foreground">{targetMember.user.email}</div>
                    </div>
                </div>
                {canManage && (
                    <a href={`/team/${targetMember.id}/profile`}>
                        <Button variant="outline" size="sm">Edit Profile</Button>
                    </a>
                )}
            </div>

            <Separator className="border-sidebar-border" />

            {/* Two-column layout */}
            <div className="flex gap-6 items-start">
                {/* Left panel */}
                <div className="w-72 shrink-0 space-y-4">
                    {/* Hours summary */}
                    <Card className="border-sidebar-border">
                        <CardContent className="px-4 py-4 space-y-3">
                            <div className="flex gap-6">
                                <div>
                                    <div className="text-xs text-muted-foreground">Total hours</div>
                                    <div className="text-lg font-semibold tabular-nums">{(totalSeconds / 3600).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Capacity</div>
                                    <div className="text-lg font-semibold tabular-nums">{capacity.toFixed(2)}</div>
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                                <div className="h-full bg-blue-500" style={{ width: `${billablePct}%` }} />
                                <div className="h-full bg-blue-200 dark:bg-blue-900" style={{ width: `${Math.max(0, trackedPct - billablePct)}%` }} />
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-sm bg-blue-500 shrink-0" />
                                        <span className="text-muted-foreground">Billable</span>
                                    </div>
                                    <span className="tabular-nums font-medium">{(billableSeconds / 3600).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900 shrink-0" />
                                        <span className="text-muted-foreground">Non-billable</span>
                                    </div>
                                    <span className="tabular-nums font-medium">{(nonBillableSeconds / 3600).toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Day grid */}
                    <Card className="border-sidebar-border">
                        <CardContent className="px-4 py-3">
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {hoursByDay.map(({ day, seconds }) => (
                                    <div key={day.toISOString()} className="flex flex-col items-center gap-0.5">
                                        <div className="text-[10px] text-muted-foreground font-medium">
                                            {format(day, "EEE").substring(0, 3)}
                                        </div>
                                        <div className={`text-xs tabular-nums font-semibold ${seconds > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                                            {(seconds / 3600).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Projects breakdown */}
                    {projectBreakdown.length > 0 && (
                        <Card className="border-sidebar-border">
                            <CardHeader className="px-4 py-3 pb-2">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Projects breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 space-y-2">
                                {/* Stacked bar */}
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                                    {projectBreakdown.map((p) => (
                                        <div
                                            key={p.id}
                                            className={`h-full ${projectColor(p.name)}`}
                                            style={{ width: `${totalSeconds > 0 ? (p.seconds / totalSeconds) * 100 : 0}%` }}
                                        />
                                    ))}
                                </div>
                                <div className="space-y-1">
                                    {projectBreakdown.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${projectColor(p.name)}`} />
                                                <span className="truncate text-muted-foreground">{p.name}</span>
                                            </div>
                                            <span className="tabular-nums ml-2 shrink-0">{(p.seconds / 3600).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tasks breakdown */}
                    {taskBreakdown.length > 0 && (
                        <Card className="border-sidebar-border">
                            <CardHeader className="px-4 py-3 pb-2">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Tasks breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 space-y-2">
                                {/* Stacked bar */}
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                                    {taskBreakdown.map((t, i) => (
                                        <div
                                            key={t.name}
                                            className={`h-full ${PROJECT_COLORS[i % PROJECT_COLORS.length]}`}
                                            style={{ width: `${totalSeconds > 0 ? (t.seconds / totalSeconds) * 100 : 0}%` }}
                                        />
                                    ))}
                                </div>
                                <div className="space-y-1">
                                    {taskBreakdown.map((t, i) => (
                                        <div key={t.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${PROJECT_COLORS[i % PROJECT_COLORS.length]}`} />
                                                <span className="truncate text-muted-foreground">{t.name}</span>
                                            </div>
                                            <span className="tabular-nums ml-2 shrink-0">{(t.seconds / 3600).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right panel — daily entries */}
                <div className="flex-1 min-w-0 space-y-3">
                    {entriesByDay.map(({ day, entries: dayEntries }) => {
                        const dayTotal = dayEntries.reduce((s, e) => s + e.durationSeconds, 0)
                        return (
                            <Card key={day.toISOString()} className="border-sidebar-border overflow-hidden">
                                {/* Day header */}
                                <div className="px-4 py-2.5 bg-muted/30 border-b border-sidebar-border">
                                    <span className="text-sm font-medium">{format(day, "EEEE, dd MMM")}</span>
                                </div>

                                {dayEntries.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-muted-foreground">No time tracked</div>
                                ) : (
                                    <div className="divide-y divide-sidebar-border/50">
                                        {dayEntries.map(entry => {
                                            const issue = entry.task?.linearIssueId
                                                ? issueMap.get(entry.task.linearIssueId)
                                                : null
                                            return (
                                                <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-semibold truncate">
                                                            {entry.project.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                                                            {entry.task?.name && (
                                                                <span>{entry.task.name}</span>
                                                            )}
                                                            {issue && (
                                                                <>
                                                                    {entry.task?.name && <span>—</span>}
                                                                    <a
                                                                        href={issue.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-0.5 text-blue-500 hover:underline"
                                                                    >
                                                                        {issue.identifier} {issue.title}
                                                                        <ExternalLink className="w-3 h-3 inline ml-0.5" />
                                                                    </a>
                                                                </>
                                                            )}
                                                            {entry.description && (
                                                                <span className="text-muted-foreground/70 truncate">{entry.description}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 flex items-center gap-2">
                                                        <span className="text-sm tabular-nums font-medium">
                                                            {(entry.durationSeconds / 3600).toFixed(2)}
                                                        </span>
                                                        <a href={`/time?week_of=${format(weekStart, "yyyy-MM-dd")}`}>
                                                            <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                                                                Edit
                                                            </Button>
                                                        </a>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {/* Day total */}
                                        <div className="flex justify-end px-4 py-2 bg-muted/20">
                                            <span className="text-xs text-muted-foreground mr-2">Total:</span>
                                            <span className="text-xs font-semibold tabular-nums">{(dayTotal / 3600).toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
