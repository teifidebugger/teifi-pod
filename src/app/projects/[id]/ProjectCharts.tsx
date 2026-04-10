"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea,
    ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts"
import { format, startOfWeek, endOfWeek, addDays, addWeeks, parseISO, getISOWeek, eachDayOfInterval, getDay } from "date-fns"

export interface ChartEntry {
    date: string
    durationSeconds: number
    isBillable: boolean
    billableRateCents: number
}

export interface ChartAllocation {
    startDate: string
    endDate: string
    hoursPerDay: number
}

interface Props {
    entries: ChartEntry[]
    allocations: ChartAllocation[]
    budgetCents: number | null
    budgetHours: number | null
    canSeeBudget: boolean
}

const WINDOW = 16

function buildWeeks(entries: ChartEntry[], allocations: ChartAllocation[]) {
    const allDates = [
        ...entries.map(e => e.date),
        ...allocations.flatMap(a => [a.startDate, a.endDate]),
    ]
    if (allDates.length === 0) return []

    const todayStr = format(new Date(), "yyyy-MM-dd")
    const minDate = allDates.reduce((a, b) => (a < b ? a : b))
    const maxDate = [allDates.reduce((a, b) => (a > b ? a : b)), todayStr].reduce((a, b) =>
        a > b ? a : b,
    )

    const firstWeek = startOfWeek(parseISO(minDate), { weekStartsOn: 1 })
    const lastWeek = startOfWeek(parseISO(maxDate), { weekStartsOn: 1 })

    type Week = {
        weekStart: Date
        weekStartStr: string
        weekEndStr: string
        label: string
        isoWeek: number
        actualHours: number
        forecastHours: number
        billableCents: number
    }

    const weeks: Week[] = []
    let w = firstWeek
    while (w <= lastWeek) {
        const wStr = format(w, "yyyy-MM-dd")
        const wEnd = format(addDays(w, 6), "yyyy-MM-dd")

        const weekEntries = entries.filter(e => e.date >= wStr && e.date <= wEnd)
        const actualHours = weekEntries.reduce((s, e) => s + e.durationSeconds / 3600, 0)
        const billableCents = weekEntries
            .filter(e => e.isBillable)
            .reduce((s, e) => s + (e.durationSeconds / 3600) * e.billableRateCents, 0)

        let forecastHours = 0
        for (const alloc of allocations) {
            const overlapStart = alloc.startDate > wStr ? alloc.startDate : wStr
            const overlapEnd = alloc.endDate < wEnd ? alloc.endDate : wEnd
            if (overlapStart <= overlapEnd) {
                const workdays = eachDayOfInterval({ start: new Date(overlapStart), end: new Date(overlapEnd) })
                    .filter(d => { const dow = getDay(d); return dow !== 0 && dow !== 6 }).length
                forecastHours += workdays * alloc.hoursPerDay
            }
        }

        weeks.push({
            weekStart: w,
            weekStartStr: wStr,
            weekEndStr: wEnd,
            label: format(w, "MMM d"),
            isoWeek: getISOWeek(w),
            actualHours,
            forecastHours,
            billableCents,
        })
        w = addWeeks(w, 1)
    }
    return weeks
}

export function ProjectCharts({ entries, allocations, budgetCents, budgetHours, canSeeBudget }: Props) {
    const [tab, setTab] = useState<"progress" | "weekly">("progress")
    const [weekOffset, setWeekOffset] = useState(0)

    if (entries.length === 0) return null

    const allWeeks = buildWeeks(entries, allocations)
    const todayWeekStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
    const centerIdx = allWeeks.findIndex(w => w.weekStartStr === todayWeekStr)
    const baseIdx = centerIdx >= 0 ? centerIdx : Math.max(0, allWeeks.length - 1)
    const windowStart = Math.max(
        0,
        Math.min(
            baseIdx - Math.floor(WINDOW / 2) + weekOffset,
            Math.max(0, allWeeks.length - WINDOW),
        ),
    )
    const canPrev = windowStart > 0
    const canNext = windowStart + WINDOW < allWeeks.length

    const visibleWeeks = allWeeks.slice(windowStart, windowStart + WINDOW)

    // ── Progress: cumulative by week ──────────────────────────────────────────
    let cumulativeProgress = 0
    // Accumulate up to window start
    for (let i = 0; i < windowStart; i++) cumulativeProgress += allWeeks[i].billableCents

    const progressData = visibleWeeks.map(w => {
        cumulativeProgress += w.billableCents
        return {
            label: w.label,
            weekEndStr: w.weekEndStr,
            isoWeek: w.isoWeek,
            isCurrentWeek: w.weekStartStr === todayWeekStr,
            cumulative: cumulativeProgress,
        }
    })

    // ── Weekly hours ──────────────────────────────────────────────────────────
    const weeklyData = visibleWeeks.map(w => ({
        label: w.label,
        isCurrentWeek: w.weekStartStr === todayWeekStr,
        actual: parseFloat(w.actualHours.toFixed(2)),
        forecast: parseFloat(w.forecastHours.toFixed(2)),
    }))

    const currentWeekLabel = visibleWeeks.find(w => w.weekStartStr === todayWeekStr)?.label

    return (
        <Card className="border-sidebar-border">
            <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-1">
                        <Button
                            variant={tab === "progress" ? "default" : "outline"}
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => setTab("progress")}
                        >
                            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <polyline points="1,12 5,8 9,10 15,3" />
                            </svg>
                            Project progress
                        </Button>
                        <Button
                            variant={tab === "weekly" ? "default" : "outline"}
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => setTab("weekly")}
                        >
                            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 16 16" fill="currentColor">
                                <rect x="1" y="8" width="3" height="7" />
                                <rect x="6" y="5" width="3" height="10" />
                                <rect x="11" y="2" width="3" height="13" />
                            </svg>
                            Hours per week
                        </Button>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(o => o - 1)} disabled={!canPrev}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-8 px-3" onClick={() => setWeekOffset(0)}>
                            This week
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(o => o + 1)} disabled={!canNext}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-2 pb-4">
                {tab === "progress" && (
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={progressData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "rgba(128,128,128,0.2)" }} tickLine={false} />
                            <YAxis
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={v =>
                                    `$${(v / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                                }
                                width={72}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null
                                    const d = payload[0].payload
                                    const spent = d.cumulative
                                    const remaining = budgetCents !== null ? budgetCents - spent : null
                                    return (
                                        <div className="rounded-md border border-border bg-background px-4 py-3 text-sm shadow-md min-w-[220px]">
                                            <p className="font-semibold mb-2">
                                                Cumulative up to {d.weekEndStr} (Week {d.isoWeek})
                                            </p>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                                                <span className="text-muted-foreground">Budget spent</span>
                                                <span className="text-muted-foreground">Budget remaining</span>
                                                <span className="font-medium tabular-nums">
                                                    ${(spent / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="font-medium tabular-nums">
                                                    {remaining !== null
                                                        ? `$${(remaining / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                        : "—"}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }}
                            />
                            {canSeeBudget && budgetCents !== null && (
                                <ReferenceLine
                                    y={budgetCents}
                                    stroke="#f59e0b"
                                    strokeDasharray="4 4"
                                    strokeWidth={1.5}
                                    label={{
                                        value: `Budget: $${(budgetCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
                                        position: "insideTopLeft",
                                        fontSize: 11,
                                        fill: "#f59e0b",
                                    }}
                                />
                            )}
                            {currentWeekLabel && (
                                <ReferenceArea
                                    x1={currentWeekLabel}
                                    x2={currentWeekLabel}
                                    fill="rgba(59,130,246,0.1)"
                                    stroke="rgba(59,130,246,0.4)"
                                    strokeWidth={1}
                                    label={{ value: "This week", position: "insideTop", fontSize: 10, fill: "#60a5fa" }}
                                />
                            )}
                            <Line
                                type="monotone"
                                dataKey="cumulative"
                                stroke="#60a5fa"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: "#60a5fa", stroke: "#60a5fa", strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: "#3b82f6" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}

                {tab === "weekly" && (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={weeklyData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "rgba(128,128,128,0.2)" }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="h" width={40} />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (!active || !payload?.length) return null
                                    return (
                                        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-md">
                                            <p className="font-semibold mb-1">{label}</p>
                                            {payload.map(p => (
                                                <p key={String(p.dataKey)} className="text-muted-foreground">
                                                    {p.name}:{" "}
                                                    <span className="text-foreground font-medium">
                                                        {(p.value as number).toFixed(2)}h
                                                    </span>
                                                </p>
                                            ))}
                                        </div>
                                    )
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                            {currentWeekLabel && (
                                <ReferenceArea
                                    x1={currentWeekLabel}
                                    x2={currentWeekLabel}
                                    fill="rgba(59,130,246,0.1)"
                                    stroke="rgba(59,130,246,0.4)"
                                    strokeWidth={1}
                                />
                            )}
                            <Bar dataKey="actual" name="Actual" fill="#60a5fa" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="forecast" name="Forecast" fill="rgba(156,163,175,0.3)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
