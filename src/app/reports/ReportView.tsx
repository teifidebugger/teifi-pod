"use client"

import { useState, useTransition } from "react"
import { getReportData, type ReportFilters, type ReportData, type GroupBy } from "@/app/actions/reports"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Loader2, Download, BarChart2 } from "lucide-react"

interface Props {
    projects: { id: string; name: string }[]
    clients:  { id: string; name: string }[]
    members:  { id: string; name: string }[]
    defaultFrom: string
    defaultTo: string
    canSeeRates: boolean
}

function fmtHours(seconds: number) {
    const h = seconds / 3600
    return h.toFixed(1) + "h"
}

function fmtMoney(cents: number) {
    return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function exportCsv(data: ReportData, groupBy: GroupBy, canSeeRates: boolean) {
    const headers = ["Group", "Total Hours", "Billable Hours", ...(canSeeRates ? ["Billable Amount"] : []), "Entries"]
    const rows = [
        headers,
        ...data.rows.map(r => [
            r.displayLabel,
            (r.totalSeconds / 3600).toFixed(2),
            (r.billableSeconds / 3600).toFixed(2),
            ...(canSeeRates ? [(r.billableAmountCents / 100).toFixed(2)] : []),
            r.entries.toString(),
        ]),
        ["TOTAL", (data.totalSeconds / 3600).toFixed(2), (data.billableSeconds / 3600).toFixed(2), ...(canSeeRates ? [(data.billableAmountCents / 100).toFixed(2)] : []), data.entryCount.toString()],
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `time-report-${groupBy}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

export function ReportView({ projects, clients, members, defaultFrom, defaultTo, canSeeRates }: Props) {
    const [from, setFrom] = useState(defaultFrom)
    const [to, setTo] = useState(defaultTo)
    const [projectId, setProjectId] = useState("__all__")
    const [clientId, setClientId] = useState("__all__")
    const [userId, setUserId] = useState("__all__")
    const [billable, setBillable] = useState<ReportFilters["billable"]>("all")
    const [approvalStatus, setApprovalStatus] = useState<ReportFilters["approvalStatus"]>("all")
    const [groupBy, setGroupBy] = useState<GroupBy>("day")
    const [data, setData] = useState<ReportData | null>(null)
    const [pending, startTransition] = useTransition()

    function runReport() {
        startTransition(async () => {
            const result = await getReportData({
            from, to,
            projectId: projectId === "__all__" ? "" : projectId,
            clientId:  clientId  === "__all__" ? "" : clientId,
            userId:    userId    === "__all__" ? "" : userId,
            billable, approvalStatus, groupBy,
        })
            setData(result)
        })
    }

    const chartData = data?.rows.map(r => ({
        name: r.displayLabel.length > 14 ? r.displayLabel.slice(0, 13) + "…" : r.displayLabel,
        fullName: r.displayLabel,
        hours: parseFloat((r.totalSeconds / 3600).toFixed(2)),
        billable: parseFloat((r.billableSeconds / 3600).toFixed(2)),
    })) ?? []

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="border-sidebar-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
                        <div className="space-y-1.5">
                            <Label className="text-xs">From</Label>
                            <input
                                type="date"
                                value={from}
                                onChange={e => setFrom(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">To</Label>
                            <input
                                type="date"
                                value={to}
                                onChange={e => setTo(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Project</Label>
                            <Select value={projectId} onValueChange={setProjectId}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="All projects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All projects</SelectItem>
                                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Client</Label>
                            <Select value={clientId} onValueChange={setClientId}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="All clients" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All clients</SelectItem>
                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Member</Label>
                            <Select value={userId} onValueChange={setUserId}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="All members" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All members</SelectItem>
                                    {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Billable</Label>
                            <Select value={billable} onValueChange={v => setBillable(v as ReportFilters["billable"])}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="billable">Billable only</SelectItem>
                                    <SelectItem value="non-billable">Non-billable only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Approval</Label>
                            <Select value={approvalStatus} onValueChange={v => setApprovalStatus(v as ReportFilters["approvalStatus"])}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Group by</Label>
                            <Tabs value={groupBy} onValueChange={v => setGroupBy(v as GroupBy)}>
                                <TabsList className="h-9">
                                    <TabsTrigger value="day" className="text-xs px-3">Day</TabsTrigger>
                                    <TabsTrigger value="week" className="text-xs px-3">Week</TabsTrigger>
                                    <TabsTrigger value="month" className="text-xs px-3">Month</TabsTrigger>
                                    <TabsTrigger value="project" className="text-xs px-3">Project</TabsTrigger>
                                    <TabsTrigger value="client" className="text-xs px-3">Client</TabsTrigger>
                                    <TabsTrigger value="member" className="text-xs px-3">Member</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <Button onClick={runReport} disabled={pending} className="shrink-0 self-end">
                            {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart2 className="w-4 h-4 mr-2" />}
                            Run Report
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {!data && !pending && (
                <div className="rounded-lg border border-dashed border-sidebar-border bg-sidebar/20 p-12 text-center text-sm text-muted-foreground">
                    Set your filters and click <strong>Run Report</strong> to see results.
                </div>
            )}

            {pending && (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Generating report…</span>
                </div>
            )}

            {data && !pending && (
                <div className="space-y-4">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg border border-border/50 bg-card p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Hours</p>
                            <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums">{fmtHours(data.totalSeconds)}</p>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-card p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Billable Hours</p>
                            <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums">{fmtHours(data.billableSeconds)}</p>
                        </div>
                        {canSeeRates && (
                            <div className="rounded-lg border border-border/50 bg-card p-4">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Billable Amount</p>
                                <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums">{fmtMoney(data.billableAmountCents)}</p>
                            </div>
                        )}
                        <div className="rounded-lg border border-border/50 bg-card p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Entries</p>
                            <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums">{data.entryCount}</p>
                        </div>
                    </div>

                    {data.rows.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-sidebar-border bg-sidebar/20 p-12 text-center text-sm text-muted-foreground">
                            No time entries match the selected filters.
                        </div>
                    ) : (
                        <>
                            {/* Bar chart */}
                            <Card className="border-sidebar-border">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Hours by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                            <YAxis tick={{ fontSize: 11 }} unit="h" className="text-muted-foreground" />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null
                                                    const d = payload[0].payload
                                                    return (
                                                        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm">
                                                            <p className="font-medium mb-1">{d.fullName}</p>
                                                            <p className="text-muted-foreground">Total: <span className="text-foreground font-medium">{d.hours}h</span></p>
                                                            <p className="text-muted-foreground">Billable: <span className="text-foreground font-medium">{d.billable}h</span></p>
                                                        </div>
                                                    )
                                                }}
                                            />
                                            <Bar dataKey="hours" name="Total" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                                            <Bar dataKey="billable" name="Billable" fill="hsl(var(--primary) / 0.4)" radius={[3, 3, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Table */}
                            <Card className="border-sidebar-border">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Breakdown</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => exportCsv(data, groupBy, canSeeRates)}>
                                        <Download className="w-3.5 h-3.5 mr-1.5" />
                                        Export CSV
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-sidebar-border hover:bg-transparent">
                                                <TableHead>Group</TableHead>
                                                <TableHead className="text-right tabular-nums">Total Hours</TableHead>
                                                <TableHead className="text-right tabular-nums">Billable Hours</TableHead>
                                                <TableHead className="text-right tabular-nums">Billable %</TableHead>
                                                {canSeeRates && <TableHead className="text-right tabular-nums">Amount</TableHead>}
                                                <TableHead className="text-right tabular-nums">Entries</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.rows.map(row => (
                                                <TableRow key={row.label} className="border-sidebar-border/50">
                                                    <TableCell className="font-medium">{row.displayLabel}</TableCell>
                                                    <TableCell className="text-right tabular-nums">{fmtHours(row.totalSeconds)}</TableCell>
                                                    <TableCell className="text-right tabular-nums">{fmtHours(row.billableSeconds)}</TableCell>
                                                    <TableCell className="text-right tabular-nums text-muted-foreground">
                                                        {row.totalSeconds > 0 ? Math.round((row.billableSeconds / row.totalSeconds) * 100) + "%" : "—"}
                                                    </TableCell>
                                                    {canSeeRates && <TableCell className="text-right tabular-nums">{fmtMoney(row.billableAmountCents)}</TableCell>}
                                                    <TableCell className="text-right tabular-nums text-muted-foreground">{row.entries}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <Separator className="bg-sidebar-border" />
                                    <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
                                        <span>Total</span>
                                        <div className="flex gap-12 tabular-nums">
                                            <span>{fmtHours(data.totalSeconds)}</span>
                                            <span>{fmtHours(data.billableSeconds)}</span>
                                            <span className="text-muted-foreground w-12 text-right">
                                                {data.totalSeconds > 0 ? Math.round((data.billableSeconds / data.totalSeconds) * 100) + "%" : "—"}
                                            </span>
                                            {canSeeRates && <span>{fmtMoney(data.billableAmountCents)}</span>}
                                            <span>{data.entryCount}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
