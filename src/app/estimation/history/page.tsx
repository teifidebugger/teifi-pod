import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, History } from "lucide-react"
import { STATUS_BADGE, STATUS_LABEL } from "../_lib/status"
import { ExportCSVButton, type SessionCSVRow } from "../ExportCSVButton"

const VALID_STATUSES = ["LOBBY", "ACTIVE", "COMPLETED"] as const
type StatusFilter = typeof VALID_STATUSES[number] | "ALL"

export default async function EstimationHistoryPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true },
    })
    if (!member) redirect("/")

    const params = await searchParams
    const statusParam = params.status?.toUpperCase() as StatusFilter | undefined
    const activeFilter: StatusFilter =
        statusParam && [...VALID_STATUSES, "ALL"].includes(statusParam as StatusFilter)
            ? statusParam
            : "ALL"

    const sessions = await prisma.pokerSession.findMany({
        where: {
            workspaceId: member.workspaceId,
            ...(activeFilter !== "ALL" ? { status: activeFilter } : {}),
        },
        include: {
            createdBy: {
                select: { user: { select: { name: true } } },
            },
            project: { select: { name: true } },
            rounds: {
                select: {
                    title: true,
                    finalEstimate: true,
                    votes: { select: { value: true } },
                },
                orderBy: { position: "asc" },
            },
            _count: { select: { rounds: true, participants: true } },
        },
        orderBy: { createdAt: "desc" },
    })

    // Build CSV rows — one row per round (sessions with no rounds get one summary row)
    const csvRows: SessionCSVRow[] = sessions.flatMap((s) => {
        const sessionName = s.name
        const projectName = s.project?.name ?? "—"
        const createdAt = format(s.createdAt, "yyyy-MM-dd")
        if (s.rounds.length === 0) {
            return [
                {
                    sessionName,
                    projectName,
                    roundTitle: "—",
                    finalEstimate: "—",
                    voteCount: 0,
                    consensusPct: "—",
                    createdAt,
                },
            ]
        }
        return s.rounds.map((r) => {
            const voteCount = r.votes.length
            let consensusPct = "—"
            if (voteCount > 0) {
                const counts = new Map<string, number>()
                for (const v of r.votes) {
                    counts.set(v.value, (counts.get(v.value) ?? 0) + 1)
                }
                const maxCount = Math.max(...counts.values())
                consensusPct = `${Math.round((maxCount / voteCount) * 100)}%`
            }
            return {
                sessionName,
                projectName,
                roundTitle: r.title,
                finalEstimate: r.finalEstimate ?? "—",
                voteCount,
                consensusPct,
                createdAt,
            }
        })
    })

    const filterOptions: { label: string; value: StatusFilter }[] = [
        { label: "All", value: "ALL" },
        { label: "Lobby", value: "LOBBY" },
        { label: "Active", value: "ACTIVE" },
        { label: "Completed", value: "COMPLETED" },
    ]

    return (
        <div className="flex-1 space-y-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href="/estimation">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Session History</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {sessions.length > 0 && (
                        <ExportCSVButton
                            rows={csvRows}
                            filename="estimation-history.csv"
                        />
                    )}
                    {/* Status filter */}
                    <div className="flex items-center gap-1.5">
                    {filterOptions.map((opt) => (
                        <Button
                            key={opt.value}
                            asChild
                            variant={activeFilter === opt.value ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 text-xs"
                        >
                            <Link
                                href={
                                    opt.value === "ALL"
                                        ? "/estimation/history"
                                        : `/estimation/history?status=${opt.value.toLowerCase()}`
                                }
                            >
                                {opt.label}
                            </Link>
                        </Button>
                    ))}
                    </div>
                </div>
            </div>

            {/* Empty state */}
            {sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-sidebar-border bg-sidebar/30 py-20">
                    <div className="size-12 rounded-lg bg-muted/60 flex items-center justify-center">
                        <History className="size-6 text-muted-foreground/50" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-foreground">No sessions found</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {activeFilter === "COMPLETED"
                                ? "No completed sessions yet — sessions appear once a host marks them done"
                                : activeFilter !== "ALL"
                                    ? `No ${STATUS_LABEL[activeFilter]} sessions yet.`
                                    : "Sessions will appear here once created."}
                        </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/estimation">Back to sessions</Link>
                    </Button>
                </div>
            )}

            {/* Table */}
            {sessions.length > 0 && (
                <div className="rounded-lg border border-sidebar-border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="font-medium">Session name</TableHead>
                                <TableHead className="font-medium">Status</TableHead>
                                <TableHead className="font-medium text-right">Rounds</TableHead>
                                <TableHead className="font-medium text-right">Participants</TableHead>
                                <TableHead className="font-medium">Host</TableHead>
                                <TableHead className="font-medium">Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.map((s) => (
                                <TableRow key={s.id} className="hover:bg-sidebar/40">
                                    <TableCell>
                                        <Link
                                            href={`/estimation/${s.id}`}
                                            className="font-medium hover:underline underline-offset-2 text-sm"
                                        >
                                            {s.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] h-5 px-1.5 font-medium ${STATUS_BADGE[s.status] ?? ""}`}
                                        >
                                            {STATUS_LABEL[s.status] ?? s.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                                        {s._count.rounds}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                                        {s._count.participants}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {s.createdBy.user.name ?? "Unknown"}
                                    </TableCell>
                                    <TableCell
                                        className="text-sm text-muted-foreground"
                                        title={s.createdAt.toISOString()}
                                    >
                                        {formatDistanceToNow(s.createdAt, { addSuffix: true })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
