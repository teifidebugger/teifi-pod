import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dices, Users, Layers, History, BarChart2, FolderOpen } from "lucide-react"
import { CreateSessionDialog } from "./CreateSessionDialog"
import { SessionActions } from "./SessionActions"
import { ProjectFilter } from "./ProjectFilter"
import { EstimationQuickGuide } from "./EstimationQuickGuide"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { STATUS_BADGE, STATUS_LABEL, STATUS_DESCRIPTION, DECK_LABEL, DECK_TOOLTIP } from "./_lib/status"

export default async function EstimationPage({
    searchParams,
}: {
    searchParams: Promise<{ projectId?: string; filter?: string }>
}) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    const canCreateSession = ["OWNER", "ADMIN", "MANAGER"].includes(member.role)

    const currentUserId = session.user.id

    const { projectId, filter } = await searchParams

    let defaultProject: { id: string; name: string } | undefined
    if (projectId) {
        const proj = await prisma.teifiProject.findFirst({
            where: { id: projectId, workspaceId: member.workspaceId },
            select: { id: true, name: true },
        })
        if (proj) defaultProject = proj
    }

    const [sessions, projects] = await Promise.all([
        prisma.pokerSession.findMany({
            where: {
                workspaceId: member.workspaceId,
                ...(filter ? { projectId: filter } : {}),
            },
            include: {
                createdBy: { select: { userId: true, user: { select: { name: true } } } },
                project: { select: { id: true, name: true, code: true } },
                _count: { select: { rounds: true, participants: true } },
                rounds: { where: { status: "COMPLETE" }, select: { id: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.teifiProject.findMany({
            where: { workspaceId: member.workspaceId, status: "ACTIVE" },
            select: { id: true, name: true, code: true },
            orderBy: { name: "asc" },
        }),
    ])

    return (
        <div className="flex-1 space-y-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Estimation</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ProjectFilter projects={projects} currentFilter={filter} />
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/estimation/history">
                            <History className="h-3.5 w-3.5 mr-1.5" />
                            History
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/estimation/analytics">
                            <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
                            Analytics
                        </Link>
                    </Button>
                    {canCreateSession && (
                        <CreateSessionDialog projects={projects} defaultProjectId={defaultProject?.id} defaultProjectName={defaultProject?.name} />
                    )}
                </div>
            </div>

            <EstimationQuickGuide />

            {/* Empty state */}
            {sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-sidebar-border bg-sidebar/30 py-20">
                    <div className="size-12 rounded-lg bg-muted/60 flex items-center justify-center">
                        <Dices className="size-6 text-muted-foreground/50" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-foreground">No estimation sessions yet</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {canCreateSession
                                ? "Create a session to start planning poker with your team."
                                : "Ask a manager to create an estimation session."}
                        </p>
                    </div>
                    {canCreateSession && (
                        <CreateSessionDialog projects={projects} defaultProjectId={defaultProject?.id} defaultProjectName={defaultProject?.name} />
                    )}
                </div>
            )}

            {/* Session cards grid */}
            {sessions.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sessions.map((s) => (
                        <Link key={s.id} href={`/estimation/${s.id}`} className="group block">
                            <Card className="h-full border-sidebar-border bg-card transition-colors hover:bg-sidebar/60 hover:border-foreground/20">
                                <CardContent className="p-4 flex flex-col gap-3 h-full relative">
                                    {/* Session actions (owner only) */}
                                    <div className="absolute top-2 right-2 z-10">
                                        <SessionActions
                                            sessionId={s.id}
                                            sessionName={s.name}
                                            description={s.description}
                                            deckType={s.deckType}
                                            isOwner={s.createdBy.userId === currentUserId}
                                        />
                                    </div>
                                    {/* Top row: name + status badge */}
                                    <div className="flex items-start justify-between gap-2 pr-8">
                                        <p className="text-sm font-medium leading-snug group-hover:underline underline-offset-2 line-clamp-2">
                                            {s.name}
                                        </p>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                {s.status === "ACTIVE" ? (
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        Live
                                                        {s._count.rounds > 0 && (
                                                            <span className="text-muted-foreground font-normal">
                                                                {s.rounds.length}/{s._count.rounds}
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className={`shrink-0 text-[10px] h-5 px-1.5 font-medium ${STATUS_BADGE[s.status] ?? ""}`}
                                                    >
                                                        {STATUS_LABEL[s.status] ?? s.status}
                                                    </Badge>
                                                )}
                                            </TooltipTrigger>
                                            <TooltipContent>{STATUS_DESCRIPTION[s.status] ?? s.status}</TooltipContent>
                                        </Tooltip>
                                    </div>

                                    {/* Project link */}
                                    {s.project && (
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <FolderOpen className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{s.project.code ? `[${s.project.code}] ` : ""}{s.project.name}</span>
                                        </p>
                                    )}

                                    {/* Description */}
                                    {s.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                            {s.description}
                                        </p>
                                    )}

                                    {/* Stats row */}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                                        <span className="flex items-center gap-1">
                                            <Layers className="h-3.5 w-3.5" />
                                            {s._count.rounds} round{s._count.rounds !== 1 ? "s" : ""}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" />
                                            {s._count.participants} participant{s._count.participants !== 1 ? "s" : ""}
                                        </span>
                                        {DECK_TOOLTIP[s.deckType] ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="ml-auto cursor-default">{DECK_LABEL[s.deckType] ?? s.deckType}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>{DECK_TOOLTIP[s.deckType]}</TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <span className="ml-auto">{DECK_LABEL[s.deckType] ?? s.deckType}</span>
                                        )}
                                    </div>

                                    {/* Footer: created by + time */}
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 border-t border-sidebar-border pt-2.5">
                                        <span>
                                            {s.createdBy.user.name ?? "Unknown"}
                                        </span>
                                        <span title={s.createdAt.toISOString()}>
                                            {formatDistanceToNow(s.createdAt, { addSuffix: true })}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
