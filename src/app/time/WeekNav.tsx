"use client"

import { useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import {
    format,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    startOfWeek,
    isSameDay,
    parseISO,
} from "date-fns"

interface WeekNavProps {
    weekStart: string   // ISO yyyy-MM-dd
    weekEnd: string     // ISO yyyy-MM-dd
    totalSeconds: number
    view: "week" | "day"
    day?: string        // ISO yyyy-MM-dd — only meaningful for day view
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
    submissionStatus?: "OPEN" | "SUBMITTED" | "APPROVED" | "REJECTED" | null
}

export function WeekNav({ weekStart, weekEnd, totalSeconds, view, day, weekStartsOn, submissionStatus }: WeekNavProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    function buildUrl(params: Record<string, string | null>) {
        const p = new URLSearchParams(searchParams.toString())
        for (const [k, v] of Object.entries(params)) {
            if (v === null) p.delete(k)
            else p.set(k, v)
        }
        return `${pathname}?${p.toString()}`
    }

    const start = parseISO(weekStart)
    const end = parseISO(weekEnd)
    const selectedDay = day ? parseISO(day) : new Date()

    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn })
    const isCurrentWeek = isSameDay(start, currentWeekStart)
    const isToday = isSameDay(selectedDay, new Date())

    // ─── Week navigation ──────────────────────────────────────────────────
    function prevWeek() {
        startTransition(() => {
            router.push(buildUrl({ week: format(subWeeks(start, 1), "yyyy-MM-dd"), view: "week", day: null }))
        })
    }
    function nextWeek() {
        startTransition(() => {
            router.push(buildUrl({ week: format(addWeeks(start, 1), "yyyy-MM-dd"), view: "week", day: null }))
        })
    }
    function thisWeek() {
        startTransition(() => {
            router.push(buildUrl({ week: null, view: "week", day: null }))
        })
    }

    // ─── Day navigation ───────────────────────────────────────────────────
    function prevDay() {
        const newDay = subDays(selectedDay, 1)
        // If going out of current week, update week param too
        const newWeekStart = startOfWeek(newDay, { weekStartsOn })
        startTransition(() => {
            router.push(buildUrl({
                view: "day",
                day: format(newDay, "yyyy-MM-dd"),
                week: format(newWeekStart, "yyyy-MM-dd"),
            }))
        })
    }
    function nextDay() {
        const newDay = addDays(selectedDay, 1)
        const newWeekStart = startOfWeek(newDay, { weekStartsOn })
        startTransition(() => {
            router.push(buildUrl({
                view: "day",
                day: format(newDay, "yyyy-MM-dd"),
                week: format(newWeekStart, "yyyy-MM-dd"),
            }))
        })
    }
    function today() {
        const newWeekStart = startOfWeek(new Date(), { weekStartsOn })
        startTransition(() => {
            router.push(buildUrl({
                view: "day",
                day: format(new Date(), "yyyy-MM-dd"),
                week: format(newWeekStart, "yyyy-MM-dd"),
            }))
        })
    }

    // ─── View toggle ──────────────────────────────────────────────────────
    function switchToDay() {
        // Navigate to today's day within the current week
        const target = new Date()
        // If today is within the viewed week, use today; else use weekStart
        const inRange = target >= start && target <= end
        const dayTarget = inRange ? target : start
        startTransition(() => {
            router.push(buildUrl({
                view: "day",
                day: format(dayTarget, "yyyy-MM-dd"),
                week: weekStart,
            }))
        })
    }
    function switchToWeek() {
        startTransition(() => {
            router.push(buildUrl({ view: "week", day: null }))
        })
    }

    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const totalLabel = totalSeconds > 0 ? `${h}h ${m}m` : "0h 0m"

    // Range label
    const sameYear = start.getFullYear() === end.getFullYear()
    const weekRangeLabel = sameYear
        ? `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
        : `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`

    const dayLabel = isToday
        ? `Today: ${format(selectedDay, "EEE, MMM d")}`
        : format(selectedDay, "EEEE, MMM d, yyyy")

    return (
        <div className="flex items-center justify-between gap-4">
            {/* ─── Left: navigation ─────────────────────────────────────── */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={view === "week" ? prevWeek : prevDay}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>

                <span className="text-sm font-semibold min-w-[200px] text-center tabular-nums">
                    {view === "week" ? weekRangeLabel : dayLabel}
                </span>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={view === "week" ? nextWeek : nextDay}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                {view === "week" && !isCurrentWeek && (
                    <Button variant="ghost" size="sm" onClick={thisWeek} disabled={isPending} className="text-xs h-7 text-muted-foreground hover:text-foreground">
                        This week
                    </Button>
                )}
                {view === "day" && !isToday && (
                    <Button variant="ghost" size="sm" onClick={today} disabled={isPending} className="text-xs h-7 text-muted-foreground hover:text-foreground">
                        Today
                    </Button>
                )}
            </div>

            {/* ─── Right: total + submission status + view toggle ─────── */}
            <div className="flex items-center gap-3">
                {view === "week" && submissionStatus && submissionStatus !== "OPEN" && (
                    <Badge
                        variant="outline"
                        className={
                            submissionStatus === "APPROVED"
                                ? "bg-emerald-600 text-white border-transparent text-xs"
                                : submissionStatus === "SUBMITTED"
                                ? "text-amber-600 border-amber-500/50 text-xs"
                                : "text-destructive border-destructive/30 text-xs"
                        }
                    >
                        {submissionStatus === "APPROVED" ? "Approved" : submissionStatus === "SUBMITTED" ? "Submitted" : "Changes Requested"}
                    </Badge>
                )}
                <span className="text-xs text-muted-foreground tabular-nums">
                    {view === "week" ? "Week total:" : "Day total:"}{" "}
                    <span className="font-bold tabular-nums text-foreground">{totalLabel}</span>
                </span>

                {/* Day / Week segment toggle */}
                <div className="flex rounded-md border border-sidebar-border overflow-hidden h-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-none h-full px-3 text-xs border-0 ${view === "day" ? "bg-sidebar-accent text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={switchToDay}
                        disabled={isPending}
                    >
                        Day
                    </Button>
                    <div className="w-px bg-sidebar-border self-stretch" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-none h-full px-3 text-xs border-0 ${view === "week" ? "bg-sidebar-accent text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={switchToWeek}
                        disabled={isPending}
                    >
                        Week
                    </Button>
                </div>
            </div>
        </div>
    )
}
