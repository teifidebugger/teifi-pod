"use client"

import React from "react"
import { addDays, format } from "date-fns"
import { useTimelineContext, type Range } from "dnd-timeline"
import { SIDEBAR_WIDTH, DAY_MS, buildDates } from "./GanttTypes"

type GanttHeaderProps = {
    mode: "day" | "week" | "month"
    today: string
    holidays?: { date: string; name: string }[]
    range: Range
}

export function GanttHeader({
    mode, today, holidays = [], range,
}: GanttHeaderProps) {
    const { valueToPixels } = useTimelineContext()
    const todayMs = new Date(today + "T00:00:00").getTime()
    const todayInRange = todayMs >= range.start && todayMs < range.end
    const holidaySet = new Set(holidays.map((h) => h.date))
    const dates = buildDates(range)

    if (mode === "month") {
        const months: string[] = []
        const seen = new Set<string>()
        for (const d of dates) {
            const key = d.substring(0, 7)
            if (!seen.has(key)) { seen.add(key); months.push(d.substring(0, 8) + "01") }
        }
        return (
            <div className="flex border-b border-sidebar-border bg-sidebar sticky top-[102px] z-20">
                <div className="flex-shrink-0 px-4 py-3 border-r border-sidebar-border flex items-center" style={{ width: SIDEBAR_WIDTH }}>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Project / Client</span>
                </div>
                <div className="flex-1 relative h-12 overflow-hidden">
                    {months.map((monthStart) => {
                        const d = new Date(monthStart + "T00:00:00")
                        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
                        const startMs = Math.max(d.getTime(), range.start)
                        const endMs = Math.min(nextMonth.getTime(), range.end)
                        if (startMs >= endMs) return null
                        const left = valueToPixels(startMs - range.start)
                        const width = valueToPixels(endMs - startMs)
                        const isCurrentMonth = today.startsWith(monthStart.substring(0, 7))
                        return (
                            <div key={monthStart}
                                className={`absolute top-0 bottom-0 flex flex-col items-center justify-center border-r border-sidebar-border/20 overflow-hidden ${isCurrentMonth ? "bg-primary/5" : ""}`}
                                style={{ left: left + "px", width: width + "px" }}
                            >
                                <span className={`text-xs font-semibold leading-none ${isCurrentMonth ? "text-primary" : "text-foreground"}`}>
                                    {format(d, "MMM yyyy")}
                                </span>
                            </div>
                        )
                    })}
                    {todayInRange && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
                            style={{ left: valueToPixels(todayMs - range.start) + "px" }} />
                    )}
                </div>
            </div>
        )
    }

    if (mode === "week") {
        const mondays = dates.filter((d) => {
            const ms = new Date(d + "T00:00:00").getTime()
            return new Date(d + "T00:00:00").getDay() === 1 && ms >= range.start && ms < range.end
        })
        return (
            <div className="flex border-b border-sidebar-border bg-sidebar sticky top-[102px] z-20">
                <div className="flex-shrink-0 px-4 py-3 border-r border-sidebar-border flex items-center" style={{ width: SIDEBAR_WIDTH }}>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Project / Client</span>
                </div>
                <div className="flex-1 relative overflow-hidden" style={{ height: "56px" }}>
                    {mondays.map((monday) => {
                        const d = new Date(monday + "T00:00:00")
                        const left = valueToPixels(d.getTime() - range.start)
                        const width = valueToPixels(7 * DAY_MS)
                        const weekEndDate = format(addDays(d, 6), "yyyy-MM-dd")
                        const isCurrentWeek = monday <= today && today <= weekEndDate
                        const days = Array.from({ length: 7 }, (_, i) => addDays(d, i))
                        return (
                            <div key={monday}
                                className={`absolute top-0 bottom-0 border-r border-sidebar-border/20 overflow-hidden ${isCurrentWeek ? "bg-primary/5" : ""}`}
                                style={{ left: left + "px", width: width + "px" }}
                            >
                                {/* Top: week range label */}
                                <div className="flex items-center justify-center border-b border-sidebar-border/20" style={{ height: "22px" }}>
                                    <span className={`text-[10px] font-semibold leading-none ${isCurrentWeek ? "text-primary" : "text-muted-foreground"}`}>
                                        {format(d, "MMM d")} – {format(addDays(d, 6), "MMM d")}
                                    </span>
                                </div>
                                {/* Bottom: individual day numbers */}
                                <div className="flex" style={{ height: "34px" }}>
                                    {days.map((day, i) => {
                                        const dateStr = format(day, "yyyy-MM-dd")
                                        const isToday = dateStr === today
                                        const dow = day.getDay()
                                        const isWeekend = dow === 0 || dow === 6
                                        return (
                                            <div key={i} className={`flex-1 flex items-center justify-center ${isWeekend ? "opacity-40" : ""}`}>
                                                <span className={`text-xs font-medium leading-none ${isToday
                                                    ? "bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                                                    : isWeekend ? "text-muted-foreground" : "text-foreground"}`}>
                                                    {day.getDate()}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                    {todayInRange && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
                            style={{ left: valueToPixels(todayMs - range.start) + "px" }} />
                    )}
                </div>
            </div>
        )
    }

    // Day mode
    return (
        <div className="flex border-b border-sidebar-border bg-sidebar sticky top-[102px] z-20">
            <div className="flex-shrink-0 px-4 py-3 border-r border-sidebar-border flex items-center" style={{ width: SIDEBAR_WIDTH }}>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Project / Client</span>
            </div>
            <div className="flex-1 relative h-12 overflow-hidden">
                {dates.map((dateStr) => {
                    const d = new Date(dateStr + "T00:00:00")
                    const left = valueToPixels(d.getTime() - range.start)
                    const width = valueToPixels(DAY_MS)
                    const isToday = dateStr === today
                    const isHoliday = holidaySet.has(dateStr)
                    const dow = d.getDay()
                    const isWeekend = dow === 0 || dow === 6
                    return (
                        <div key={dateStr}
                            className={`absolute top-0 bottom-0 flex flex-col items-center justify-center border-r border-sidebar-border/20 overflow-hidden
                                ${isToday ? "bg-primary/5" : isHoliday ? "bg-muted/30" : isWeekend ? "bg-muted/10" : ""}`}
                            style={{ left: left + "px", width: width + "px" }}
                        >
                            <span className="text-xs font-medium text-muted-foreground uppercase leading-none">
                                {d.toLocaleDateString("en-US", { weekday: "short" })}
                            </span>
                            <span className={`text-sm font-bold mt-0.5 leading-none ${isToday
                                ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                : ""}`}>
                                {d.getDate()}
                            </span>
                        </div>
                    )
                })}
                {todayInRange && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
                        style={{ left: valueToPixels(todayMs - range.start) + "px" }} />
                )}
            </div>
        </div>
    )
}
