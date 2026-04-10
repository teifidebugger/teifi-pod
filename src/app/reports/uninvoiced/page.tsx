import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { format, subDays, parseISO } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UninvoicedFilters } from "./UninvoicedFilters"
import { Clock, DollarSign, Briefcase } from "lucide-react"

export default async function UninvoicedPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string }>
}) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/login")

    const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, role: true },
    })
    if (!member) redirect("/")

    const workspace = await prisma.workspace.findFirst({
        where: { id: member.workspaceId },
        select: { currency: true },
    })
    const currency = workspace?.currency ?? "USD"

    const canSeeBudget = ["OWNER", "ADMIN", "MANAGER"].includes(member.role ?? "")
    if (!canSeeBudget) redirect("/reports")

    const defaultFrom = format(subDays(new Date(), 29), "yyyy-MM-dd")
    const defaultTo = format(new Date(), "yyyy-MM-dd")

    const sp = await searchParams
    const fromStr = sp.from ?? defaultFrom
    const toStr = sp.to ?? defaultTo

    const entries = await prisma.timeEntry.findMany({
        where: {
            project: { workspaceId: member.workspaceId },
            invoiceId: null,
            timerStartedAt: null,
            isBillable: true,
            date: { gte: fromStr, lte: toStr },
        },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    hourlyRateCents: true,
                    client: { select: { name: true } },
                },
            },
            user: { select: { name: true, email: true } },
        },
        orderBy: { date: "desc" },
    })

    // Group by project
    type ProjectGroup = {
        projectId: string
        projectName: string
        clientName: string | null
        totalSeconds: number
        totalValueCents: number
        earliestEntry: string
        latestEntry: string
        entryCount: number
    }

    const grouped = new Map<string, ProjectGroup>()

    for (const entry of entries) {
        const pid = entry.projectId
        const ratePerHour =
            entry.billableRateCents > 0
                ? entry.billableRateCents
                : (entry.project.hourlyRateCents ?? 0)
        const valueCents = Math.round((entry.durationSeconds / 3600) * ratePerHour)

        const existing = grouped.get(pid)
        if (existing) {
            existing.totalSeconds += entry.durationSeconds
            existing.totalValueCents += valueCents
            existing.entryCount += 1
            if (entry.date < existing.earliestEntry) existing.earliestEntry = entry.date
            if (entry.date > existing.latestEntry) existing.latestEntry = entry.date
        } else {
            grouped.set(pid, {
                projectId: pid,
                projectName: entry.project.name,
                clientName: entry.project.client?.name ?? null,
                totalSeconds: entry.durationSeconds,
                totalValueCents: valueCents,
                earliestEntry: entry.date,
                latestEntry: entry.date,
                entryCount: 1,
            })
        }
    }

    const rows = Array.from(grouped.values()).sort(
        (a, b) => b.totalValueCents - a.totalValueCents
    )

    const totalSeconds = rows.reduce((s, r) => s + r.totalSeconds, 0)
    const totalValueCents = rows.reduce((s, r) => s + r.totalValueCents, 0)
    const totalHours = totalSeconds / 3600

    function formatHours(seconds: number) {
        const h = seconds / 3600
        return h.toFixed(1) + "h"
    }

    function formatMoney(cents: number) {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(cents / 100)
    }

    return (
        <div className="flex-1 space-y-6 pt-6">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">Uninvoiced Time</h2>
                <p className="text-muted-foreground mt-1">
                    Billable time entries with no invoice attached, grouped by project.
                </p>
            </div>

            {/* Filters */}
            <UninvoicedFilters defaultFrom={defaultFrom} defaultTo={defaultTo} />

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Uninvoiced Hours</p>
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold tracking-tight text-foreground">{totalHours.toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">
                        {entries.length} time {entries.length === 1 ? "entry" : "entries"}
                    </p>
                </div>

                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estimated Value</p>
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold tracking-tight text-foreground">{formatMoney(totalValueCents)}</p>
                    <p className="text-xs text-muted-foreground">Based on billable rates</p>
                </div>

                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</p>
                        <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold tracking-tight text-foreground">{rows.length}</p>
                    <p className="text-xs text-muted-foreground">With uninvoiced time</p>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-sidebar-border bg-sidebar/30 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-sidebar-border hover:bg-transparent">
                            <TableHead>Project</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-right">Hours</TableHead>
                            <TableHead className="text-right">Est. Value</TableHead>
                            <TableHead>Date Range</TableHead>
                            <TableHead className="text-right">Entries</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="h-32 text-center text-muted-foreground italic"
                                >
                                    No uninvoiced time entries found for the selected period.
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map((row) => (
                            <TableRow
                                key={row.projectId}
                                className="border-sidebar-border hover:bg-sidebar/50 transition-colors"
                            >
                                <TableCell className="font-medium">{row.projectName}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {row.clientName ? (
                                        <Badge variant="outline">{row.clientName}</Badge>
                                    ) : (
                                        <span className="italic opacity-50">No client</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatHours(row.totalSeconds)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                                    {formatMoney(row.totalValueCents)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {format(parseISO(row.earliestEntry), "MMM d")}
                                    {row.earliestEntry !== row.latestEntry
                                        ? ` – ${format(parseISO(row.latestEntry), "MMM d, yyyy")}`
                                        : `, ${format(parseISO(row.earliestEntry), "yyyy")}`}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                    {row.entryCount}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
