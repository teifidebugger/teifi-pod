import React, { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { TaskForm } from "./TaskForm"
import { TaskFilters } from "./TaskFilters"
import { TaskGroupSection } from "./TaskGroupSection"
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { CheckCircle2, Info } from "lucide-react"
import Link from "next/link"

type StatusParam = "open" | "completed" | "all"

function parseStatus(raw: string | undefined): StatusParam {
    if (raw === "completed" || raw === "all") return raw
    return "open"
}

export default async function TasksPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; status?: string; clientId?: string; projectId?: string }>
}) {
    const sp = await searchParams
    const search = sp.search?.trim() ?? ""
    const status = parseStatus(sp.status)
    const clientId = sp.clientId?.trim() ?? ""
    const projectId = sp.projectId?.trim() ?? ""

    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    const completedFilter: boolean | undefined =
        status === "open" ? false : status === "completed" ? true : undefined

    const [tasks, projects, clients] = await Promise.all([
        prisma.teifiTask.findMany({
            where: {
                project: {
                    workspaceId: member.workspaceId,
                    ...(clientId ? { clientId } : {}),
                    ...(projectId ? { id: projectId } : {}),
                },
                ...(completedFilter !== undefined ? { completed: completedFilter } : {}),
                ...(search
                    ? {
                          OR: [
                              { name: { contains: search, mode: "insensitive" } },
                              { description: { contains: search, mode: "insensitive" } },
                          ],
                      }
                    : {}),
            },
            include: {
                project: { include: { client: true } },
                timeEntries: { select: { durationSeconds: true } },
            },
            orderBy: [{ completed: "asc" }, { updatedAt: "desc" }],
        }),
        prisma.teifiProject.findMany({
            where: { workspaceId: member.workspaceId, status: "ACTIVE" },
            include: { client: true },
            orderBy: { name: "asc" },
        }),
        prisma.client.findMany({
            where: { workspaceId: member.workspaceId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ])

    // Group tasks by project
    const grouped = new Map<
        string,
        {
            projectId: string
            projectName: string
            clientName: string
            tasks: (typeof tasks[number] & { trackedSeconds: number })[]
            totalSeconds: number
            openCount: number
        }
    >()

    for (const task of tasks) {
        const key = task.projectId
        if (!grouped.has(key)) {
            grouped.set(key, {
                projectId: task.projectId,
                projectName: task.project.name,
                clientName: task.project.client?.name ?? "Internal",
                tasks: [],
                totalSeconds: 0,
                openCount: 0,
            })
        }
        const group = grouped.get(key)!
        const trackedSeconds = task.timeEntries.reduce((s, e) => s + e.durationSeconds, 0)
        group.tasks.push({ ...task, trackedSeconds })
        group.totalSeconds += trackedSeconds
        if (!task.completed) group.openCount++
    }

    const sortedGroups = Array.from(grouped.values()).sort((a, b) => {
        if (a.openCount > 0 && b.openCount === 0) return -1
        if (a.openCount === 0 && b.openCount > 0) return 1
        return a.projectName.localeCompare(b.projectName)
    })

    const totalTasks = tasks.length
    const totalOpen = tasks.filter((t) => !t.completed).length
    const hasFilters = !!(search || clientId || projectId || status !== "open")

    return (
        <div className="flex-1 space-y-5 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {totalOpen} open · {totalTasks} total · {sortedGroups.length} project{sortedGroups.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <TaskForm mode="create" projects={projects} />
            </div>

            {/* Info banner */}
            <div className="flex items-center gap-3 rounded-lg border border-border/50 border-l-2 border-l-blue-400 bg-muted/30 px-4 py-2.5">
                <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <p className="text-sm text-foreground/80">
                    Tasks are billable line-items within a project — members select one when logging time.{" "}
                    <Link
                        href="/projects"
                        className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
                    >
                        Manage from the project page
                    </Link>{" "}
                    or create here.
                </p>
            </div>

            {/* Filter bar — client component for instant select navigation */}
            <Suspense fallback={null}>
            <TaskFilters
                clients={clients}
                projects={projects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId }))}
                search={search}
                status={status}
                clientId={clientId}
                projectId={projectId}
            />
            </Suspense>

            {/* Empty state */}
            {totalTasks === 0 && (
                <div className="rounded-lg border border-border/40 bg-card">
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="size-10 rounded-lg bg-muted/60 flex items-center justify-center">
                            <CheckCircle2 className="size-5 text-muted-foreground/50" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-foreground">
                                {hasFilters ? "No tasks match these filters" : "No tasks yet"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {hasFilters
                                    ? "Try clearing filters or switching the status tab."
                                    : "Create your first task to start tracking time against it."}
                            </p>
                        </div>
                        {!hasFilters && <TaskForm mode="create" projects={projects} />}
                    </div>
                </div>
            )}

            {/* Grouped task table */}
            {sortedGroups.length > 0 && (
                <div className="rounded-lg border border-border/40 bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 [&_th]:bg-sidebar/95 [&_th]:backdrop-blur-sm">
                            <TableRow className="border-border/40 hover:bg-transparent">
                                <TableHead className="text-xs font-medium text-muted-foreground w-[40%]">Task</TableHead>
                                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                                <TableHead className="text-xs font-medium text-muted-foreground">Billable</TableHead>
                                <TableHead className="text-right text-xs font-medium text-muted-foreground">Tracked</TableHead>
                                <TableHead className="w-[60px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedGroups.map((group) => (
                                <TaskGroupSection
                                    key={group.projectId}
                                    projectId={group.projectId}
                                    projectName={group.projectName}
                                    clientName={group.clientName}
                                    tasks={group.tasks}
                                    totalSeconds={group.totalSeconds}
                                    openCount={group.openCount}
                                    projects={projects}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
