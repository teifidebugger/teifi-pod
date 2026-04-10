"use client"

import { useState, useTransition, useCallback } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import {
    getExpenseReport,
    type ExpenseReportFilters,
    type ExpenseReportEntry,
} from "@/app/actions/reports"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts"
import { Download, Loader2, Receipt } from "lucide-react"

interface Project { id: string; name: string }
interface Member  { id: string; name: string }
interface Category { id: string; name: string }

interface Props {
    projects: Project[]
    members: Member[]
    categories: Category[]
}

function fmt(cents: number): string {
    return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function toISODate(d: Date): string {
    return d.toISOString().slice(0, 10)
}

function buildChartData(entries: ExpenseReportEntry[]) {
    const byDate = new Map<string, { billable: number; nonBillable: number }>()
    for (const e of entries) {
        const key = e.date
        if (!byDate.has(key)) byDate.set(key, { billable: 0, nonBillable: 0 })
        const row = byDate.get(key)!
        if (e.isBillable) row.billable += e.amountCents
        else row.nonBillable += e.amountCents
    }
    return Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({
            date: format(new Date(date + "T12:00:00"), "MMM d"),
            Billable: parseFloat((v.billable / 100).toFixed(2)),
            "Non-billable": parseFloat((v.nonBillable / 100).toFixed(2)),
        }))
}

function exportCSV(entries: ExpenseReportEntry[]) {
    const header = ["Date", "Member", "Project", "Category", "Description", "Amount", "Billable", "Notes"]
    const rows = entries.map((e) => [
        e.date,
        e.userName,
        e.projectName,
        e.categoryName ?? "",
        e.description,
        (e.amountCents / 100).toFixed(2),
        e.isBillable ? "Yes" : "No",
        e.notes ?? "",
    ])
    const csv = [header, ...rows]
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `expense-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

const now = new Date()
const DEFAULT_FROM = toISODate(startOfMonth(now))
const DEFAULT_TO = toISODate(endOfMonth(now))

export function ExpenseReportView({ projects, members, categories }: Props) {
    const [from, setFrom] = useState(DEFAULT_FROM)
    const [to, setTo] = useState(DEFAULT_TO)
    const [projectId, setProjectId] = useState("__all__")
    const [userId, setUserId] = useState("__all__")
    const [categoryId, setCategoryId] = useState("__all__")
    const [billable, setBillable] = useState<"all" | "billable" | "nonbillable">("all")

    const [data, setData] = useState<{ entries: ExpenseReportEntry[]; totalCents: number; billableCents: number; nonBillableCents: number } | null>(null)
    const [pending, startTransition] = useTransition()

    const runReport = useCallback(() => {
        const filters: ExpenseReportFilters = {
            from,
            to,
            projectId: projectId === "__all__" ? "" : projectId,
            userId: userId === "__all__" ? "" : userId,
            categoryId: categoryId === "__all__" ? "" : categoryId,
            billable,
        }
        startTransition(async () => {
            const result = await getExpenseReport(filters)
            setData(result)
        })
    }, [from, to, projectId, userId, categoryId, billable])

    const chartData = data ? buildChartData(data.entries) : []

    return (
        <div className="flex-1 space-y-6 pt-6 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Expense Report</h2>
                    <p className="text-muted-foreground mt-1">Analyse and export expense data.</p>
                </div>
                {data && data.entries.length > 0 && (
                    <Button variant="outline" onClick={() => exportCSV(data.entries)}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="rounded-md border border-sidebar-border bg-sidebar/30 p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Date range */}
                    <div className="space-y-2">
                        <Label htmlFor="from">From</Label>
                        <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="to">To</Label>
                        <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>

                    {/* Project */}
                    <div className="space-y-2">
                        <Label>Project</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All projects</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Member */}
                    <div className="space-y-2">
                        <Label>Member</Label>
                        <Select value={userId} onValueChange={setUserId}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All members</SelectItem>
                                {members.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All categories</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Billable */}
                    <div className="space-y-2">
                        <Label>Billable</Label>
                        <Select value={billable} onValueChange={(v) => setBillable(v as typeof billable)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="billable">Billable only</SelectItem>
                                <SelectItem value="nonbillable">Non-billable only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button onClick={runReport} disabled={pending}>
                    {pending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Run Report
                </Button>
            </div>

            {/* Results */}
            {data && (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="rounded-lg border border-border/50 bg-card p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Expenses</p>
                            <p className="text-lg font-semibold tracking-tight text-foreground">{fmt(data.totalCents)}</p>
                            <p className="text-xs text-muted-foreground">{data.entries.length} entries</p>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-card p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Billable</p>
                            <p className="text-lg font-semibold tracking-tight text-foreground">{fmt(data.billableCents)}</p>
                            <p className="text-xs text-muted-foreground">
                                {data.totalCents > 0 ? Math.round((data.billableCents / data.totalCents) * 100) : 0}% of total
                            </p>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-card p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Non-billable</p>
                            <p className="text-lg font-semibold tracking-tight text-foreground">{fmt(data.nonBillableCents)}</p>
                            <p className="text-xs text-muted-foreground">
                                {data.totalCents > 0 ? Math.round((data.nonBillableCents / data.totalCents) * 100) : 0}% of total
                            </p>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-card p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Entries</p>
                            <p className="text-lg font-semibold tracking-tight text-foreground">{data.entries.length}</p>
                            <p className="text-xs text-muted-foreground">in selected period</p>
                        </div>
                    </div>

                    {/* Chart */}
                    {chartData.length > 0 && (
                        <div className="rounded-md border border-sidebar-border bg-sidebar/30 p-5">
                            <h3 className="text-sm font-semibold mb-4">Expenses by Day</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis
                                        tickFormatter={(v) => "$" + v.toLocaleString()}
                                        tick={{ fontSize: 11 }}
                                        width={70}
                                    />
                                    <Tooltip formatter={(value: number) => "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2 })} />
                                    <Legend />
                                    <Bar dataKey="Billable" fill="#22c55e" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="Non-billable" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Table */}
                    {data.entries.length === 0 ? (
                        <div className="rounded-md border border-sidebar-border bg-sidebar/30 p-12 flex flex-col items-center justify-center text-center">
                            <Receipt className="w-10 h-10 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No expenses found for the selected filters.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border border-sidebar-border bg-sidebar/30 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-sidebar-border hover:bg-transparent">
                                        <TableHead>Date</TableHead>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-center">Billable</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.entries.map((e) => (
                                        <TableRow key={e.id} className="border-sidebar-border hover:bg-sidebar/50">
                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                {format(new Date(e.date + "T12:00:00"), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-sm">{e.userName}</TableCell>
                                            <TableCell className="text-sm font-medium">{e.projectName}</TableCell>
                                            <TableCell>
                                                {e.categoryName ? (
                                                    <Badge variant="secondary" className="text-xs">{e.categoryName}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm max-w-[200px] truncate">
                                                {e.description}
                                                {e.notes && (
                                                    <span className="text-muted-foreground ml-1 text-xs">— {e.notes}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {e.isBillable ? (
                                                    <Badge variant="outline" className="text-xs border-green-500/40 text-green-600 dark:text-green-400">
                                                        Billable
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs text-muted-foreground">
                                                        Non-billable
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold tabular-nums">
                                                {fmt(e.amountCents)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
