import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, BarChart2, Info, Layers, TrendingUp, Users } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { EstimateDistributionChart } from "./EstimationCharts"
import type { EstimateDistributionDatum } from "./EstimationCharts"
import { STATUS_BADGE, STATUS_LABEL } from "../_lib/status"
import { ExportCSVButton, type SessionCSVRow } from "../ExportCSVButton"

export default async function EstimationAnalyticsPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true },
    })
    if (!member) redirect("/")

    // --- Metric queries (parallel) ---
    const [totalSessions, allRounds, recentSessions] = await Promise.all([
        // 1. Total sessions
        prisma.pokerSession.count({
            where: { workspaceId: member.workspaceId },
        }),

        // 2. All rounds with votes (for consensus + distribution)
        prisma.pokerRound.findMany({
            where: {
                session: { workspaceId: member.workspaceId },
                finalEstimate: { not: null },
            },
            select: {
                finalEstimate: true,
                votes: { select: { value: true } },
            },
        }),

        // 3. Last 10 sessions
        prisma.pokerSession.findMany({
            where: { workspaceId: member.workspaceId },
            include: {
                createdBy: { select: { user: { select: { name: true } } } },
                project: { select: { name: true } },
                rounds: {
                    select: {
                        title: true,
                        finalEstimate: true,
                        votes: { select: { value: true } },
                    },
                    orderBy: { position: "asc" },
                },
                _count: { select: { rounds: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        }),
    ])

    // --- Derived metrics ---
    const totalRoundsEstimated = allRounds.length

    // Mode of finalEstimate
    const estimateCounts = new Map<string, number>()
    for (const round of allRounds) {
        const est = round.finalEstimate!
        estimateCounts.set(est, (estimateCounts.get(est) ?? 0) + 1)
    }
    let mostCommonEstimate: string | null = null
    let mostCommonCount = 0
    for (const [est, cnt] of estimateCounts) {
        if (cnt > mostCommonCount) {
            mostCommonCount = cnt
            mostCommonEstimate = est
        }
    }

    // Consensus rate: rounds where all votes were the same value
    const consensusRounds = allRounds.filter((r) => {
        if (r.votes.length < 2) return false
        const first = r.votes[0].value
        return r.votes.every((v) => v.value === first)
    })
    const consensusRate =
        totalRoundsEstimated > 0
            ? Math.round((consensusRounds.length / totalRoundsEstimated) * 100)
            : 0

    // Estimate distribution chart data — sort by numeric value where possible
    const distributionData: EstimateDistributionDatum[] = Array.from(estimateCounts.entries())
        .sort(([a], [b]) => {
            const na = parseFloat(a)
            const nb = parseFloat(b)
            if (!isNaN(na) && !isNaN(nb)) return na - nb
            return a.localeCompare(b)
        })
        .map(([estimate, count]) => ({ estimate, count }))

    // Build CSV rows for recent sessions — one row per round
    const csvRows: SessionCSVRow[] = recentSessions.flatMap((s) => {
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
                        <h1 className="text-xl font-semibold tracking-tight">Estimation Analytics</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Insights across all planning poker sessions
                        </p>
                    </div>
                </div>
                {recentSessions.length > 0 && (
                    <ExportCSVButton
                        rows={csvRows}
                        filename="estimation-analytics.csv"
                    />
                )}
            </div>

            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-sidebar-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total sessions
                        </CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground/50" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums">{totalSessions}</p>
                    </CardContent>
                </Card>

                <Card className="border-sidebar-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Rounds estimated
                        </CardTitle>
                        <Layers className="h-4 w-4 text-muted-foreground/50" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums">{totalRoundsEstimated}</p>
                    </CardContent>
                </Card>

                <Card className="border-sidebar-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Most common estimate
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums font-mono">
                            {mostCommonEstimate ?? "—"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-sidebar-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            Consensus rate
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Percentage of rounds where participants agreed on the same estimate</TooltipContent>
                            </Tooltip>
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground/50" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums">
                            {totalRoundsEstimated > 0 ? `${consensusRate}%` : "—"}
                        </p>
                        {totalRoundsEstimated > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {consensusRounds.length} of {totalRoundsEstimated} rounds
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card className="border-sidebar-border">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Estimate distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <EstimateDistributionChart data={distributionData} />
                </CardContent>
            </Card>

            {/* Recent sessions table */}
            <Card className="border-sidebar-border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-medium">Recent sessions</CardTitle>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                        <Link href="/estimation/history">View all</Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {recentSessions.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                            No sessions yet
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="font-medium">Session</TableHead>
                                    <TableHead className="font-medium">Status</TableHead>
                                    <TableHead className="font-medium text-right">Rounds</TableHead>
                                    <TableHead className="font-medium">Host</TableHead>
                                    <TableHead className="font-medium">Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentSessions.map((s) => (
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
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
