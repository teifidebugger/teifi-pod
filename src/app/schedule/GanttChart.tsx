"use client"

import React, { useState, useTransition, useCallback } from "react"
import {
    TimelineContext,
    type DragEndEvent,
    type ResizeEndEvent,
    type OnRangeChanged,
    type Span,
} from "dnd-timeline"

interface DndTimelineItemData {
    getSpanFromDragEvent?: (event: DragEndEvent) => Span | null
    getSpanFromResizeEvent?: (event: ResizeEndEvent) => Span | null
}
import { addDays, format, subDays } from "date-fns"
import { updateAllocation } from "@/app/actions/allocations"
import { toast } from "sonner"
import { AllocationDialog, EditAllocationDialog } from "./AllocationDialog"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Plus, Search, X, ZoomIn, ZoomOut, Check } from "lucide-react"
import type { ScheduleRow } from "./page"
import {
    type GanttAllocation,
    type GanttProject,
    type Member,
    type PlaceholderRef,
    type Project,
    type ClientOption,
    type ManagerOption,
    SIDEBAR_WIDTH,
    getAvatarColors,
    projectHex,
    computeRange,
} from "./GanttTypes"
import { GanttBoard } from "./GanttBoard"

export type { GanttAllocation, GanttProject }

// ─── GanttChart (main export) ─────────────────────────────────────────────────

type GanttChartProps = {
    ganttProjects: GanttProject[]
    members: Member[]
    placeholders: PlaceholderRef[]
    projects: Project[]
    today: string
    offsetDays: number
    canManage: boolean
    holidays?: { date: string; name: string }[]
    clients?: ClientOption[]
    managers?: ManagerOption[]
}

export function GanttChart({
    ganttProjects, members, placeholders, projects, today,
    offsetDays: initialOffsetDays, canManage, holidays = [],
    clients = [], managers = [],
}: GanttChartProps) {
    const [zoomDays, setZoomDays] = useState(28)
    const [localOffsetDays, setLocalOffsetDays] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, { startDate: string; endDate: string }>>({})
    const [editAlloc, setEditAlloc] = useState<GanttAllocation | null>(null)
    const [newAllocOpen, setNewAllocOpen] = useState(false)
    const [newAllocDefaults, setNewAllocDefaults] = useState<{
        projectId?: string; startDate?: string; endDate?: string; rowId?: string
    }>({})
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
    const [colorFilter, setColorFilter] = useState<Set<string>>(new Set())
    const [peopleFilter, setPeopleFilter] = useState<Set<string>>(new Set())
    const [filterPanelOpen, setFilterPanelOpen] = useState(false)
    const [, startTransition] = useTransition()

    const mode: "day" | "week" | "month" = zoomDays <= 21 ? "day" : zoomDays <= 90 ? "week" : "month"
    const effectiveOffset = initialOffsetDays + localOffsetDays
    const range = computeRange(zoomDays, effectiveOffset)
    const onRangeChanged: OnRangeChanged = useCallback(() => {}, [])

    // ScheduleRow[] for AllocationDialog compatibility
    const ganttRows: ScheduleRow[] = [
        ...placeholders.map((p) => ({
            id: p.id, kind: "placeholder" as const, name: p.name, image: null,
            weeklyCapacityHours: p.weeklyCapacityHours ?? 40, role: "Placeholder", roles: [] as string[], userId: null,
        })),
        ...members.map((m) => ({
            id: m.id, kind: "member" as const, name: m.name, image: null,
            weeklyCapacityHours: m.weeklyCapacityHours ?? 40, role: "Member", roles: [] as string[], userId: null,
        })),
    ]

    function applyOptimistic(alloc: GanttAllocation): GanttAllocation {
        const u = optimisticUpdates[alloc.id]
        return u ? { ...alloc, ...u } : alloc
    }

    function handleDragEnd(event: DragEndEvent) {
        if (!canManage) return
        const data = event.active.data.current as DndTimelineItemData | undefined
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
        const data = event.active.data.current as DndTimelineItemData | undefined
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

    function toggleCollapsed(projectId: string) {
        setCollapsed((prev) => {
            const next = new Set(prev)
            if (next.has(projectId)) next.delete(projectId)
            else next.add(projectId)
            return next
        })
    }

    // Compute unique colors used across all projects
    const usedColors = [...new Set(ganttProjects.map((p) => p.color).filter(Boolean))]

    // Compute unique people who appear in any allocation
    const allPeople = [...new Map(
        ganttProjects.flatMap((p) => p.allocations).map((a) => [
            a.memberId ?? a.placeholderId ?? a.id,
            { id: a.memberId ?? a.placeholderId ?? a.id, name: a.member.name, isPlaceholder: a.isPlaceholder },
        ])
    ).values()].sort((a, b) => a.name.localeCompare(b.name))

    const lcSearch = searchQuery.toLowerCase()
    const visibleProjects = ganttProjects
        .filter((p) => !lcSearch || p.name.toLowerCase().includes(lcSearch) || (p.clientName ?? "").toLowerCase().includes(lcSearch))
        .filter((p) => colorFilter.size === 0 || colorFilter.has(p.color))
        .filter((p) => peopleFilter.size === 0 || p.allocations.some((a) => peopleFilter.has(a.memberId ?? a.placeholderId ?? a.id)))

    const activeFilterCount = colorFilter.size + peopleFilter.size

    function toggleColorFilter(color: string) {
        setColorFilter((prev) => {
            const next = new Set(prev)
            if (next.has(color)) next.delete(color); else next.add(color)
            return next
        })
    }

    function togglePeopleFilter(personId: string) {
        setPeopleFilter((prev) => {
            const next = new Set(prev)
            if (next.has(personId)) next.delete(personId); else next.add(personId)
            return next
        })
    }

    function clearAllFilters() {
        setColorFilter(new Set())
        setPeopleFilter(new Set())
        setSearchQuery("")
    }

    return (
        <TooltipProvider>
            {/* Toolbar — matches ScheduleGrid exactly */}
            <div className="flex items-center gap-2 pb-3 pt-3 flex-wrap sticky top-[41px] z-30 bg-background border-b border-sidebar-border/40">
                <Popover open={filterPanelOpen} onOpenChange={setFilterPanelOpen}>
                    <PopoverTrigger asChild>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setFilterPanelOpen(true)}
                                placeholder="Search projects..."
                                className="pl-8 h-8 w-56 text-sm pr-16"
                            />
                            {activeFilterCount > 0 && (
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                                    {activeFilterCount}
                                </span>
                            )}
                            {(searchQuery || activeFilterCount > 0) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); clearAllFilters() }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-72 p-0"
                        align="start"
                        side="bottom"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onInteractOutside={(e) => {
                            // Don't close when clicking the search input itself
                            if ((e.target as HTMLElement)?.closest?.("input")) e.preventDefault()
                        }}
                    >
                        <div className="p-3 space-y-3">
                            {usedColors.length > 0 && (
                                <div>
                                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Color labels</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {usedColors.map((color) => {
                                            const hex = projectHex(color)
                                            const isActive = colorFilter.has(color)
                                            return (
                                                <button
                                                    key={color}
                                                    onClick={() => toggleColorFilter(color)}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? "border-foreground scale-110" : "border-transparent hover:border-muted-foreground/40"}`}
                                                    style={{ backgroundColor: hex }}
                                                    title={color}
                                                >
                                                    {isActive && <Check className="h-3 w-3 text-white" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                            {allPeople.length > 0 && (
                                <div>
                                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">People</div>
                                    <div className="max-h-40 overflow-y-auto -mx-1">
                                        {allPeople.map((person) => {
                                            const isActive = peopleFilter.has(person.id)
                                            return (
                                                <button
                                                    key={person.id}
                                                    onClick={() => togglePeopleFilter(person.id)}
                                                    className={`flex items-center gap-2 w-full px-2 py-1 rounded text-sm hover:bg-muted/60 transition-colors ${isActive ? "bg-muted/40" : ""}`}
                                                >
                                                    <Avatar className="h-5 w-5 flex-shrink-0">
                                                        <AvatarFallback className={`text-[8px] font-semibold ${getAvatarColors(person.name)}`}>
                                                            {person.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="truncate flex-1 text-left">{person.name}</span>
                                                    {person.isPlaceholder && (
                                                        <span className="text-[9px] text-amber-500">PH</span>
                                                    )}
                                                    {isActive && <Check className="h-3 w-3 text-primary flex-shrink-0" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearAllFilters}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Active filter chips */}
                {activeFilterCount > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                        {[...colorFilter].map((color) => (
                            <Badge key={color} variant="secondary" className="h-6 gap-1 text-xs cursor-pointer" onClick={() => toggleColorFilter(color)}>
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: projectHex(color) }} />
                                {color}
                                <X className="h-2.5 w-2.5" />
                            </Badge>
                        ))}
                        {[...peopleFilter].map((personId) => {
                            const person = allPeople.find((p) => p.id === personId)
                            return (
                                <Badge key={personId} variant="secondary" className="h-6 gap-1 text-xs cursor-pointer" onClick={() => togglePeopleFilter(personId)}>
                                    {person?.name ?? personId}
                                    <X className="h-2.5 w-2.5" />
                                </Badge>
                            )
                        })}
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-1 border-r border-sidebar-border pr-2">
                        <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => setLocalOffsetDays((d) => d - 7)} title="Previous week">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => setLocalOffsetDays(0)}>
                            Today
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => setLocalOffsetDays((d) => d + 7)} title="Next week">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-1 border-r border-sidebar-border pr-2">
                        <Button size="sm" variant="ghost" className="text-xs h-8 px-2"
                            onClick={() => setCollapsed(new Set())}>
                            Expand all
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-8 px-2"
                            onClick={() => setCollapsed(new Set(visibleProjects.map((p) => p.id)))}>
                            Collapse all
                        </Button>
                    </div>
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
                    <div className="flex items-center rounded-md border border-sidebar-border h-8 px-3 text-xs font-medium text-muted-foreground select-none">
                        {mode === "day" ? "Day" : mode === "week" ? "Week" : "Month"}
                    </div>
                </div>
            </div>

            <TimelineContext
                range={range}
                onDragEnd={handleDragEnd as Parameters<typeof TimelineContext>[0]["onDragEnd"]}
                onResizeEnd={handleResizeEnd}
                onRangeChanged={onRangeChanged}
                sidebarWidth={SIDEBAR_WIDTH}
            >
                <GanttBoard
                    visibleProjects={visibleProjects}
                    today={today}
                    range={range}
                    mode={mode}
                    canManage={canManage}
                    holidays={holidays}
                    collapsed={collapsed}
                    onToggleCollapsed={toggleCollapsed}
                    onEditAlloc={(alloc) => setEditAlloc(applyOptimistic(alloc))}
                    onNewAlloc={(projectId, startDate, endDate, rowId) => {
                        setNewAllocDefaults({ projectId, startDate, endDate, rowId })
                        setNewAllocOpen(true)
                    }}
                    applyOptimistic={applyOptimistic}
                    clients={clients}
                    managers={managers}
                />
            </TimelineContext>

            <div className="flex items-center gap-5 text-xs text-muted-foreground pt-2 pb-1 border-t border-sidebar-border/30 mt-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-7 h-3 rounded bg-blue-500/80 border border-blue-500/50 border-solid" />
                    <span>Confirmed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-7 h-3 rounded bg-blue-500/20 border border-blue-500/50 border-dashed" />
                    <span>Tentative</span>
                </div>
                {canManage && (
                    <span className="ml-auto text-muted-foreground/50 text-[11px]">Drag to move · edges to resize · click to edit · click/drag timeline to add</span>
                )}
            </div>

            <AllocationDialog
                open={newAllocOpen}
                onOpenChange={setNewAllocOpen}
                rows={ganttRows}
                projects={projects}
                defaultRowId={newAllocDefaults.rowId}
                defaultStartDate={newAllocDefaults.startDate}
                defaultEndDate={newAllocDefaults.endDate}
                defaultProjectId={newAllocDefaults.projectId}
                holidays={holidays.map((h) => h.date)}
                memberTimeOff={{}}
            />
            {editAlloc && (
                <EditAllocationDialog
                    open={!!editAlloc}
                    onOpenChange={(open) => { if (!open) setEditAlloc(null) }}
                    allocation={{ ...editAlloc, rowId: editAlloc.memberId ?? editAlloc.placeholderId ?? "" }}
                    rows={ganttRows}
                    projects={projects}
                    holidays={holidays.map((h) => h.date)}
                    memberTimeOff={{}}
                />
            )}
        </TooltipProvider>
    )
}
