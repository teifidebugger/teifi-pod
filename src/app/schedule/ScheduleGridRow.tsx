"use client"

import { useState, useEffect, useRef } from "react"
import { useRow, useTimelineContext } from "dnd-timeline"
import { addDays, format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { avatarColor } from "@/lib/avatar-color"
import type { Allocation, Project } from "./schedule-types"
import { SIDEBAR_WIDTH, BAR_HEIGHT, DAY_MS, SIX_HOURS_MS } from "./schedule-types"
import { PersonProjectRow } from "./ScheduleAllocationBlock"
import type { Range } from "dnd-timeline"
import type { ScheduleRow } from "./page"

// ─── Avatar color helper ──────────────────────────────────────────────────────

function getAvatarColors(name: string): string {
    const { bg, text } = avatarColor(name)
    return `${bg} ${text}`
}

function utilizationColor(ratio: number) {
    if (ratio <= 0.8) return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    if (ratio <= 1.0) return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
    return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20"
}

// ─── PersonSection ────────────────────────────────────────────────────────────

type PersonSectionProps = {
    row: ScheduleRow
    allocs: Allocation[]
    timeEntries: { projectId: string; projectName: string; dateIndex: number; durationSeconds: number }[]
    isExpanded: boolean
    onToggle: () => void
    dates: string[]
    today: string
    range: Range
    mode: "day" | "week" | "month"
    projects: Project[]
    canManage: boolean
    holidays: string[]
    memberTimeOff: Record<string, string[]>
    onEditAlloc: (alloc: Allocation) => void
    onNewAlloc: (rowId: string, startDate?: string, endDate?: string, projectId?: string) => void
}

export function PersonSection({ row, allocs, timeEntries, isExpanded, onToggle, projects, canManage, onNewAlloc, ...rest }: PersonSectionProps) {
    // Group allocs by project for expanded sub-rows
    const projectGroups: Array<{ projectId: string; projectName: string; clientName: string | null; allocs: Allocation[] }> = []

    if (isExpanded) {
        const windowEnd = rest.dates[rest.dates.length - 1]
        // Only show project sub-rows for allocations that are active today or in the future
        const visibleAllocs = allocs.filter((a) => a.endDate >= rest.today && a.startDate <= windowEnd)
        const map = new Map<string, { projectName: string; clientName: string | null; allocs: Allocation[] }>()
        for (const alloc of visibleAllocs) {
            const existing = map.get(alloc.projectId)
            if (existing) {
                existing.allocs.push(alloc)
            } else {
                map.set(alloc.projectId, {
                    projectName: alloc.project.name,
                    clientName: alloc.project.clientName,
                    allocs: [alloc],
                })
            }
        }
        for (const [projectId, data] of Array.from(map.entries()).sort((a, b) =>
            a[1].projectName.localeCompare(b[1].projectName)
        )) {
            projectGroups.push({ projectId, ...data })
        }
    }

    return (
        <>
            <PersonHeaderRow
                row={row}
                allocs={allocs}
                timeEntries={timeEntries}
                isExpanded={isExpanded}
                onToggle={onToggle}
                canManage={canManage}
                onNewAlloc={onNewAlloc}
                {...rest}
            />
            {isExpanded && projectGroups.map((group) => (
                <PersonProjectRow
                    key={`${row.id}::${group.projectId}`}
                    rowId={`${row.id}::${group.projectId}`}
                    projectId={group.projectId}
                    personRowId={row.id}
                    projectName={group.projectName}
                    clientName={group.clientName}
                    allocs={group.allocs}
                    dates={rest.dates}
                    range={rest.range}
                    canManage={canManage}
                    onEditAlloc={rest.onEditAlloc}
                    onNewAlloc={onNewAlloc}
                />
            ))}
            {isExpanded && (
                <PersonFooterRow
                    row={row}
                    projects={projects}
                    canManage={canManage}
                    onNewAlloc={onNewAlloc}
                />
            )}
        </>
    )
}

// ─── PersonHeaderRow ──────────────────────────────────────────────────────────

type PersonHeaderRowProps = {
    row: ScheduleRow
    allocs: Allocation[]
    timeEntries: { projectId: string; projectName: string; dateIndex: number; durationSeconds: number }[]
    isExpanded: boolean
    onToggle: () => void
    dates: string[]
    today: string
    range: Range
    mode: "day" | "week" | "month"
    canManage: boolean
    holidays: string[]
    memberTimeOff: Record<string, string[]>
    onEditAlloc: (alloc: Allocation) => void
    onNewAlloc: (rowId: string, startDate?: string, endDate?: string) => void
}

function PersonHeaderRow({
    row, allocs, isExpanded, onToggle,
    dates, today, range, mode, canManage, holidays, memberTimeOff, onNewAlloc,
}: PersonHeaderRowProps) {
    const { setNodeRef, rowStyle } = useRow({ id: row.id })
    const { valueToPixels } = useTimelineContext()

    const isPlaceholder = row.kind === "placeholder"

    // Utilization over next 4 weeks from today (fixed window, not scroll-position-dependent)
    const next4WeeksWorkdays: string[] = []
    const _d = new Date(today + "T00:00:00")
    for (let i = 0; i < 28; i++) {
        const day = addDays(_d, i)
        const dow = day.getDay()
        if (dow !== 0 && dow !== 6) next4WeeksWorkdays.push(format(day, "yyyy-MM-dd"))
    }
    let totalWindowAllocHours = 0
    for (const alloc of allocs) {
        for (const d of next4WeeksWorkdays) {
            if (d >= alloc.startDate && d <= alloc.endDate) totalWindowAllocHours += alloc.hoursPerDay
        }
    }
    const avgWeeklyAllocHours = next4WeeksWorkdays.length > 0 ? (totalWindowAllocHours / next4WeeksWorkdays.length) * 5 : 0
    const allocUtilRatio = row.weeklyCapacityHours > 0 ? avgWeeklyAllocHours / row.weeklyCapacityHours : 0

    const holidaySet = new Set(holidays)
    const rowTimeOff = new Set(row.kind === "member" ? (memberTimeOff[row.id] ?? []) : [])

    // Drag-to-create state
    const [dragCreate, setDragCreate] = useState<{
        startMs: number
        endMs: number
        containerRect: DOMRect
    } | null>(null)

    const dragCreateRef = useRef(dragCreate)
    dragCreateRef.current = dragCreate

    useEffect(() => {
        if (!dragCreate) return

        function handleMouseMove(e: MouseEvent) {
            const dc = dragCreateRef.current
            if (!dc) return
            const relX = e.clientX - dc.containerRect.left
            const ratio = relX / dc.containerRect.width
            const newEndMs = range.start + ratio * (range.end - range.start)
            setDragCreate((prev) => prev ? { ...prev, endMs: newEndMs } : null)
        }

        function handleMouseUp() {
            const dc = dragCreateRef.current
            if (!dc) return
            const diff = Math.abs(dc.endMs - dc.startMs)
            if (diff > SIX_HOURS_MS) {
                const minMs = Math.min(dc.startMs, dc.endMs)
                const maxMs = Math.max(dc.startMs, dc.endMs)
                const startDate = format(new Date(minMs), "yyyy-MM-dd")
                const endDate = format(new Date(maxMs), "yyyy-MM-dd")
                onNewAlloc(row.id, startDate, endDate)
            } else {
                onNewAlloc(row.id, format(new Date(dc.startMs), "yyyy-MM-dd"))
            }
            setDragCreate(null)
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [dragCreate !== null]) // eslint-disable-line react-hooks/exhaustive-deps

    const rowMinHeight = 56

    const todayMs = new Date(today + "T00:00:00").getTime()
    const todayInRange = todayMs >= range.start && todayMs < range.end

    const ghostBar = dragCreate ? (() => {
        const minMs = Math.min(dragCreate.startMs, dragCreate.endMs)
        const maxMs = Math.max(dragCreate.startMs, dragCreate.endMs)
        const clampedMin = Math.max(minMs, range.start)
        const clampedMax = Math.min(maxMs, range.end)
        const left = valueToPixels(clampedMin - range.start)
        const width = valueToPixels(clampedMax - clampedMin)
        const label = `${format(new Date(clampedMin), "MMM d")} → ${format(new Date(clampedMax), "MMM d")}`
        return { left, width, label }
    })() : null

    return (
        <div className={`flex group transition-colors ${isExpanded ? "bg-sidebar/20" : "hover:bg-sidebar/10"}`}>
            {/* Sidebar */}
            <div
                className="flex-shrink-0 px-3 py-2.5 border-r border-sidebar-border flex items-center gap-2.5"
                style={{ width: SIDEBAR_WIDTH }}
            >
                <button
                    onClick={onToggle}
                    className="flex-shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                    {isExpanded
                        ? <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronRight className="h-3.5 w-3.5" />
                    }
                </button>
                {isPlaceholder ? (
                    <Avatar className="h-8 w-8 border border-amber-400/60 bg-amber-50 dark:bg-amber-950 flex-shrink-0">
                        <AvatarFallback className="bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-xs font-bold">
                            ?
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={`text-xs font-semibold ${getAvatarColors(row.name)}`}>
                            {row.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-foreground truncate leading-tight">{row.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${utilizationColor(allocUtilRatio)}`}>
                            {Math.round(avgWeeklyAllocHours)}h / {row.weeklyCapacityHours}h
                        </span>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div
                ref={setNodeRef}
                style={{ ...rowStyle, minHeight: rowMinHeight, overflow: "hidden" }}
                className="flex-1 cursor-default bg-sidebar/5"
                onMouseDown={(e) => {
                    if (!canManage) return
                    if (e.button !== 0) return
                    if ((e.target as HTMLElement).closest("[data-bar]")) return
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                    const ratio = (e.clientX - rect.left) / rect.width
                    const clickedMs = range.start + ratio * (range.end - range.start)
                    const clickedDate = format(new Date(clickedMs), "yyyy-MM-dd")
                    const clickedDow = new Date(clickedDate + "T12:00:00").getDay()
                    if (clickedDow === 0 || clickedDow === 6 || holidaySet.has(clickedDate) || rowTimeOff.has(clickedDate)) return
                    setDragCreate({ startMs: clickedMs, endMs: clickedMs, containerRect: rect })
                }}
            >
                {/* Day columns — grid lines, weekend/holiday markers */}
                {dates.map((dateStr) => {
                    const d = new Date(dateStr + "T00:00:00")
                    const left = valueToPixels(d.getTime() - range.start)
                    const width = valueToPixels(DAY_MS)
                    const isToday = dateStr === today
                    const isHoliday = holidaySet.has(dateStr)
                    const isTimeOff = rowTimeOff.has(dateStr)
                    const dow = d.getDay()
                    const isWeekend = dow === 0 || dow === 6
                    return (
                        <div
                            key={dateStr}
                            className={`absolute top-0 bottom-0 border-r border-sidebar-border/10 ${isHoliday || isTimeOff || isWeekend ? "cursor-not-allowed" : "pointer-events-none"} ${isToday ? "outline outline-1 outline-primary/20 outline-inset" : ""}`}
                            style={{
                                left: left + "px",
                                width: width + "px",
                                ...(isTimeOff
                                    ? { backgroundColor: "rgba(59,130,246,0.08)", backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(59,130,246,0.18) 4px,rgba(59,130,246,0.18) 8px)" }
                                    : isHoliday
                                    ? { backgroundColor: "rgba(239,68,68,0.05)", backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(239,68,68,0.12) 4px,rgba(239,68,68,0.12) 8px)" }
                                    : isWeekend
                                    ? { backgroundColor: "rgba(0,0,0,0.03)", backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.05) 4px,rgba(0,0,0,0.05) 8px)" }
                                    : {}),
                            }}
                            title={isHoliday ? "Non-working day" : isTimeOff ? "Time off" : isWeekend ? "Weekend" : undefined}
                            onMouseDown={(e) => {
                                if (isHoliday || isTimeOff || isWeekend) { e.stopPropagation(); e.preventDefault() }
                            }}
                        />
                    )
                })}

                {/* Today marker */}
                {todayInRange && (
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-primary/40 z-10 pointer-events-none"
                        style={{ left: valueToPixels(todayMs - range.start) + "px" }}
                    />
                )}

                {/* Harvest-style utilization cells — always visible */}
                {(() => {
                    if (mode === "week") {
                        // One cell per week column
                        return dates
                            .filter(d => new Date(d + "T00:00:00").getDay() === 1)
                            .map(monday => {
                                const ms = new Date(monday + "T00:00:00").getTime()
                                if (ms >= range.end) return null
                                const weekEnd = format(addDays(new Date(monday + "T00:00:00"), 6), "yyyy-MM-dd")
                                // Span Mon–Fri only (5 days), leave Sat/Sun columns clear
                                const friEndMs = ms + 5 * DAY_MS
                                const left = valueToPixels(Math.max(ms, range.start) - range.start)
                                const width = valueToPixels(Math.min(friEndMs, range.end) - Math.max(ms, range.start))
                                const workDays = dates.filter(d => {
                                    const dow = new Date(d + "T00:00:00").getDay()
                                    return d >= monday && d <= weekEnd && dow !== 0 && dow !== 6 && !holidaySet.has(d) && !rowTimeOff.has(d)
                                })
                                const weekCap = workDays.length * (row.weeklyCapacityHours / 5)
                                if (weekCap === 0) return null
                                let weekAlloc = 0
                                for (const alloc of allocs) {
                                    for (const d of workDays) {
                                        if (d >= alloc.startDate && d <= alloc.endDate) weekAlloc += alloc.hoursPerDay
                                    }
                                }
                                if (weekAlloc === 0) return null
                                const ratio = weekAlloc / weekCap
                                let bgColor: string, textColor: string, label: string
                                if (ratio > 1) {
                                    bgColor = "rgba(239,68,68,0.18)"; textColor = "rgb(248,113,113)"
                                    label = `${(weekAlloc - weekCap).toFixed(1)} over`
                                } else if (ratio >= 1) {
                                    bgColor = "rgba(245,158,11,0.18)"; textColor = "rgb(251,191,36)"
                                    label = "Full"
                                } else {
                                    bgColor = "rgba(34,197,94,0.15)"; textColor = "rgb(74,222,128)"
                                    label = `${(weekCap - weekAlloc).toFixed(1)} open`
                                }
                                return (
                                    <div key={monday} className="absolute top-0 bottom-0 border-r border-sidebar-border/10 flex items-center justify-center pointer-events-none z-5"
                                        style={{ left: left + "px", width: width + "px", backgroundColor: bgColor }}>
                                        <span className="text-[10px] font-semibold whitespace-nowrap truncate px-1" style={{ color: textColor }}>{label}</span>
                                    </div>
                                )
                            })
                    } else {
                        // Day mode — one cell per workday
                        return dates.map(dateStr => {
                            const d = new Date(dateStr + "T00:00:00")
                            const dow = d.getDay()
                            if (dow === 0 || dow === 6 || holidaySet.has(dateStr) || rowTimeOff.has(dateStr)) return null
                            const dailyCap = row.weeklyCapacityHours / 5
                            if (dailyCap === 0) return null
                            let allocated = 0
                            for (const alloc of allocs) {
                                if (dateStr >= alloc.startDate && dateStr <= alloc.endDate) allocated += alloc.hoursPerDay
                            }
                            if (allocated === 0) return null
                            const ratio = allocated / dailyCap
                            let bgColor: string, textColor: string, label: string
                            if (ratio > 1) {
                                bgColor = "rgba(239,68,68,0.18)"; textColor = "rgb(248,113,113)"
                                label = `${(allocated - dailyCap).toFixed(1)}+`
                            } else if (ratio >= 1) {
                                bgColor = "rgba(245,158,11,0.18)"; textColor = "rgb(251,191,36)"
                                label = "Full"
                            } else {
                                bgColor = "rgba(34,197,94,0.15)"; textColor = "rgb(74,222,128)"
                                label = `${(dailyCap - allocated).toFixed(1)}`
                            }
                            const left = valueToPixels(d.getTime() - range.start)
                            const width = valueToPixels(DAY_MS)
                            return (
                                <div key={dateStr} className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none z-5"
                                    style={{ left: left + "px", width: width + "px", backgroundColor: bgColor }}>
                                    <span className="text-[10px] font-semibold" style={{ color: textColor }}>{label}</span>
                                </div>
                            )
                        })
                    }
                })()}

                {/* Ghost bar for drag-to-create */}
                {ghostBar && ghostBar.width > 2 && (
                    <div
                        className="absolute top-1 z-30 opacity-60 bg-primary/40 border-2 border-primary border-dashed rounded flex items-center justify-center pointer-events-none select-none"
                        style={{ left: ghostBar.left + "px", width: ghostBar.width + "px", height: BAR_HEIGHT }}
                    >
                        <span className="text-[10px] font-medium text-primary truncate px-1">{ghostBar.label}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── PersonFooterRow ──────────────────────────────────────────────────────────

type PersonFooterRowProps = {
    row: ScheduleRow
    projects: Project[]
    canManage: boolean
    onNewAlloc: (rowId: string, startDate?: string, endDate?: string, projectId?: string) => void
}

export function PersonFooterRow({ row, projects, canManage, onNewAlloc }: PersonFooterRowProps) {
    const [assignOpen, setAssignOpen] = useState(false)
    const [search, setSearch] = useState("")

    // Group projects by clientName
    const grouped = new Map<string, Project[]>()
    for (const p of projects) {
        const key = p.clientName ?? "Other"
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(p)
    }
    const sortedClients = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))

    const lcSearch = search.toLowerCase()
    const filteredClients = sortedClients.map(([client, projs]) => ({
        client,
        projs: projs.filter(p => p.name.toLowerCase().includes(lcSearch) || client.toLowerCase().includes(lcSearch)),
    })).filter(g => g.projs.length > 0)

    return (
        <div className="flex border-t border-sidebar-border/10 items-center gap-2 px-3 py-1.5">
            {canManage && (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                                Actions <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => onNewAlloc(row.id)}>
                                Add allocation
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Popover open={assignOpen} onOpenChange={(o) => { setAssignOpen(o); if (!o) setSearch("") }}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs text-muted-foreground gap-1 px-2">
                                Assign to project...
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Search projects..."
                                    value={search}
                                    onValueChange={setSearch}
                                />
                                <CommandList className="max-h-64">
                                    <CommandEmpty>No projects found.</CommandEmpty>
                                    {!lcSearch && (
                                        <CommandGroup heading="Time off">
                                            <CommandItem
                                                onSelect={() => {
                                                    setAssignOpen(false)
                                                    setSearch("")
                                                    onNewAlloc(row.id)
                                                }}
                                            >
                                                Time Off
                                            </CommandItem>
                                        </CommandGroup>
                                    )}
                                    {filteredClients.map(({ client, projs }) => (
                                        <CommandGroup key={client} heading={client}>
                                            {projs.map(p => (
                                                <CommandItem
                                                    key={p.id}
                                                    onSelect={() => {
                                                        setAssignOpen(false)
                                                        setSearch("")
                                                        onNewAlloc(row.id, undefined, undefined, p.id)
                                                    }}
                                                >
                                                    {p.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    ))}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </>
            )}
        </div>
    )
}
