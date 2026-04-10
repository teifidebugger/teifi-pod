"use client"

import { useTimelineContext } from "dnd-timeline"
import { addDays, format } from "date-fns"
import type { Allocation, Holiday } from "./schedule-types"
import { SIDEBAR_WIDTH, DAY_MS } from "./schedule-types"
import type { ScheduleRow } from "./page"

type CapacitySummaryRowProps = {
    rows: ScheduleRow[]
    allocationsByRow: Record<string, Allocation[]>
    dates: string[]
    holidays: Holiday[]
    memberTimeOff: Record<string, string[]>
    mode: "day" | "week" | "month"
}

export function CapacitySummaryRow({ rows, allocationsByRow, dates, holidays, memberTimeOff, mode }: CapacitySummaryRowProps) {
    const { range, valueToPixels } = useTimelineContext()
    const holidaySet = new Set(holidays.map((h) => h.date))

    function computePeriodStats(periodDates: string[]) {
        let totalCapacity = 0
        let totalAllocated = 0
        for (const dateStr of periodDates) {
            const dow = new Date(dateStr + "T00:00:00").getDay()
            const isWeekend = dow === 0 || dow === 6
            const isHoliday = holidaySet.has(dateStr)
            if (isWeekend || isHoliday) continue
            for (const row of rows) {
                const dailyCap = row.weeklyCapacityHours / 5
                const isRowTimeOff = row.kind === "member" && (memberTimeOff[row.id] ?? []).includes(dateStr)
                if (!isRowTimeOff) totalCapacity += dailyCap
                const rowAllocs = allocationsByRow[row.id] ?? []
                for (const alloc of rowAllocs) {
                    if (dateStr >= alloc.startDate && dateStr <= alloc.endDate && !isRowTimeOff) {
                        totalAllocated += alloc.hoursPerDay
                    }
                }
            }
        }
        return { totalCapacity, totalAllocated }
    }

    const dailyStats = dates.map((dateStr) => {
        const dow = new Date(dateStr + "T00:00:00").getDay()
        const isWeekend = dow === 0 || dow === 6
        const isHoliday = holidaySet.has(dateStr)
        const { totalCapacity, totalAllocated } = computePeriodStats([dateStr])
        return { dateStr, totalCapacity, totalAllocated, isWeekend, isHoliday }
    })

    // Week mode: find Mondays in visible range and aggregate per week
    const mondays = (mode === "week" || mode === "month") ? dates.filter((d) => {
        const ms = new Date(d + "T00:00:00").getTime()
        return new Date(d + "T00:00:00").getDay() === 1 && ms >= range.start && ms < range.end
    }) : []

    // Month mode: first day of each calendar month in dates
    const monthStarts = mode === "month" ? (() => {
        const seen = new Set<string>()
        const result: string[] = []
        for (const d of dates) {
            const key = d.substring(0, 7)
            if (!seen.has(key)) { seen.add(key); result.push(d.substring(0, 8) + "01") }
        }
        return result
    })() : []

    function renderPill(totalAllocated: number, totalCapacity: number, key: string, left: number, width: number) {
        const ratio = totalCapacity > 0 ? totalAllocated / totalCapacity : 0
        let pillClass: string, topLine: string, bottomLine: string
        if (ratio > 1) {
            pillClass = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
            topLine = (totalAllocated - totalCapacity).toFixed(1)
            bottomLine = "over"
        } else if (ratio >= 1) {
            pillClass = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
            topLine = "Full"
            bottomLine = ""
        } else {
            pillClass = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            topLine = (totalCapacity - totalAllocated).toFixed(1)
            bottomLine = "open"
        }
        return (
            <div key={key} className="absolute top-0 bottom-0 flex items-center justify-center border-r border-sidebar-border/10"
                style={{ left: left + "px", width: width + "px" }}>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${pillClass} leading-tight text-center`}>
                    <span className="block">{topLine}</span>
                    {bottomLine && <span className="block">{bottomLine}</span>}
                </span>
            </div>
        )
    }

    return (
        <div className="flex bg-muted/20">
            <div className="flex-shrink-0 px-4 py-2 border-r border-sidebar-border flex items-center" style={{ width: SIDEBAR_WIDTH }}>
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Capacity</span>
            </div>
            <div className="flex-1 relative h-12 overflow-hidden">
                {mode === "month" ? (
                    monthStarts.map((monthStart) => {
                        const d = new Date(monthStart + "T00:00:00")
                        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
                        const startMs = Math.max(d.getTime(), range.start)
                        const endMs = Math.min(nextMonth.getTime(), range.end)
                        if (startMs >= endMs) return null
                        const left = valueToPixels(startMs - range.start)
                        const width = valueToPixels(endMs - startMs)
                        const monthEnd = format(new Date(nextMonth.getTime() - DAY_MS), "yyyy-MM-dd")
                        const monthDates = dates.filter((dd) => dd >= monthStart && dd <= monthEnd)
                        const { totalCapacity, totalAllocated } = computePeriodStats(monthDates)
                        if (totalCapacity === 0 && totalAllocated === 0) return (
                            <div key={monthStart} className="absolute top-0 bottom-0 border-r border-sidebar-border/10" style={{ left: left + "px", width: width + "px" }} />
                        )
                        return renderPill(totalAllocated, totalCapacity, monthStart, left, width)
                    })
                ) : mode === "week" ? (
                    mondays.map((monday) => {
                        const d = new Date(monday + "T00:00:00")
                        const left = valueToPixels(d.getTime() - range.start)
                        const width = valueToPixels(7 * DAY_MS)
                        const weekEnd = format(addDays(d, 6), "yyyy-MM-dd")
                        const weekDates = dates.filter((dd) => dd >= monday && dd <= weekEnd)
                        const { totalCapacity, totalAllocated } = computePeriodStats(weekDates)
                        if (totalCapacity === 0 && totalAllocated === 0) return (
                            <div key={monday} className="absolute top-0 bottom-0 border-r border-sidebar-border/10" style={{ left: left + "px", width: width + "px" }} />
                        )
                        return renderPill(totalAllocated, totalCapacity, monday, left, width)
                    })
                ) : (
                    dailyStats.map((stat) => {
                        const d = new Date(stat.dateStr + "T00:00:00")
                        const left = valueToPixels(d.getTime() - range.start)
                        const width = valueToPixels(DAY_MS)
                        if (stat.isWeekend || stat.isHoliday) return (
                            <div key={stat.dateStr} className="absolute top-0 bottom-0 border-r border-sidebar-border/10 bg-muted/10" style={{ left: left + "px", width: width + "px" }} />
                        )
                        return renderPill(stat.totalAllocated, stat.totalCapacity, stat.dateStr, left, width)
                    })
                )}
            </div>
        </div>
    )
}
