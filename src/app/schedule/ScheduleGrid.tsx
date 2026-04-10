"use client"

import { useState, useTransition, useCallback } from "react"
import {
    TimelineContext,
    useTimelineContext,
    type DragEndEvent,
    type ResizeEndEvent,
    type OnRangeChanged,
    type Range,
    type DragItemData,
    type ResizeItemData,
} from "dnd-timeline"
import { subDays, format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { HelpCircle, ZoomIn, ZoomOut, Search, X, Plus } from "lucide-react"
import { AllocationDialog, EditAllocationDialog } from "./AllocationDialog"
import { updateAllocation } from "@/app/actions/allocations"
import { toast } from "sonner"
import type { Allocation, Holiday, Project } from "./schedule-types"
import { SIDEBAR_WIDTH, DAY_MS } from "./schedule-types"
import { ScheduleHeader } from "./ScheduleGridHeader"
import { CapacitySummaryRow } from "./ScheduleCapacitySummary"
import { PersonSection } from "./ScheduleGridRow"
import type { ScheduleRow } from "./page"

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeEntryBlock = {
    projectId: string
    projectName: string
    dateIndex: number
    durationSeconds: number
}

type ScheduleGridProps = {
    rows: ScheduleRow[]
    allocations: Allocation[]
    timeEntriesByMember: Record<string, TimeEntryBlock[]>
    projects: Project[]
    dates: string[]
    today: string
    canManage: boolean
    holidays?: Holiday[]
    memberTimeOff?: Record<string, string[]>
    availableRoles?: string[]
}

// ─── ScheduleGrid (main export) ───────────────────────────────────────────────

export function ScheduleGrid({
    rows,
    allocations,
    timeEntriesByMember,
    projects,
    dates,
    today,
    canManage,
    holidays = [],
    memberTimeOff = {},
    availableRoles = [],
}: ScheduleGridProps) {
    const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, { startDate: string; endDate: string }>>({})
    const [newAllocOpen, setNewAllocOpen] = useState(false)
    const [newAllocDefaults, setNewAllocDefaults] = useState<{ rowId?: string; startDate?: string; endDate?: string; projectId?: string }>({})
    const [editAlloc, setEditAlloc] = useState<Allocation | null>(null)
    // Start expanded — empty set means nothing collapsed
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
    const [, startTransition] = useTransition()
    const [selectedRole, setSelectedRole] = useState("__all__")
    const [selectedType, setSelectedType] = useState("members")
    const [searchQuery, setSearchQuery] = useState("")
    const [zoomDays, setZoomDays] = useState(28)

    // Auto-derive granularity from zoom level
    const mode: "day" | "week" | "month" = zoomDays <= 21 ? "day" : zoomDays <= 90 ? "week" : "month"

    // Start visible range from today (dates[0] is 7 days earlier — kept for data buffer only)
    const todayMs = new Date(today + "T00:00:00").getTime()
    const rangeStart = todayMs
    const zoomedRange: Range = {
        start: rangeStart,
        end: rangeStart + zoomDays * DAY_MS,
    }

    const onRangeChanged: OnRangeChanged = useCallback(() => {}, [])

    function toggleCollapsed(id: string) {
        setCollapsed(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function applyOptimistic(alloc: Allocation): Allocation {
        const u = optimisticUpdates[alloc.id]
        return u ? { ...alloc, ...u } : alloc
    }

    function handleDragEnd(event: DragEndEvent) {
        if (!canManage) return
        const data = event.active.data.current as DragItemData | undefined
        const newSpan = data?.getSpanFromDragEvent?.(event)
        if (!newSpan) return

        const allocId = String(event.active.id)
        const newStartDate = format(new Date(newSpan.start), "yyyy-MM-dd")
        const newEndDate = format(subDays(new Date(newSpan.end), 1), "yyyy-MM-dd")

        setOptimisticUpdates((prev) => ({ ...prev, [allocId]: { startDate: newStartDate, endDate: newEndDate } }))
        startTransition(async () => {
            try {
                await updateAllocation(allocId, { startDate: newStartDate, endDate: newEndDate })
            } catch {
                setOptimisticUpdates((prev) => { const n = { ...prev }; delete n[allocId]; return n })
                toast.error("Failed to move allocation")
            }
        })
    }

    function handleResizeEnd(event: ResizeEndEvent) {
        if (!canManage) return
        const data = event.active.data.current as ResizeItemData | undefined
        const newSpan = data?.getSpanFromResizeEvent?.(event)
        if (!newSpan) return

        const allocId = String(event.active.id)
        const newStartDate = format(new Date(newSpan.start), "yyyy-MM-dd")
        const newEndDate = format(subDays(new Date(newSpan.end), 1), "yyyy-MM-dd")

        setOptimisticUpdates((prev) => ({ ...prev, [allocId]: { startDate: newStartDate, endDate: newEndDate } }))
        startTransition(async () => {
            try {
                await updateAllocation(allocId, { startDate: newStartDate, endDate: newEndDate })
            } catch {
                setOptimisticUpdates((prev) => { const n = { ...prev }; delete n[allocId]; return n })
                toast.error("Failed to resize allocation")
            }
        })
    }

    // Build effective allocations per row (optimistic overrides applied)
    const allocationsByRow: Record<string, Allocation[]> = {}
    for (const alloc of allocations) {
        const rowId = alloc.rowId
        if (!allocationsByRow[rowId]) allocationsByRow[rowId] = []
        allocationsByRow[rowId].push(applyOptimistic(alloc))
    }

    // Filter rows by role, type, and search query
    const lcSearch = searchQuery.toLowerCase()
    const filteredRows = rows.filter((r) => {
        if (selectedRole !== "__all__" && !r.roles.includes(selectedRole)) return false
        if (selectedType === "members" && r.kind !== "member") return false
        if (selectedType === "placeholders" && r.kind !== "placeholder") return false
        if (lcSearch) {
            const matchesName = r.name.toLowerCase().includes(lcSearch)
            const matchesRole = r.role.toLowerCase().includes(lcSearch)
            const matchesRoles = r.roles.some(role => role.toLowerCase().includes(lcSearch))
            if (!matchesName && !matchesRole && !matchesRoles) return false
        }
        return true
    })

    // Split rows into placeholders and members
    const placeholderRows = filteredRows.filter((r) => r.kind === "placeholder")
    const memberRows = filteredRows.filter((r) => r.kind === "member")

    return (
        <TooltipProvider>
            {/* Toolbar */}
            <div className="flex items-center gap-2 pb-3 pt-3 flex-wrap sticky top-[41px] z-30 bg-background border-b border-sidebar-border/40">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search people or roles..."
                        className="pl-8 h-8 w-48 text-sm"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Type filter */}
                <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40 h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All people</SelectItem>
                        <SelectItem value="members">Team members</SelectItem>
                        <SelectItem value="placeholders">Placeholders</SelectItem>
                    </SelectContent>
                </Select>

                {/* Role filter */}
                {availableRoles.length > 0 && (
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-44 h-8 text-sm">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All Roles</SelectItem>
                            {availableRoles.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                <div className="ml-auto flex items-center gap-2">
                    {/* Zoom +/- */}
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => setZoomDays((d) => Math.max(7, d <= 28 ? d - 7 : d - 30))}
                            disabled={zoomDays <= 7} title="Zoom in">
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground px-1 min-w-[3rem] text-center">
                            {zoomDays >= 60 ? `${Math.round(zoomDays / 30)}mo` : `${zoomDays}d`}
                        </span>
                        <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => setZoomDays((d) => Math.min(180, d < 28 ? d + 7 : d + 30))}
                            disabled={zoomDays >= 180} title="Zoom out">
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                    </div>
                    {/* Auto granularity indicator */}
                    <div className="flex items-center rounded-md border border-sidebar-border h-8 px-3 text-xs font-medium text-muted-foreground select-none">
                        {mode === "day" ? "Day" : mode === "week" ? "Week" : "Month"}
                    </div>
                </div>
            </div>
            <TimelineContext
                range={zoomedRange}
                onDragEnd={handleDragEnd as Parameters<typeof TimelineContext>[0]["onDragEnd"]}
                onResizeEnd={handleResizeEnd}
                onRangeChanged={onRangeChanged}
                sidebarWidth={SIDEBAR_WIDTH}
            >
                <ScheduleBoard
                    placeholderRows={placeholderRows}
                    memberRows={memberRows}
                    allocationsByRow={allocationsByRow}
                    timeEntriesByMember={timeEntriesByMember}
                    dates={dates}
                    today={today}
                    range={zoomedRange}
                    mode={mode}
                    projects={projects}
                    canManage={canManage}
                    holidays={holidays}
                    memberTimeOff={memberTimeOff}
                    collapsed={collapsed}
                    onToggleCollapsed={toggleCollapsed}
                    onEditAlloc={setEditAlloc}
                    onNewAlloc={(rowId, startDate, endDate, projectId) => {
                        setNewAllocDefaults({ rowId, startDate, endDate, projectId })
                        setNewAllocOpen(true)
                    }}
                />
            </TimelineContext>

            {/* Legend */}
            <div className="flex items-center gap-5 text-xs text-muted-foreground pt-2 pb-1 border-t border-sidebar-border/30 mt-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-7 h-3 rounded bg-blue-500/80 border border-blue-500/50 border-solid" />
                    <span>Confirmed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-7 h-3 rounded bg-blue-500/20 border border-blue-500/50 border-dashed" />
                    <span>Tentative</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-semibold">1.5h</Badge>
                    <span>Logged time</span>
                </div>
                {canManage && (
                    <span className="ml-auto text-muted-foreground/50 text-[11px]">Drag to move · edges to resize · click to edit · click/drag timeline to add</span>
                )}
            </div>

            <AllocationDialog
                open={newAllocOpen}
                onOpenChange={setNewAllocOpen}
                rows={rows}
                projects={projects}
                defaultRowId={newAllocDefaults.rowId}
                defaultStartDate={newAllocDefaults.startDate}
                defaultEndDate={newAllocDefaults.endDate}
                defaultProjectId={newAllocDefaults.projectId}
                holidays={holidays.map((h) => h.date)}
                memberTimeOff={memberTimeOff}
            />
            {editAlloc && (
                <EditAllocationDialog
                    open={!!editAlloc}
                    onOpenChange={(open) => { if (!open) setEditAlloc(null) }}
                    allocation={editAlloc}
                    rows={rows}
                    projects={projects}
                    holidays={holidays.map((h) => h.date)}
                    memberTimeOff={memberTimeOff}
                />
            )}
        </TooltipProvider>
    )
}

// ─── ScheduleBoard ────────────────────────────────────────────────────────────

type ScheduleBoardProps = {
    placeholderRows: ScheduleRow[]
    memberRows: ScheduleRow[]
    allocationsByRow: Record<string, Allocation[]>
    timeEntriesByMember: Record<string, TimeEntryBlock[]>
    dates: string[]
    today: string
    range: Range
    mode: "day" | "week" | "month"
    projects: Project[]
    canManage: boolean
    holidays: Holiday[]
    memberTimeOff: Record<string, string[]>
    collapsed: Set<string>
    onToggleCollapsed: (id: string) => void
    onEditAlloc: (alloc: Allocation) => void
    onNewAlloc: (rowId: string, startDate?: string, endDate?: string, projectId?: string) => void
}

function ScheduleBoard({
    placeholderRows, memberRows, allocationsByRow, timeEntriesByMember, dates, today, range, mode, projects, canManage,
    holidays, memberTimeOff, collapsed, onToggleCollapsed, onEditAlloc, onNewAlloc,
}: ScheduleBoardProps) {
    const { style, setTimelineRef } = useTimelineContext()

    const sharedRowProps = {
        dates, today, range, mode, projects, canManage,
        holidays: holidays.map((h) => h.date),
        memberTimeOff,
        onEditAlloc,
        onNewAlloc,
    }

    return (
        <div className="rounded-xl border border-sidebar-border bg-sidebar/30 overflow-clip shadow-sm">
            <ScheduleHeader dates={dates} today={today} mode={mode} />
            <div
                ref={setTimelineRef as (el: HTMLDivElement | null) => void}
                style={style}
                className="divide-y divide-sidebar-border"
            >
                <CapacitySummaryRow
                    rows={[...placeholderRows, ...memberRows]}
                    allocationsByRow={allocationsByRow}
                    dates={dates}
                    holidays={holidays}
                    memberTimeOff={memberTimeOff}
                    mode={mode}
                />

                {placeholderRows.length === 0 && memberRows.length === 0 && (
                    <div className="py-16 text-center">
                        <p className="text-sm text-muted-foreground">No team members match your filters.</p>
                    </div>
                )}

                {placeholderRows.length > 0 && (
                    <>
                        <div className="px-4 py-1.5 bg-amber-500/5 border-b border-sidebar-border flex items-center gap-2">
                            <HelpCircle className="h-3.5 w-3.5 text-amber-500/80" />
                            <span className="text-xs font-medium text-amber-600/80 dark:text-amber-400/80 uppercase tracking-widest">
                                Placeholders
                            </span>
                        </div>
                        {placeholderRows.map((row) => (
                            <PersonSection
                                key={row.id}
                                row={row}
                                allocs={allocationsByRow[row.id] ?? []}
                                timeEntries={[]}
                                isExpanded={!collapsed.has(row.id)}
                                onToggle={() => onToggleCollapsed(row.id)}
                                {...sharedRowProps}
                            />
                        ))}
                    </>
                )}

                {placeholderRows.length > 0 && memberRows.length > 0 && (
                    <div className="px-4 py-1.5 bg-sidebar/60 border-b border-sidebar-border flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">
                            Team Members
                        </span>
                    </div>
                )}
                {memberRows.map((row) => (
                    <PersonSection
                        key={row.id}
                        row={row}
                        allocs={allocationsByRow[row.id] ?? []}
                        timeEntries={row.userId ? (timeEntriesByMember[row.userId] ?? []) : []}
                        isExpanded={!collapsed.has(row.id)}
                        onToggle={() => onToggleCollapsed(row.id)}
                        {...sharedRowProps}
                    />
                ))}
            </div>
        </div>
    )
}

// ─── NewAllocationButton ──────────────────────────────────────────────────────

type NewAllocationButtonProps = {
    rows: import("./page").ScheduleRow[]
    projects: Project[]
    holidays?: string[]
    memberTimeOff?: Record<string, string[]>
}

export function NewAllocationButton({ rows, projects, holidays, memberTimeOff }: NewAllocationButtonProps) {
    const [open, setOpen] = useState(false)
    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Allocation
            </Button>
            <AllocationDialog
                open={open}
                onOpenChange={setOpen}
                rows={rows}
                projects={projects}
                holidays={holidays}
                memberTimeOff={memberTimeOff}
            />
        </>
    )
}
