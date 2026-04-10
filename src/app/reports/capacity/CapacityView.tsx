"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MemberCapacityRow, WeekRange } from "./page"

interface Props {
    rows: MemberCapacityRow[]
    weeks: WeekRange[]
    weekCount: number
}

function roleColor(role: string): "default" | "secondary" | "outline" | "destructive" {
    switch (role) {
        case "OWNER": return "destructive"
        case "ADMIN": return "default"
        case "MANAGER": return "secondary"
        default: return "outline"
    }
}

function cellBg(allocationPct: number, trackedHours: number, allocatedHours: number): string {
    if (allocatedHours === 0 && trackedHours === 0) return ""
    if (allocationPct >= 100) return "bg-red-500/20 text-red-700 dark:text-red-400"
    if (allocationPct >= 80) return "bg-amber-500/20 text-amber-700 dark:text-amber-400"
    if (allocationPct > 0) return "bg-green-500/20 text-green-700 dark:text-green-400"
    // tracked but no allocation
    return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
}

function fmt(hours: number): string {
    return hours.toFixed(1) + "h"
}

function initials(name: string): string {
    return name
        .split(" ")
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

export function CapacityView({ rows, weeks, weekCount }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()

    function onWeekCountChange(val: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set("weeks", val)
        router.push(`?${params.toString()}`)
    }

    // Summary per week: total allocated, total tracked, avg utilization
    const weekSummaries = weeks.map(w => {
        const weekRows = rows.map(r => r.weeks.find(wd => wd.weekLabel === w.label)!)
        const totalAllocated = weekRows.reduce((s, wd) => s + (wd?.allocatedHours ?? 0), 0)
        const totalTracked = weekRows.reduce((s, wd) => s + (wd?.trackedHours ?? 0), 0)
        const totalCapacity = weekRows.reduce((s, wd) => s + (wd?.capacityHours ?? 40), 0)
        const avgUtil = totalCapacity > 0 ? (totalTracked / totalCapacity) * 100 : 0
        return { totalAllocated, totalTracked, avgUtil }
    })

    return (
        <div className="space-y-4">
            {/* Period selector */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Select value={String(weekCount)} onValueChange={onWeekCountChange}>
                    <SelectTrigger className="h-8 w-40 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="4">Last 4 weeks</SelectItem>
                        <SelectItem value="8">Last 8 weeks</SelectItem>
                        <SelectItem value="12">Last 12 weeks</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="font-medium">Legend:</span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-green-500/30" />
                    Allocated (&lt;80%)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-amber-500/30" />
                    Near capacity (80–99%)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-red-500/30" />
                    Overbooked (≥100%)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-blue-500/15" />
                    Tracked only
                </span>
            </div>

            {/* Heatmap table */}
            <Card className="border-sidebar-border overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Allocation Heatmap</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-sidebar-border hover:bg-transparent">
                                <TableHead className="w-56 min-w-[14rem] sticky left-0 bg-background z-10">
                                    Member
                                </TableHead>
                                <TableHead className="w-20 text-center text-xs text-muted-foreground">
                                    Capacity
                                </TableHead>
                                {weeks.map(w => (
                                    <TableHead
                                        key={w.startDate}
                                        className="text-center text-xs min-w-[80px] whitespace-nowrap"
                                    >
                                        {w.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map(row => (
                                <TableRow key={row.memberId} className="border-sidebar-border/50">
                                    {/* Member name cell */}
                                    <TableCell className="sticky left-0 bg-background z-10">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                                {row.image ? (
                                                    <Image
                                                        src={row.image}
                                                        alt={row.name}
                                                        width={32}
                                                        height={32}
                                                        className="h-8 w-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    initials(row.name)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium leading-none">
                                                    {row.name}
                                                </p>
                                                <div className="mt-1">
                                                    <Badge
                                                        variant={roleColor(row.role)}
                                                        className="text-[10px] px-1 py-0 h-4"
                                                    >
                                                        {row.role}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Weekly capacity */}
                                    <TableCell className="text-center text-xs text-muted-foreground tabular-nums">
                                        {row.weeklyCapacityHours}h/wk
                                    </TableCell>

                                    {/* Per-week cells */}
                                    {row.weeks.map(wd => {
                                        const bg = cellBg(wd.allocationPct, wd.trackedHours, wd.allocatedHours)
                                        return (
                                            <TableCell key={wd.weekLabel} className="text-center p-1">
                                                {(wd.allocatedHours > 0 || wd.trackedHours > 0) ? (
                                                    <div
                                                        className={`rounded-md px-1 py-1 ${bg}`}
                                                        title={`Allocated: ${fmt(wd.allocatedHours)} (${Math.round(wd.allocationPct)}%) | Tracked: ${fmt(wd.trackedHours)} (${Math.round(wd.utilizationPct)}%) | Capacity: ${fmt(wd.capacityHours)}`}
                                                    >
                                                        <div className="text-xs font-semibold tabular-nums leading-tight">
                                                            {fmt(wd.allocatedHours)}
                                                        </div>
                                                        <div className="text-[10px] opacity-70 tabular-nums leading-tight">
                                                            {fmt(wd.trackedHours)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-muted-foreground/30 text-xs">—</div>
                                                )}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}

                            {/* Summary row */}
                            {rows.length > 0 && (
                                <TableRow className="border-t-2 border-sidebar-border bg-muted/30 font-semibold">
                                    <TableCell className="sticky left-0 bg-muted/30 z-10 text-sm">
                                        Totals
                                    </TableCell>
                                    <TableCell />
                                    {weekSummaries.map((ws, i) => (
                                        <TableCell key={i} className="text-center p-1">
                                            <div className="rounded-md px-1 py-1">
                                                <div className="text-xs font-semibold tabular-nums leading-tight">
                                                    {fmt(ws.totalAllocated)}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground tabular-nums leading-tight">
                                                    {fmt(ws.totalTracked)}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground tabular-nums leading-tight">
                                                    {Math.round(ws.avgUtil)}% util
                                                </div>
                                            </div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {rows.length === 0 && (
                        <div className="p-12 text-center text-sm text-muted-foreground">
                            No team members found.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Key */}
            <p className="text-xs text-muted-foreground">
                Each cell shows <strong>allocated hours</strong> (top) and <strong>tracked hours</strong> (bottom) for the week.
                Colors reflect allocation vs capacity ratio.
            </p>
        </div>
    )
}
