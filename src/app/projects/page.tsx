import React from "react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ProjectForm } from "./ProjectForm"
import { ProjectFilters } from "./ProjectFilters"
import { ProjectActionsClient } from "./ProjectActionsClient"
import { COLOR_HEX_MAP as colorHexMap } from "@/lib/project-colors"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import Link from "next/link"
import { format, eachDayOfInterval, getDay } from "date-fns"
import { Info } from "lucide-react"
import { getCachedWorkspaceClients, getCachedWorkspaceManagers } from "@/lib/cached-data"
import { getAccessibleProjectIds } from "@/lib/rbac"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

function fmtHours(h: number) {
    return h > 0 ? h.toFixed(2) : "\u2014"
}

function fmtCurrency(cents: number, currency = "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100)
}

const STATUS_BADGE: Record<string, string> = {
    ACTIVE:    "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
    TENTATIVE: "bg-violet-500/10 text-violet-700 border-violet-200 dark:text-violet-400 dark:border-violet-800",
    PAUSED:    "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800",
    COMPLETED: "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800",
    ARCHIVED:  "bg-muted text-muted-foreground border-border",
}

const STATUS_LABEL: Record<string, string> = {
    ACTIVE: "Active", TENTATIVE: "Pipeline", PAUSED: "Paused", COMPLETED: "Completed", ARCHIVED: "Archived",
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

export default async function ProjectsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; client?: string; q?: string; manager?: string }>
}) {
    const sp = await searchParams
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { id: true, workspaceId: true, role: true, canManageProjects: true },
    })
    if (!member) redirect("/")

    const isAdmin = ["OWNER", "ADMIN"].includes(member.role) ||
        (member.role === "MANAGER" && member.canManageProjects)

    const projectScope = await getAccessibleProjectIds(member.id, member.role, member.workspaceId)

    // Status filter
    const statusFilter =
        sp.status === "archived"
            ? ["ARCHIVED"]
            : sp.status === "pipeline"
              ? ["TENTATIVE"]
              : sp.status === "all"
                ? ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED", "TENTATIVE"]
                : ["ACTIVE", "PAUSED", "COMPLETED"]

    const projects = await prisma.teifiProject.findMany({
        where: {
            workspaceId: member.workspaceId,
            status: { in: statusFilter as ("ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED")[] },
            ...(projectScope ? { id: { in: projectScope } } : {}),
            ...(sp.client ? { clientId: sp.client } : {}),
            ...(sp.q ? { name: { contains: sp.q, mode: "insensitive" as const } } : {}),
            // Filter by manager: match primary managerId OR any isProjectManager member
            ...(sp.manager ? {
                OR: [
                    { managerId: sp.manager },
                    { projectMembers: { some: { memberId: sp.manager, isProjectManager: true } } },
                ]
            } : {}),
        },
        include: {
            client: true,
            linearTeam: { select: { key: true, name: true } },
            manager: {
                include: { user: { select: { name: true, email: true, image: true } } },
            },
            // Load all project managers for multi-avatar display
            projectMembers: {
                where: { isProjectManager: true },
                include: {
                    member: { include: { user: { select: { name: true, email: true, image: true } } } },
                },
                orderBy: { assignedAt: 'asc' },
            },
            timeEntries: {
                where: { timerStartedAt: null },
                select: { durationSeconds: true, isBillable: true, billableRateCents: true, costRateCents: true, date: true },
            },
            allocations: {
                select: { hoursPerDay: true, startDate: true, endDate: true },
            },
            expenses: {
                where: { isLocked: false },
                select: { amountCents: true, isBillable: true },
            },
        },
        orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
    })

    const workspace = await prisma.workspace.findFirst({
        where: { id: member.workspaceId },
        select: { currency: true, hiddenNavItems: true },
    })
    const currency = workspace?.currency ?? "USD"
    const hiddenNavItems = workspace?.hiddenNavItems ?? []
    const scheduleHidden = hiddenNavItems.includes("schedule")
    const timeHidden = hiddenNavItems.includes("time")

    const [clients, workspaceManagers, linearTeams, unlinkedCount] = await Promise.all([
        getCachedWorkspaceClients(member.workspaceId),
        getCachedWorkspaceManagers(member.workspaceId),
        prisma.linearTeam.findMany({
            where: { workspaceId: member.workspaceId },
            select: { id: true, name: true, key: true },
            orderBy: { name: "asc" },
        }),
        isAdmin
            ? prisma.teifiProject.count({
                where: {
                    workspaceId: member.workspaceId,
                    status: { in: ["ACTIVE", "PAUSED"] },
                    linearTeamId: null,
                },
            })
            : Promise.resolve(0),
    ])

    const managerOptions = workspaceManagers.map(m => ({
        id: m.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        image: m.user.image,
    }))

    // Counts for filter badges
    const scopeFilter = projectScope ? { id: { in: projectScope } } : {}
    const [totalActive, totalArchived, totalPipeline] = await Promise.all([
        prisma.teifiProject.count({
            where: { workspaceId: member.workspaceId, status: { in: ["ACTIVE", "PAUSED", "COMPLETED"] }, ...scopeFilter },
        }),
        prisma.teifiProject.count({
            where: { workspaceId: member.workspaceId, status: "ARCHIVED", ...scopeFilter },
        }),
        prisma.teifiProject.count({
            where: { workspaceId: member.workspaceId, status: "TENTATIVE", ...scopeFilter },
        }),
    ])

    // Group projects by client
    const grouped = new Map<string, { clientName: string; projects: typeof projects }>()
    for (const p of projects) {
        const key = p.clientId ?? "__internal__"
        if (!grouped.has(key)) grouped.set(key, { clientName: p.client?.name ?? "Internal", projects: [] })
        grouped.get(key)!.projects.push(p)
    }

    return (
        <div className="flex-1 space-y-6 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {projects.length} project{projects.length !== 1 ? "s" : ""} · {grouped.size} client{grouped.size !== 1 ? "s" : ""}
                    </p>
                </div>
                {isAdmin && <ProjectForm mode="create" clients={clients} managers={managerOptions} />}
            </div>

            {/* Filters */}
            <ProjectFilters
                totalActive={totalActive}
                totalArchived={totalArchived}
                totalPipeline={totalPipeline}
                totalAll={totalActive + totalArchived + totalPipeline}
                clients={clients.map((c) => ({ id: c.id, name: c.name }))}
                managers={managerOptions}
            />

            {/* Linear linking nudge — admin only, shown when active projects have no Linear team and at least one Linear team is synced */}
            {isAdmin && unlinkedCount > 0 && linearTeams.length > 0 && (
                <div className="flex gap-3 rounded-lg border-l-2 border-l-blue-400 border border-border/50 bg-muted/30 px-4 py-3.5">
                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                        <span className="font-medium">{unlinkedCount} active project{unlinkedCount !== 1 ? "s" : ""} not linked to Linear.</span>
                        {" "}Link projects to a Linear team so members can pick issues when logging time.{" "}
                        <a href="/settings/integrations?returnTo=%2Fprojects" className="font-medium underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                            Bulk-map in Integrations →
                        </a>
                    </p>
                </div>
            )}

            {/* Table */}
            <div className="rounded-lg border border-sidebar-border bg-card [&_[data-slot=table-container]]:overflow-visible">
                <Table>
                    <TableHeader className="sticky top-0 z-10 [&_th]:bg-sidebar/95 [&_th]:backdrop-blur-sm">
                        <TableRow className="border-sidebar-border hover:bg-transparent">
                            <TableHead className="text-xs font-medium text-muted-foreground">Project</TableHead>
                            {!scheduleHidden && <TableHead className="text-right text-xs font-medium text-muted-foreground">Scheduled</TableHead>}
                            {!scheduleHidden && <TableHead className="text-right text-xs font-medium text-muted-foreground">Delta</TableHead>}
                            {!timeHidden && <TableHead className="text-right text-xs font-medium text-muted-foreground">Spent</TableHead>}
                            <TableHead className="text-xs font-medium text-muted-foreground">Manager</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="size-10 rounded-lg bg-muted/60 flex items-center justify-center">
                                            <svg className="size-5 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">No projects found</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Try adjusting your filters or create a new project.</p>
                                        </div>
                                        {isAdmin && <ProjectForm mode="create" clients={clients} managers={managerOptions} />}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        {Array.from(grouped.entries()).map(([clientKey, { clientName, projects: clientProjects }]) => (
                            <React.Fragment key={clientKey}>
                                {/* Client group header */}
                                <TableRow className="bg-sidebar/60 hover:bg-sidebar/60 border-sidebar-border">
                                    <TableCell colSpan={7} className="py-1.5 px-4">
                                        <Link href="/clients" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                                            {clientName}
                                        </Link>
                                    </TableCell>
                                </TableRow>

                                {/* Project rows */}
                                {clientProjects.map((project) => {
                                    const canSeeBudget = isAdmin || project.showBudgetToAll

                                    // For monthly budget, filter entries to current calendar month
                                    const now = new Date()
                                    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
                                    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
                                    const monthEndStr = format(nextMonth, "yyyy-MM-dd")
                                    const budgetEntries = project.budgetIsMonthly
                                        ? project.timeEntries.filter(e => e.date >= monthStartStr && e.date < monthEndStr)
                                        : project.timeEntries

                                    const entries = project.timeEntries
                                    const spentHours = entries.reduce((s, e) => s + e.durationSeconds / 3600, 0)
                                    const budgetSpentHours = budgetEntries.reduce((s, e) => s + e.durationSeconds / 3600, 0)
                                    const spentBillableCents = budgetEntries
                                        .filter((e) => e.isBillable)
                                        .reduce(
                                            (s, e) =>
                                                s +
                                                (e.durationSeconds / 3600) *
                                                    e.billableRateCents,
                                            0,
                                        )

                                    // Scheduled hours from allocations (weekdays only)
                                    const scheduledHours = project.allocations.reduce((s, a) => {
                                        const workdays = eachDayOfInterval({ start: a.startDate, end: a.endDate })
                                            .filter(d => { const dow = getDay(d); return dow !== 0 && dow !== 6 }).length
                                        return s + workdays * a.hoursPerDay
                                    }, 0)

                                    const delta = scheduledHours > 0 ? scheduledHours - spentHours : null

                                    // Budget
                                    let budgetCents: number | null = null
                                    const budgetHours: number | null = project.budgetHours ?? null
                                    if (project.billingType === "FIXED_FEE")
                                        budgetCents = project.feeCents ?? project.budgetCents
                                    else if (project.billingType === "HOURLY")
                                        budgetCents = project.budgetCents

                                    // Spent display
                                    const spentDisplay =
                                        project.billingType === "FIXED_FEE" && spentBillableCents > 0
                                            ? fmtCurrency(spentBillableCents, currency)
                                            : fmtHours(spentHours)

                                    // Manager info
                                    const mgr = project.manager

                                    // Date range
                                    const hasDateRange = project.startsOn || project.endsOn

                                    return (
                                        <TableRow
                                            key={project.id}
                                            className="border-sidebar-border hover:bg-sidebar/40 transition-colors"
                                        >
                                            {/* Project name + billing badge */}
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className="w-2 h-2 rounded-full shrink-0"
                                                        style={{ backgroundColor: colorHexMap[project.color] ?? colorHexMap["orange"] }}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {project.code && (
                                                                <span className="text-[11px] text-muted-foreground/70 font-mono tabular-nums">{project.code}</span>
                                                            )}
                                                            <Link
                                                                href={`/projects/${project.id}`}
                                                                className="text-sm font-medium hover:underline underline-offset-2"
                                                            >
                                                                {project.name}
                                                            </Link>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] h-4 px-1.5 font-normal shrink-0 border-border/60 text-muted-foreground"
                                                            >
                                                                {billingLabel(project.billingType, project.billBy)}
                                                            </Badge>
                                                            {project.status !== "ACTIVE" && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[10px] h-4 px-1.5 font-normal shrink-0 ${STATUS_BADGE[project.status] ?? ""}`}
                                                                >
                                                                    {STATUS_LABEL[project.status] ?? project.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {hasDateRange && (
                                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                                {project.startsOn ? format(project.startsOn, "MMM d, yyyy") : "..."}
                                                                {" \u2192 "}
                                                                {project.endsOn ? format(project.endsOn, "MMM d, yyyy") : "..."}
                                                            </div>
                                                        )}
                                                        {project.linearTeam && (
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <svg className="h-2.5 w-2.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M3.03509 12.9431C3.24245 14.9227 4.10472 16.8468 5.62188 18.364C7.13904 19.8811 9.0631 20.7434 11.0428 20.9508L3.03509 12.9431Z" />
                                                                    <path d="M3 11.4938L12.4921 20.9858C13.2976 20.9407 14.0981 20.7879 14.8704 20.5273L3.4585 9.11548C3.19793 9.88771 3.0451 10.6883 3 11.4938Z" />
                                                                    <path d="M3.86722 8.10999L15.8758 20.1186C16.4988 19.8201 17.0946 19.4458 17.6493 18.9956L4.99021 6.33659C4.54006 6.89125 4.16573 7.487 3.86722 8.10999Z" />
                                                                    <path d="M5.66301 5.59517C9.18091 2.12137 14.8488 2.135 18.3498 5.63604C21.8508 9.13708 21.8645 14.8049 18.3907 18.3228L5.66301 5.59517Z" />
                                                                </svg>
                                                                <span className="text-[10px] text-muted-foreground font-mono">[{project.linearTeam.key}]</span>
                                                                <span className="text-[10px] text-muted-foreground">{project.linearTeam.name}</span>
                                                                {project.linearProjectName && (
                                                                    <span className="text-[10px] text-muted-foreground">· {project.linearProjectName}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>


                                            {/* Scheduled */}
                                            {!scheduleHidden && (
                                                <TableCell className="text-right text-sm">
                                                    {fmtHours(scheduledHours)}
                                                </TableCell>
                                            )}

                                            {/* Delta */}
                                            {!scheduleHidden && (
                                                <TableCell className="text-right text-sm">
                                                    {delta !== null ? (
                                                        <span
                                                            className={
                                                                delta >= 0
                                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                                    : "text-red-600 dark:text-red-400"
                                                            }
                                                        >
                                                            {delta >= 0 ? "+" : ""}
                                                            {delta.toFixed(2)}h
                                                        </span>
                                                    ) : (
                                                        "\u2014"
                                                    )}
                                                </TableCell>
                                            )}

                                            {/* Spent */}
                                            {!timeHidden && (
                                                <TableCell className="text-right text-sm">
                                                    {canSeeBudget ? spentDisplay : "\u2014"}
                                                </TableCell>
                                            )}


                                            {/* Manager — show all isProjectManager members */}
                                            <TableCell>
                                                {project.projectMembers.length > 0 ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="flex -space-x-1.5">
                                                            {project.projectMembers.slice(0, 3).map((pm) => (
                                                                <Avatar key={pm.member.id} className="h-6 w-6 ring-1 ring-background">
                                                                    <AvatarFallback className={`text-[10px] text-white ${avatarBg(pm.member.user.name ?? pm.member.user.email)}`}>
                                                                        {initials(pm.member.user.name, pm.member.user.email)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            ))}
                                                        </div>
                                                        {project.projectMembers.length === 1 ? (
                                                            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                                                {project.projectMembers[0].member.user.name ?? project.projectMembers[0].member.user.email}
                                                            </span>
                                                        ) : project.projectMembers.length > 3 ? (
                                                            <span className="text-xs text-muted-foreground">+{project.projectMembers.length - 3}</span>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right">
                                                {isAdmin && (
                                                    <ProjectActionsClient
                                                        project={project}
                                                        clients={clients}
                                                        managers={managerOptions}
                                                        linearTeams={linearTeams}
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
