"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProjectBudget {
    id: string
    name: string
    status: string
    billingType: string
    budgetBy: string
    budgetHours: number | null
    budgetCents: number | null
    feeCents: number | null
    costBudgetCents: number | null
    costBudgetIncludeExpenses: boolean
    notifyWhenOverBudget: boolean
    overBudgetNotificationPercent: number
    clientName: string | null
    totalHours: number
    costAmountCents: number
    expensesCents: number
    entryCount: number
}

interface Props {
    projects: ProjectBudget[]
    clients: string[]
    currency?: string
}

function fmtCurrency(cents: number, currency = "USD") {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100)
}

function fmtHours(h: number) {
    return `${h.toFixed(1)}h`
}

type SortDir = "asc" | "desc"

function computeBudgetInfo(p: ProjectBudget, currency = "USD"): {
    budgetLabel: string
    spentLabel: string
    budgetDisplay: string
    pct: number | null
    remaining: string
} {
    if (p.budgetBy === "none" || p.billingType === "NON_BILLABLE") {
        return { budgetLabel: "—", spentLabel: fmtHours(p.totalHours), budgetDisplay: "—", pct: null, remaining: "—" }
    }
    if (p.budgetBy === "project_hours" && p.budgetHours) {
        const pct = (p.totalHours / p.budgetHours) * 100
        return {
            budgetLabel: "Hours",
            spentLabel: fmtHours(p.totalHours),
            budgetDisplay: fmtHours(p.budgetHours),
            pct,
            remaining: fmtHours(Math.max(0, p.budgetHours - p.totalHours)),
        }
    }
    if (p.budgetBy === "project_cost" && p.costBudgetCents) {
        const spent = p.costAmountCents + (p.costBudgetIncludeExpenses ? p.expensesCents : 0)
        const pct = (spent / p.costBudgetCents) * 100
        return {
            budgetLabel: "Cost",
            spentLabel: fmtCurrency(spent, currency),
            budgetDisplay: fmtCurrency(p.costBudgetCents, currency),
            pct,
            remaining: fmtCurrency(Math.max(0, p.costBudgetCents - spent), currency),
        }
    }
    // Legacy budgetCents
    if (p.budgetCents) {
        const pct = (p.costAmountCents / p.budgetCents) * 100
        return {
            budgetLabel: "Fee",
            spentLabel: fmtCurrency(p.costAmountCents, currency),
            budgetDisplay: fmtCurrency(p.budgetCents, currency),
            pct,
            remaining: fmtCurrency(Math.max(0, p.budgetCents - p.costAmountCents), currency),
        }
    }
    return { budgetLabel: "—", spentLabel: fmtHours(p.totalHours), budgetDisplay: "—", pct: null, remaining: "—" }
}

function statusBadge(pct: number | null, threshold: number) {
    if (pct === null) return <Badge variant="secondary" className="text-xs">No budget</Badge>
    if (pct >= 100) return <Badge variant="outline" className="text-xs border-red-400/40 text-red-600 dark:text-red-400">Over budget</Badge>
    if (pct >= threshold) return <Badge variant="outline" className="text-xs border-amber-400/40 text-amber-600 dark:text-amber-400">At risk</Badge>
    return <Badge variant="outline" className="text-xs border-emerald-400/40 text-emerald-600 dark:text-emerald-400">On track</Badge>
}

export function BudgetReportView({ projects, clients, currency = "USD" }: Props) {
    const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "all">("ACTIVE")
    const [clientFilter, setClientFilter] = useState<string>("__all__")
    const [search, setSearch] = useState("")
    const [sortDir, setSortDir] = useState<SortDir>("desc")

    const filtered = useMemo(() => {
        return projects
            .filter(p => statusFilter === "all" || p.status === statusFilter)
            .filter(p => clientFilter === "__all__" || p.clientName === clientFilter)
            .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    }, [projects, statusFilter, clientFilter, search])

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const ai = computeBudgetInfo(a, currency)
            const bi = computeBudgetInfo(b, currency)
            const ap = ai.pct ?? -1
            const bp = bi.pct ?? -1
            return sortDir === "desc" ? bp - ap : ap - bp
        })
    }, [filtered, sortDir])

    // Summary cards
    const summary = useMemo(() => {
        let onBudget = 0, atRisk = 0, overBudget = 0, totalBudgeted = 0
        for (const p of filtered) {
            const info = computeBudgetInfo(p, currency)
            const threshold = p.overBudgetNotificationPercent
            if (info.pct === null) continue
            if (info.pct >= 100) overBudget++
            else if (info.pct >= threshold) atRisk++
            else onBudget++
            if (p.budgetBy === "project_hours" && p.budgetHours) {
                // rough hours * 0 for total budgeted dollars — skip
            } else if (p.budgetBy === "project_cost" && p.costBudgetCents) {
                totalBudgeted += p.costBudgetCents
            } else if (p.feeCents) {
                // Fixed Fee projects: feeCents is the budget
                totalBudgeted += p.feeCents
            } else if (p.budgetCents) {
                totalBudgeted += p.budgetCents
            }
        }
        return { onBudget, atRisk, overBudget, totalBudgeted }
    }, [filtered])

    return (
        <div className="flex-1 space-y-6 pt-6 max-w-6xl">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">Budget Report</h1>
                <p className="text-muted-foreground mt-1">Monitor project budgets and spending across your workspace.</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">On Budget</p>
                    <p className="text-lg font-semibold tracking-tight text-foreground">{summary.onBudget}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">At Risk</p>
                    <p className="text-lg font-semibold tracking-tight text-foreground">{summary.atRisk}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Over Budget</p>
                    <p className="text-lg font-semibold tracking-tight text-foreground">{summary.overBudget}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Budgeted</p>
                    <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums">{fmtCurrency(summary.totalBudgeted, currency)}</p>
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 items-center">
                <Input
                    placeholder="Search projects..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-48 h-8"
                />
                <Select value={statusFilter} onValueChange={v => setStatusFilter(v as "ACTIVE" | "all")}>
                    <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ACTIVE">Active only</SelectItem>
                        <SelectItem value="all">All statuses</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All clients</SelectItem>
                        {clients.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card className="border-sidebar-border">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-sidebar-border hover:bg-transparent">
                                <TableHead>Project</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Budget</TableHead>
                                <TableHead>Spent</TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 font-medium text-xs hover:bg-transparent"
                                        onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
                                    >
                                        % Used
                                        {sortDir === "desc"
                                            ? <ArrowDown className="w-3 h-3 ml-1" />
                                            : <ArrowUp className="w-3 h-3 ml-1" />
                                        }
                                    </Button>
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Remaining</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sorted.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                                        No projects match the current filters.
                                    </TableCell>
                                </TableRow>
                            ) : sorted.map(p => {
                                const info = computeBudgetInfo(p, currency)
                                const displayPct = info.pct !== null ? Math.min(info.pct, 100) : null
                                const threshold = p.overBudgetNotificationPercent
                                return (
                                    <TableRow key={p.id} className="border-sidebar-border/50">
                                        <TableCell className="font-medium">
                                            <a href={`/projects/${p.id}`} className="hover:underline text-foreground">
                                                {p.name}
                                            </a>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {p.clientName ?? <span className="italic">Internal</span>}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {info.budgetLabel}
                                        </TableCell>
                                        <TableCell className="text-sm tabular-nums">
                                            {info.budgetDisplay}
                                        </TableCell>
                                        <TableCell className="text-sm tabular-nums">
                                            {info.spentLabel}
                                        </TableCell>
                                        <TableCell className="min-w-[120px]">
                                            {displayPct !== null ? (
                                                <div className="space-y-1">
                                                    <div className="relative">
                                                        <Progress
                                                            value={displayPct}
                                                            className={`h-1.5 ${
                                                                (info.pct ?? 0) >= 100
                                                                    ? "[&>div]:bg-red-500"
                                                                    : (info.pct ?? 0) >= threshold
                                                                        ? "[&>div]:bg-amber-500"
                                                                        : "[&>div]:bg-emerald-500"
                                                            }`}
                                                        />
                                                        {p.notifyWhenOverBudget && threshold < 100 && (
                                                            <div
                                                                className="absolute top-0 h-1.5 w-px bg-amber-500/70"
                                                                style={{ left: `${Math.min(threshold, 100)}%` }}
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground tabular-nums">
                                                        {(info.pct ?? 0).toFixed(0)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {statusBadge(info.pct, threshold)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm tabular-nums">
                                            {info.remaining}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
