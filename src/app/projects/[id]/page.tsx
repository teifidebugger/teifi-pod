import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import { Button } from "@/components/ui/button"
import { Settings, CheckCircle2, Circle, ExternalLink, Link2, Link2Off, AlertTriangle, Dices } from "lucide-react"
import { TaskActions } from "./TaskActions"
import { TaskBillableToggle } from "./TaskBillableToggle"
import { ProjectDetailActions } from "./ProjectDetailActions"
import { ProjectManagerSelect } from "./ProjectManagerSelect"
import { ProjectCharts } from "./ProjectCharts"
import { format, eachDayOfInterval, getDay } from "date-fns"

interface Props {
    params: Promise<{ id: string }>
}

function fmtHours(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
}

function fmtCurrency(cents: number, currency = "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100)
}

function billingLabel(type: string, billBy: string) {
    const base = type === "HOURLY" ? "Hourly" : type === "FIXED_FEE" ? "Fixed Fee" : "Non-Billable"
    if (type === "HOURLY" && billBy && billBy !== "none") {
        const billByLabel = billBy === "People" ? "Per person" : billBy === "Tasks" ? "Per task" : billBy === "Project" ? "Project rate" : ""
        return billByLabel ? `${base} \u00B7 ${billByLabel}` : base
    }
    return base
}

function initials(name: string | null, email: string) {
    if (name) {
        const parts = name.split(" ")
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
}

export default async function ProjectDetailPage({ params }: Props) {
    const { id } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { id: true, workspaceId: true, role: true, canManageProjects: true, workspace: { select: { hiddenNavItems: true } } },
    })
    if (!member) redirect("/")

    const hiddenNavItems = member.workspace?.hiddenNavItems ?? []
    const estimationHidden = hiddenNavItems.includes("estimation")
    const timeHidden = hiddenNavItems.includes("time")

    const isAdmin = ["OWNER", "ADMIN"].includes(member.role) ||
        (member.role === "MANAGER" && member.canManageProjects)

    const [project, allEntries, projectMembers, allocations, workspaceMembers, clients] = await Promise.all([
        prisma.teifiProject.findFirst({
            where: { id, workspaceId: member.workspaceId },
            include: {
                client: true,
                linearTeam: true,
                manager: {
                    include: { user: { select: { name: true, email: true, image: true } } },
                },
                tasks: {
                    include: {
                        linearIssue: { select: { identifier: true, url: true, state: true } },
                        timeEntries: { select: { durationSeconds: true } },
                    },
                    orderBy: [{ completed: "asc" }, { createdAt: "asc" }],
                },
                expenses: {
                    select: { amountCents: true, isBillable: true, isLocked: true },
                },
            },
        }),
        // All completed time entries for this project
        prisma.timeEntry.findMany({
            where: { projectId: id, timerStartedAt: null },
            select: {
                id: true,
                userId: true,
                durationSeconds: true,
                isBillable: true,
                billableRateCents: true,
                costRateCents: true,
                date: true,
                invoiceId: true,
                user: { select: { id: true, name: true, email: true, image: true } },
                task: { select: { name: true } },
                description: true,
            },
            orderBy: { date: "asc" },
        }),
        // Project members (assigned)
        prisma.projectMember.findMany({
            where: { projectId: id },
            include: {
                member: {
                    include: {
                        user: { select: { id: true, name: true, email: true, image: true } },
                    },
                },
            },
        }),
        // Allocations for scheduled hours
        prisma.allocation.findMany({
            where: { projectId: id },
            include: {
                member: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
            },
        }),
        // All workspace members (to look up roles)
        prisma.workspaceMember.findMany({
            where: { workspaceId: member.workspaceId },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
        }),
        // Clients for the ProjectForm (edit project)
        prisma.client.findMany({
            where: { workspaceId: member.workspaceId },
            orderBy: { name: "asc" },
        }),
    ])
    if (!project) notFound()

    const workspace = await prisma.workspace.findFirst({
        where: { id: member.workspaceId },
        select: { currency: true },
    })
    const currency = workspace?.currency ?? "USD"
    const fmt = (cents: number) => fmtCurrency(cents, currency)

    // Manager options for the form
    const managerOptions = workspaceMembers
        .filter(m => ["OWNER", "ADMIN", "MANAGER"].includes(m.role))
        .map(m => ({ id: m.id, name: m.user.name, email: m.user.email, role: m.role }))

    // ─── Budget Access & Monthly Filter ────────────────────────────────────────

    const canSeeBudget = isAdmin || project.showBudgetToAll

    // For monthly budget, restrict entries to the current calendar month
    const budgetEntries = project.budgetIsMonthly
        ? (() => {
              const now = new Date()
              const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
              const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
              const monthEndStr = format(nextMonth, "yyyy-MM-dd")
              return allEntries.filter(e => e.date >= monthStartStr && e.date < monthEndStr)
          })()
        : allEntries

    // ─── Computed Stats ──────────────────────────────────────────────────────────

    const totalHours = allEntries.reduce((s, e) => s + e.durationSeconds / 3600, 0)
    const budgetHoursUsed = budgetEntries.reduce((s, e) => s + e.durationSeconds / 3600, 0)
    // All-time billable/non-billable hours for the hours card display
    const billableHours = allEntries.filter(e => e.isBillable).reduce((s, e) => s + e.durationSeconds / 3600, 0)
    const nonBillableHours = totalHours - billableHours

    // Budget amount uses budgetEntries (current month if budgetIsMonthly, else all-time)
    const billableAmountCents = budgetEntries
        .filter(e => e.isBillable)
        .reduce((s, e) => s + (e.durationSeconds / 3600) * e.billableRateCents, 0)

    const costAmountCents = allEntries
        .reduce((s, e) => s + (e.durationSeconds / 3600) * e.costRateCents, 0)

    const expensesTotalCents = project.expenses.reduce((s, e) => s + e.amountCents, 0)

    // Uninvoiced = billable entries not attached to an invoice
    const uninvoicedCents = allEntries
        .filter(e => e.isBillable && !e.invoiceId)
        .reduce((s, e) => s + (e.durationSeconds / 3600) * e.billableRateCents, 0)

    // Budget remaining
    const budgetTotalCents: number | null = project.billingType === "FIXED_FEE"
        ? (project.feeCents ?? project.budgetCents ?? null)
        : (project.budgetCents ?? null)

    const budgetRemainingCents: number | null = budgetTotalCents !== null
        ? budgetTotalCents - billableAmountCents
        : null
    const budgetPct = budgetTotalCents ? Math.min((billableAmountCents / budgetTotalCents) * 100, 100) : null

    // ─── Missing Rates Warning ───────────────────────────────────────────────────
    let showMissingRatesWarning = false
    if (project.billingType === "HOURLY" && project.billBy !== "none") {
        if (project.billBy === "Project" && !project.hourlyRateCents) {
            showMissingRatesWarning = true
        } else if (project.billBy === "People" && projectMembers.every(pm => pm.billableRateCents === null)) {
            showMissingRatesWarning = true
        }
    }

    // ─── Per-Member Team Stats ───────────────────────────────────────────────────

    const memberByUserId = new Map(workspaceMembers.map(m => [m.userId, m]))

    // Unique users from entries + project members
    const userIds = new Set([
        ...allEntries.map(e => e.userId),
        ...projectMembers.map(pm => pm.member.userId),
    ])

    // Per-member scheduled hours (from allocations)
    const scheduledByMemberId = new Map<string, number>()
    for (const alloc of allocations) {
        if (!alloc.memberId) continue // skip placeholder allocations
        const workdays = eachDayOfInterval({ start: alloc.startDate, end: alloc.endDate })
            .filter(d => { const dow = getDay(d); return dow !== 0 && dow !== 6 }).length
        const hours = workdays * alloc.hoursPerDay
        scheduledByMemberId.set(alloc.memberId, (scheduledByMemberId.get(alloc.memberId) ?? 0) + hours)
    }

    type TeamRow = {
        userId: string
        name: string
        email: string
        image: string | null
        role: string
        scheduledHours: number
        trackedHours: number
        delta: number
        billableAmountCents: number
        costAmountCents: number
    }

    const teamRows: TeamRow[] = Array.from(userIds).map(userId => {
        const wm = memberByUserId.get(userId)
        const userEntries = allEntries.filter(e => e.userId === userId)
        const trackedHours = userEntries.reduce((s, e) => s + e.durationSeconds / 3600, 0)
        const billable = userEntries
            .filter(e => e.isBillable)
            .reduce((s, e) => s + (e.durationSeconds / 3600) * e.billableRateCents, 0)
        const cost = userEntries.reduce((s, e) => s + (e.durationSeconds / 3600) * e.costRateCents, 0)
        const scheduledHours = wm ? (scheduledByMemberId.get(wm.id) ?? 0) : 0
        const user = wm?.user ?? allEntries.find(e => e.userId === userId)?.user ?? { id: userId, name: null, email: userId, image: null }
        return {
            userId,
            name: user.name ?? user.email,
            email: user.email,
            image: user.image ?? null,
            role: wm?.role ?? "MEMBER",
            scheduledHours,
            trackedHours,
            delta: scheduledHours - trackedHours,
            billableAmountCents: billable,
            costAmountCents: cost,
        }
    }).sort((a, b) => b.trackedHours - a.trackedHours)

    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="flex-1 space-y-6 pt-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    {project.client && (
                        <div className="text-sm text-muted-foreground mb-1">
                            <Link href="/clients" className="hover:underline">{project.client.name}</Link>
                        </div>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                        {project.code && (
                            <Badge variant="secondary" className="text-xs font-mono">{project.code}</Badge>
                        )}
                        <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
                        <Badge variant="outline">{billingLabel(project.billingType, project.billBy)}</Badge>
                        {project.status !== "ACTIVE" && (
                            <Badge variant="secondary">{project.status}</Badge>
                        )}
                        {project.manager && (
                            <div className="flex items-center gap-1.5 border border-border rounded-full px-2 py-0.5">
                                <Avatar className="h-5 w-5">
                                    <AvatarFallback className={`text-[9px] text-white ${avatarBg(project.manager.user.name ?? project.manager.user.email)}`}>
                                        {initials(project.manager.user.name, project.manager.user.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                    {project.manager.user.name ?? project.manager.user.email}
                                </span>
                            </div>
                        )}
                        {project.linearTeam ? (
                            <Badge variant="outline" className="text-xs gap-1 border-blue-400/40 text-blue-600 dark:text-blue-400">
                                <Link2 className="w-3 h-3" />
                                {project.linearTeam.key} &middot; {project.linearTeam.name}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                                <Link2Off className="w-3 h-3" />
                                No Linear team
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {canSeeBudget && budgetTotalCents !== null && (
                            <p className="text-sm text-muted-foreground">
                                {fmt(budgetTotalCents)} Total Budget
                            </p>
                        )}
                        {(project.startsOn || project.endsOn) && (
                            <p className="text-sm text-muted-foreground">
                                {project.startsOn ? format(project.startsOn, "MMM d, yyyy") : "..."}
                                {" \u2192 "}
                                {project.endsOn ? format(project.endsOn, "MMM d, yyyy") : "..."}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {isAdmin && (
                        <ProjectDetailActions project={project} clients={clients} managers={managerOptions} />
                    )}
                    {!estimationHidden && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/estimation?projectId=${project.id}`}>
                                <Dices className="h-3.5 w-3.5 mr-1.5" />
                                Estimate
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/projects/${id}/settings`}>
                            <Settings className="w-4 h-4 mr-1.5" />
                            Settings
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Missing rates warning */}
            {showMissingRatesWarning && (
                <div className="flex items-center gap-3 rounded-lg border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 p-3">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        Budget progress might be inaccurate -- this project is missing billable rates.{" "}
                        <Link href={`/projects/${id}/settings`} className="font-medium underline">
                            Settings
                        </Link>
                    </p>
                </div>
            )}

            {/* Charts: Project progress + Hours per week */}
            <ProjectCharts
                entries={allEntries.map(e => ({
                    date: e.date,
                    durationSeconds: e.durationSeconds,
                    isBillable: e.isBillable,
                    billableRateCents: e.billableRateCents,
                }))}
                allocations={allocations.map(a => ({
                    startDate: format(a.startDate, "yyyy-MM-dd"),
                    endDate: format(a.endDate, "yyyy-MM-dd"),
                    hoursPerDay: a.hoursPerDay,
                }))}
                budgetCents={budgetTotalCents}
                budgetHours={project.budgetHours}
                canSeeBudget={canSeeBudget}
            />

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total hours */}
                <Card className="border-sidebar-border">
                    <CardContent className="pt-5 pb-4 px-4">
                        <div className="text-xs text-muted-foreground mb-1">Total hours</div>
                        <div className="text-lg font-semibold tracking-tight tabular-nums">{totalHours.toFixed(2)}</div>
                        <div className="mt-3 space-y-0.5 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Billable</span>
                                <span className="tabular-nums font-medium text-foreground">{billableHours.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Non-billable</span>
                                <span className="tabular-nums">{nonBillableHours.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Budget remaining */}
                {canSeeBudget && (
                    <Card className="border-sidebar-border">
                        <CardContent className="pt-5 pb-4 px-4">
                            <div className="text-xs text-muted-foreground mb-1">
                                {project.budgetIsMonthly ? "Budget remaining (this month)" : "Budget remaining"}{budgetPct !== null ? ` (${Math.round(100 - budgetPct)}%)` : ""}
                            </div>
                            <div className="text-lg font-semibold tracking-tight tabular-nums">
                                {budgetRemainingCents !== null ? fmt(Math.max(0, budgetRemainingCents)) : "\u2014"}
                            </div>
                            {budgetTotalCents !== null && budgetPct !== null && (
                                <div className="mt-3 space-y-1.5">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Total budget</span>
                                        <span className="font-medium text-foreground">{fmt(budgetTotalCents)}</span>
                                    </div>
                                    <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`absolute left-0 top-0 h-full rounded-full ${budgetPct > 90 ? "bg-red-500" : "bg-blue-500"}`}
                                            style={{ width: `${Math.min(budgetPct, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {project.budgetHours && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                    {budgetHoursUsed.toFixed(1)}h of {project.budgetHours}h
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Internal costs */}
                {canSeeBudget && (
                    <Card className="border-sidebar-border">
                        <CardContent className="pt-5 pb-4 px-4">
                            <div className="text-xs text-muted-foreground mb-1">Internal costs</div>
                            <div className="text-lg font-semibold tracking-tight tabular-nums">{fmt(costAmountCents + expensesTotalCents)}</div>
                            <div className="mt-3 space-y-0.5 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Time</span>
                                    <span className="tabular-nums font-medium text-foreground">{fmt(costAmountCents)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Expenses</span>
                                    <span className="tabular-nums">{fmt(expensesTotalCents)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Uninvoiced amount */}
                {canSeeBudget && (
                    <Card className="border-sidebar-border">
                        <CardContent className="pt-5 pb-4 px-4">
                            <div className="text-xs text-muted-foreground mb-1">Uninvoiced amount</div>
                            <div className="text-lg font-semibold tracking-tight tabular-nums">{fmt(uninvoicedCents)}</div>
                            <div className="mt-3 text-sm text-muted-foreground">
                                Billable time not yet invoiced
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Budget vs Actuals */}
            {canSeeBudget && project.budgetBy !== "none" && project.billingType !== "NON_BILLABLE" && (
                (() => {
                    const hoursBudget = project.budgetHours
                    const costBudget = project.costBudgetCents
                    const hoursPct = hoursBudget && hoursBudget > 0 ? Math.min((budgetHoursUsed / hoursBudget) * 100, 120) : null
                    const costPct = costBudget && costBudget > 0 ? Math.min(((costAmountCents + (project.costBudgetIncludeExpenses ? expensesTotalCents : 0)) / costBudget) * 100, 120) : null
                    const billablePct = budgetTotalCents && budgetTotalCents > 0 ? Math.min((billableAmountCents / budgetTotalCents) * 100, 120) : null

                    if (!hoursPct && !costPct && !billablePct) return null

                    const threshold = project.notifyWhenOverBudget ? (project.overBudgetNotificationPercent ?? 80) : 80

                    function barColor(pct: number) {
                        if (pct >= 100) return "bg-red-500"
                        if (pct >= threshold) return "bg-amber-500"
                        return "bg-blue-500"
                    }
                    function statusBadge(pct: number) {
                        if (pct >= 100) return <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Over budget</Badge>
                        if (pct >= threshold) return <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-amber-400 text-amber-600 dark:text-amber-400">At risk</Badge>
                        return <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-emerald-400 text-emerald-600 dark:text-emerald-400">On track</Badge>
                    }

                    return (
                        <Card className="border-sidebar-border">
                            <CardHeader className="pb-3 pt-4 px-4">
                                <CardTitle className="text-base">Budget vs Actuals</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-5">
                                {hoursPct !== null && hoursBudget && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Hours</span>
                                            <div className="flex items-center gap-2">
                                                <span className="tabular-nums font-medium">{budgetHoursUsed.toFixed(1)}h of {hoursBudget}h</span>
                                                {statusBadge(hoursPct)}
                                            </div>
                                        </div>
                                        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                                            <div className={`absolute left-0 top-0 h-full rounded-full transition-all ${barColor(hoursPct)}`} style={{ width: `${Math.min(hoursPct, 100)}%` }} />
                                            {project.notifyWhenOverBudget && (
                                                <div className="absolute top-0 h-full w-px bg-foreground/30" style={{ left: `${threshold}%` }} />
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground text-right">
                                            {Math.max(0, hoursBudget - budgetHoursUsed).toFixed(1)}h remaining ({Math.round(hoursPct)}% used)
                                        </div>
                                    </div>
                                )}
                                {billablePct !== null && budgetTotalCents && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Billable amount</span>
                                            <div className="flex items-center gap-2">
                                                <span className="tabular-nums font-medium">{fmt(billableAmountCents)} of {fmt(budgetTotalCents)}</span>
                                                {statusBadge(billablePct)}
                                            </div>
                                        </div>
                                        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                                            <div className={`absolute left-0 top-0 h-full rounded-full transition-all ${barColor(billablePct)}`} style={{ width: `${Math.min(billablePct, 100)}%` }} />
                                            {project.notifyWhenOverBudget && (
                                                <div className="absolute top-0 h-full w-px bg-foreground/30" style={{ left: `${threshold}%` }} />
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground text-right">
                                            {fmt(Math.max(0, budgetTotalCents - billableAmountCents))} remaining ({Math.round(billablePct)}% used)
                                        </div>
                                    </div>
                                )}
                                {costPct !== null && costBudget && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Cost</span>
                                            <div className="flex items-center gap-2">
                                                <span className="tabular-nums font-medium">
                                                    {fmt(costAmountCents + (project.costBudgetIncludeExpenses ? expensesTotalCents : 0))} of {fmt(costBudget)}
                                                </span>
                                                {statusBadge(costPct)}
                                            </div>
                                        </div>
                                        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                                            <div className={`absolute left-0 top-0 h-full rounded-full transition-all ${barColor(costPct)}`} style={{ width: `${Math.min(costPct, 100)}%` }} />
                                            {project.notifyWhenOverBudget && (
                                                <div className="absolute top-0 h-full w-px bg-foreground/30" style={{ left: `${threshold}%` }} />
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground text-right">
                                            {fmt(Math.max(0, costBudget - costAmountCents - (project.costBudgetIncludeExpenses ? expensesTotalCents : 0)))} remaining ({Math.round(costPct)}% used)
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })()
            )}

            {/* Tabs: Tasks | Team */}
            <Tabs defaultValue="tasks">
                <TabsList>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="mt-4">
                    <Card className="border-sidebar-border">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
                            <h3 className="text-base font-semibold">Tasks</h3>
                            {isAdmin && <TaskActions projectId={id} mode="create" />}
                        </div>
                        <div>
                            {project.tasks.length === 0 ? (
                                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                                    No tasks yet. Tasks are created automatically when you log time linked to a Linear issue, or add them manually.
                                </div>
                            ) : (
                                <div className="divide-y divide-sidebar-border/50">
                                    {project.tasks.map(task => {
                                        const taskSeconds = task.timeEntries.reduce((s, e) => s + e.durationSeconds, 0)
                                        return (
                                            <div key={task.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-sidebar/30 transition-colors">
                                                {task.completed
                                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                                                }
                                                <div className="flex-1 min-w-0">
                                                    <span className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                                                        {task.name}
                                                    </span>
                                                    {task.description && (
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                                                    )}
                                                </div>
                                                {isAdmin && (
                                                    <TaskBillableToggle
                                                        taskId={task.id}
                                                        isBillable={task.isBillable}
                                                        projectBillBy={project.billBy}
                                                        hourlyRateCents={task.hourlyRateCents}
                                                    />
                                                )}
                                                {task.linearIssue && (
                                                    <a
                                                        href={task.linearIssue.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs text-blue-500 hover:underline shrink-0"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        {task.linearIssue.identifier}
                                                    </a>
                                                )}
                                                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                                    {fmtHours(taskSeconds)}
                                                </span>
                                                {isAdmin && (
                                                    <TaskActions projectId={id} task={task} mode="edit" />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="team" className="mt-4">
                    <Card className="border-sidebar-border">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
                            <h3 className="text-base font-semibold">Team</h3>
                            <div className="flex items-center gap-3">
                                {isAdmin && (
                                    <ProjectManagerSelect
                                        projectId={project.id}
                                        currentManagerId={project.managerId}
                                        members={workspaceMembers.map(m => ({
                                            id: m.id,
                                            name: m.user.name,
                                            email: m.user.email,
                                            image: m.user.image,
                                            role: m.role,
                                        }))}
                                    />
                                )}
                                <span className="text-xs text-muted-foreground">All time</span>
                            </div>
                        </div>
                        {teamRows.length === 0 ? (
                            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                                No team members have tracked time or been assigned to this project yet.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-sidebar-border hover:bg-transparent">
                                        <TableHead>Member</TableHead>
                                        <TableHead className="text-right">Scheduled</TableHead>
                                        <TableHead className="text-right">Hours</TableHead>
                                        <TableHead className="text-right">Delta</TableHead>
                                        {canSeeBudget && <TableHead className="text-right">Billable amount</TableHead>}
                                        {canSeeBudget && <TableHead className="text-right">Costs</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamRows.map(row => (
                                        <TableRow key={row.userId} className="border-sidebar-border/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className={`text-xs text-white ${avatarBg(row.name ?? row.email)}`}>
                                                            {initials(row.name, row.email)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium truncate">{row.name}</div>
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5">
                                                            {row.role}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                                                {row.scheduledHours > 0 ? row.scheduledHours.toFixed(1) : "\u2014"}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-sm font-medium">
                                                {row.trackedHours.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-sm">
                                                {row.scheduledHours > 0 ? (
                                                    <span className={row.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                                                        {row.delta >= 0 ? "+" : ""}{row.delta.toFixed(1)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">{"\u2014"}</span>
                                                )}
                                            </TableCell>
                                            {canSeeBudget && (
                                                <TableCell className="text-right tabular-nums text-sm">
                                                    {fmt(row.billableAmountCents)}
                                                </TableCell>
                                            )}
                                            {canSeeBudget && (
                                                <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                                                    {fmt(row.costAmountCents)}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                    {/* Totals row */}
                                    <TableRow className="border-sidebar-border bg-muted/30 font-medium">
                                        <TableCell className="text-sm">Total</TableCell>
                                        <TableCell className="text-right tabular-nums text-sm">
                                            {teamRows.reduce((s, r) => s + r.scheduledHours, 0) > 0
                                                ? teamRows.reduce((s, r) => s + r.scheduledHours, 0).toFixed(1)
                                                : "\u2014"}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-sm">
                                            {totalHours.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-sm">
                                            {teamRows.reduce((s, r) => s + r.scheduledHours, 0) > 0 ? (
                                                (() => {
                                                    const totalDelta = teamRows.reduce((s, r) => s + r.delta, 0)
                                                    return (
                                                        <span className={totalDelta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                                                            {totalDelta >= 0 ? "+" : ""}{totalDelta.toFixed(1)}
                                                        </span>
                                                    )
                                                })()
                                            ) : "\u2014"}
                                        </TableCell>
                                        {canSeeBudget && (
                                            <TableCell className="text-right tabular-nums text-sm">
                                                {fmt(teamRows.reduce((s, r) => s + r.billableAmountCents, 0))}
                                            </TableCell>
                                        )}
                                        {canSeeBudget && (
                                            <TableCell className="text-right tabular-nums text-sm">
                                                {fmt(teamRows.reduce((s, r) => s + r.costAmountCents, 0))}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
