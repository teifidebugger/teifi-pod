"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTimelineContext } from "dnd-timeline"
import { addDays, format } from "date-fns"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { X } from "lucide-react"
import { updateAllocation, deleteAllocation } from "@/app/actions/allocations"
import { toast } from "sonner"
import { COLOR_HEX_MAP } from "@/lib/project-colors"
import type { Allocation } from "./schedule-types"
import { SIDEBAR_WIDTH, BAR_HEIGHT, BAR_GAP, PROJ_ROW_PAD, DAY_MS, SIX_HOURS_MS } from "./schedule-types"
import type { Range } from "dnd-timeline"

// ─── Color helpers ────────────────────────────────────────────────────────────

/** Returns the hex color for a project based on its assigned color key. */
export function projectHex(colorKey: string | null | undefined): string {
    return COLOR_HEX_MAP[colorKey ?? "blue"] ?? "#3b82f6"
}

/** Inline style object for an allocation bar (hard or soft). */
export function barStyle(colorKey: string | null | undefined, isSoft: boolean): React.CSSProperties {
    const hex = projectHex(colorKey)
    return isSoft
        ? { backgroundColor: `${hex}30`, borderColor: hex, color: hex }
        : { backgroundColor: `${hex}cc`, borderColor: `${hex}99`, color: "#ffffff" }
}

// ─── countWorkingDays ─────────────────────────────────────────────────────────

export function countWorkingDays(start: string, end: string): number {
    if (!start || !end || end < start) return 0
    const s = new Date(start + "T00:00:00")
    const e = new Date(end + "T00:00:00")
    let count = 0
    const cur = new Date(s)
    while (cur <= e) {
        const dow = cur.getDay()
        if (dow !== 0 && dow !== 6) count++
        cur.setDate(cur.getDate() + 1)
    }
    return count
}

// ─── useResizeDrag ────────────────────────────────────────────────────────────

type ResizeDragOptions = {
    allocationId: string
    startDate: string
    endDate: string
    direction: "left" | "right"
    range: Range
    containerRef: React.RefObject<HTMLDivElement | null>
    onResizeEnd: (id: string, newStartDate: string, newEndDate: string) => void
}

export function useResizeDrag({
    allocationId, startDate, endDate, direction, range, containerRef, onResizeEnd,
}: ResizeDragOptions) {
    const dragStateRef = useRef<{
        startX: number
        origDate: string
        otherDate: string
        containerWidth: number
    } | null>(null)
    const { valueToPixels } = useTimelineContext()

    const pixelsPerMs = containerRef.current
        ? containerRef.current.getBoundingClientRect().width / (range.end - range.start)
        : 0
    const msPerDay = DAY_MS
    const pixelsPerDay = pixelsPerMs * msPerDay

    function onMouseDown(e: React.MouseEvent) {
        e.stopPropagation()
        e.preventDefault()
        const container = containerRef.current
        if (!container) return
        document.body.style.userSelect = "none"
        dragStateRef.current = {
            startX: e.clientX,
            origDate: direction === "left" ? startDate : endDate,
            otherDate: direction === "left" ? endDate : startDate,
            containerWidth: container.getBoundingClientRect().width,
        }

        function handleMouseMove(ev: MouseEvent) {
            const ds = dragStateRef.current
            if (!ds) return
            const container = containerRef.current
            if (!container) return
            const containerWidth = container.getBoundingClientRect().width
            const pxPerMs = containerWidth / (range.end - range.start)
            const pxPerDay = pxPerMs * msPerDay
            const deltaX = ev.clientX - ds.startX
            const daysDelta = Math.round(deltaX / pxPerDay)
            if (daysDelta === 0) return

            const origMs = new Date(ds.origDate + "T00:00:00").getTime()
            let newMs = origMs + daysDelta * msPerDay

            // Clamp: don't cross the other date
            const otherMs = new Date(ds.otherDate + "T00:00:00").getTime()
            if (direction === "left") {
                newMs = Math.min(newMs, otherMs)
            } else {
                newMs = Math.max(newMs, otherMs)
            }

            const newDate = format(new Date(newMs), "yyyy-MM-dd")

            // Compute new full-span pixel positions and update overlay DOM directly
            const newStartDate = direction === "left" ? newDate : startDate
            const newEndDate = direction === "right" ? newDate : endDate
            const newStartMs = new Date(newStartDate + "T00:00:00").getTime()
            const newEndMs = new Date(newEndDate + "T00:00:00").getTime() + msPerDay

            const newLeft = Math.max(0, valueToPixels(newStartMs - range.start))
            const newWidth = Math.max(4, valueToPixels(newEndMs - newStartMs))

            // Find and update the overlay div directly (keyed by data-resize-id)
            const overlay = container.querySelector(`[data-resize-id="${allocationId}"]`) as HTMLElement | null
            if (overlay) {
                overlay.style.left = newLeft + "px"
                overlay.style.width = newWidth + "px"
            }
        }

        function handleMouseUp(ev: MouseEvent) {
            document.body.style.userSelect = ""
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)

            const ds = dragStateRef.current
            dragStateRef.current = null
            if (!ds) return

            const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 1
            const pxPerMs = containerWidth / (range.end - range.start)
            const pxPerDay = pxPerMs * msPerDay
            const deltaX = ev.clientX - ds.startX
            const daysDelta = Math.round(deltaX / pxPerDay)
            if (daysDelta === 0) return

            const origMs = new Date(ds.origDate + "T00:00:00").getTime()
            let newMs = origMs + daysDelta * msPerDay
            const otherMs = new Date(ds.otherDate + "T00:00:00").getTime()
            if (direction === "left") {
                newMs = Math.min(newMs, otherMs)
            } else {
                newMs = Math.max(newMs, otherMs)
            }
            const newDate = format(new Date(newMs), "yyyy-MM-dd")
            const newStartDate = direction === "left" ? newDate : startDate
            const newEndDate = direction === "right" ? newDate : endDate
            onResizeEnd(allocationId, newStartDate, newEndDate)
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
    }

    // Suppress: pixelsPerDay computed but not used directly — used in handlers via closure
    void pixelsPerDay

    return { onMouseDown }
}

// ─── AllocationResizeOverlay ──────────────────────────────────────────────────

type AllocationResizeOverlayProps = {
    alloc: Allocation
    stackIdx: number
    range: Range
    canManage: boolean
    containerRef: React.RefObject<HTMLDivElement | null>
    onEditAlloc: (alloc: Allocation) => void
    onResizeEnd: (id: string, newStart: string, newEnd: string) => void
    onDelete: (id: string) => void
}

export function AllocationResizeOverlay({
    alloc, stackIdx, range, canManage, containerRef, onEditAlloc, onResizeEnd, onDelete,
}: AllocationResizeOverlayProps) {
    const { valueToPixels } = useTimelineContext()

    const startMs = new Date(alloc.startDate + "T00:00:00").getTime()
    const endMs = new Date(alloc.endDate + "T00:00:00").getTime() + DAY_MS

    const clampedStart = Math.max(startMs, range.start)
    const clampedEnd = Math.min(endMs, range.end)
    if (clampedStart >= clampedEnd) return null

    const left = valueToPixels(clampedStart - range.start)
    const width = valueToPixels(clampedEnd - clampedStart)
    const top = PROJ_ROW_PAD + stackIdx * (BAR_HEIGHT + BAR_GAP)
    const height = BAR_HEIGHT - 2

    const { onMouseDown: onLeftDown } = useResizeDrag({
        allocationId: alloc.id,
        startDate: alloc.startDate,
        endDate: alloc.endDate,
        direction: "left",
        range,
        containerRef,
        onResizeEnd,
    })

    const { onMouseDown: onRightDown } = useResizeDrag({
        allocationId: alloc.id,
        startDate: alloc.startDate,
        endDate: alloc.endDate,
        direction: "right",
        range,
        containerRef,
        onResizeEnd,
    })

    if (!canManage) return null

    return (
        <div
            data-resize-id={alloc.id}
            data-bar
            className="absolute z-20 group/overlay"
            style={{ left: left + "px", width: width + "px", top, height, pointerEvents: "none" }}
        >
            {/* Left resize handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-col-resize opacity-0 group-hover/overlay:opacity-100 transition-opacity rounded-l hover:bg-black/20 z-10"
                style={{ pointerEvents: "all" }}
                onMouseDown={onLeftDown}
            >
                <div className="flex flex-col gap-[2px]">
                    <div className="w-[2px] h-2.5 rounded-full bg-current opacity-60" />
                    <div className="w-[2px] h-2.5 rounded-full bg-current opacity-60 -mt-1" />
                </div>
            </div>

            {/* Right resize handle */}
            <div
                className="absolute right-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-col-resize opacity-0 group-hover/overlay:opacity-100 transition-opacity rounded-r hover:bg-black/20 z-10"
                style={{ pointerEvents: "all" }}
                onMouseDown={onRightDown}
            >
                <div className="flex flex-col gap-[2px]">
                    <div className="w-[2px] h-2.5 rounded-full bg-current opacity-60" />
                    <div className="w-[2px] h-2.5 rounded-full bg-current opacity-60 -mt-1" />
                </div>
            </div>

            {/* Delete (✕) button — top-right corner */}
            <button
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover/overlay:opacity-100 transition-opacity hover:scale-110 z-20 shadow-sm"
                style={{ pointerEvents: "all" }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onDelete(alloc.id) }}
                title="Delete allocation"
            >
                <X className="h-2.5 w-2.5" />
            </button>

            {/* Click-to-edit center zone */}
            <div
                className="absolute inset-0 mx-3"
                style={{ pointerEvents: "all" }}
                onClick={(e) => { e.stopPropagation(); onEditAlloc(alloc) }}
            />
        </div>
    )
}

// ─── PersonProjectRow ─────────────────────────────────────────────────────────

type PersonProjectRowProps = {
    rowId: string
    projectId: string
    personRowId: string
    projectName: string
    clientName: string | null
    allocs: Allocation[]
    dates: string[]
    range: Range
    canManage: boolean
    onEditAlloc: (alloc: Allocation) => void
    onNewAlloc: (rowId: string, startDate?: string, endDate?: string, projectId?: string) => void
}

export function PersonProjectRow({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rowId: _rowId, projectId, personRowId, projectName, clientName, allocs, dates, range, canManage, onEditAlloc, onNewAlloc,
}: PersonProjectRowProps) {
    const router = useRouter()
    const { valueToPixels } = useTimelineContext()
    const containerRef = useRef<HTMLDivElement>(null)
    const [, startResizeTransition] = useTransition()
    const [optimisticOverrides, setOptimisticOverrides] = useState<Record<string, { startDate: string; endDate: string }>>({})

    function getEffectiveAlloc(alloc: Allocation): Allocation {
        const u = optimisticOverrides[alloc.id]
        return u ? { ...alloc, ...u } : alloc
    }

    function handleResizeEnd(id: string, newStart: string, newEnd: string) {
        setOptimisticOverrides((prev) => ({ ...prev, [id]: { startDate: newStart, endDate: newEnd } }))
        startResizeTransition(async () => {
            try {
                await updateAllocation(id, { startDate: newStart, endDate: newEnd })
            } catch {
                setOptimisticOverrides((prev) => { const n = { ...prev }; delete n[id]; return n })
                toast.error("Failed to resize allocation")
            }
        })
    }

    function handleDelete(id: string) {
        startResizeTransition(async () => {
            try {
                await deleteAllocation(id)
                toast.success("Allocation deleted")
                router.refresh()
            } catch {
                toast.error("Failed to delete allocation")
            }
        })
    }

    const effectiveAllocs = allocs.map(getEffectiveAlloc)
    const hex = projectHex(effectiveAllocs[0]?.project.color)

    // Compute max concurrent allocations per week to size row height
    const mondays = dates.filter(d => new Date(d + "T00:00:00").getDay() === 1)
    let maxStack = 1
    for (const monday of mondays) {
        const weekEnd = format(addDays(new Date(monday + "T00:00:00"), 6), "yyyy-MM-dd")
        const count = effectiveAllocs.filter(a => a.startDate <= weekEnd && a.endDate >= monday).length
        if (count > maxStack) maxStack = count
    }

    const rowMinHeight = PROJ_ROW_PAD + maxStack * (BAR_HEIGHT + BAR_GAP) + PROJ_ROW_PAD

    // Drag-to-create state
    const [dragCreate, setDragCreate] = useState<{ startMs: number; endMs: number; containerRect: DOMRect } | null>(null)
    const dragCreateRef = useRef(dragCreate)
    dragCreateRef.current = dragCreate

    useEffect(() => {
        if (!dragCreate) return
        function handleMouseMove(e: MouseEvent) {
            const dc = dragCreateRef.current
            if (!dc) return
            const relX = e.clientX - dc.containerRect.left
            const ratio = relX / dc.containerRect.width
            setDragCreate((prev) => prev ? { ...prev, endMs: range.start + ratio * (range.end - range.start) } : null)
        }
        function handleMouseUp() {
            const dc = dragCreateRef.current
            if (!dc) return
            const diff = Math.abs(dc.endMs - dc.startMs)
            if (diff > SIX_HOURS_MS) {
                const minMs = Math.min(dc.startMs, dc.endMs)
                const maxMs = Math.max(dc.startMs, dc.endMs)
                onNewAlloc(personRowId, format(new Date(minMs), "yyyy-MM-dd"), format(new Date(maxMs), "yyyy-MM-dd"), projectId)
            } else {
                onNewAlloc(personRowId, format(new Date(dc.startMs), "yyyy-MM-dd"), undefined, projectId)
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

    const isTentativeProject = !!effectiveAllocs[0]?.project.isTentative

    return (
        <div className="flex border-t border-sidebar-border/30 hover:bg-sidebar/10 transition-colors">
            {/* Sidebar — colored left swatch + right-aligned text */}
            <div
                className="flex-shrink-0 border-r border-sidebar-border/50 flex flex-col justify-center items-end py-1.5 pr-3 min-w-0 relative"
                style={{ width: SIDEBAR_WIDTH, paddingLeft: 56 }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r-sm"
                    style={{
                        backgroundColor: hex,
                        ...(isTentativeProject ? { backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(255,255,255,0.4) 3px,rgba(255,255,255,0.4) 6px)" } : {}),
                    }}
                />
                {clientName && (
                    <div className="text-[10px] text-muted-foreground/60 truncate w-full text-right leading-tight">{clientName}</div>
                )}
                <div className="flex items-center justify-end gap-1 w-full">
                    {isTentativeProject && (
                        <span className="text-[9px] px-1 py-0.5 rounded border border-violet-400 text-violet-500 bg-violet-50 dark:bg-violet-950 flex-shrink-0">Pipeline</span>
                    )}
                    <Link
                        href={`/schedule?view=projects&projectId=${encodeURIComponent(projectId)}`}
                        className="text-xs font-medium truncate text-right leading-snug hover:underline"
                        style={{ color: hex }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {projectName}
                    </Link>
                </div>
            </div>

            {/* Timeline — per-week cells, week-aligned like collapsed mode */}
            <div
                ref={containerRef}
                className="flex-1 relative overflow-hidden cursor-default"
                style={{ minHeight: rowMinHeight }}
                onMouseDown={(e) => {
                    if (!canManage) return
                    if (e.button !== 0) return
                    if ((e.target as HTMLElement).closest("[data-bar]")) return
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                    const ratio = (e.clientX - rect.left) / rect.width
                    const clickedMs = range.start + ratio * (range.end - range.start)
                    const clickedDate = format(new Date(clickedMs), "yyyy-MM-dd")
                    const clickedDow = new Date(clickedDate + "T12:00:00").getDay()
                    if (clickedDow === 0 || clickedDow === 6) return
                    setDragCreate({ startMs: clickedMs, endMs: clickedMs, containerRect: rect })
                }}
            >
                {/* Day grid lines */}
                {dates.map((dateStr) => {
                    const d = new Date(dateStr + "T00:00:00")
                    const left = valueToPixels(d.getTime() - range.start)
                    const width = valueToPixels(DAY_MS)
                    const dow = d.getDay()
                    const isWeekend = dow === 0 || dow === 6
                    return (
                        <div key={dateStr}
                            className={`absolute top-0 bottom-0 border-r border-sidebar-border/10 ${isWeekend ? "cursor-not-allowed" : "pointer-events-none"}`}
                            style={{
                                left: left + "px",
                                width: width + "px",
                                ...(isWeekend ? { backgroundColor: "rgba(0,0,0,0.03)", backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.05) 4px,rgba(0,0,0,0.05) 8px)" } : {}),
                            }}
                            onMouseDown={(e) => { if (isWeekend) { e.stopPropagation(); e.preventDefault() } }}
                        />
                    )
                })}

                {/* Per-week allocation cells */}
                {mondays.map(monday => {
                    const monMs = new Date(monday + "T00:00:00").getTime()
                    if (monMs >= range.end) return null
                    const weekEnd = format(addDays(new Date(monday + "T00:00:00"), 6), "yyyy-MM-dd")
                    const friEndMs = monMs + 5 * DAY_MS
                    const activeAllocs = effectiveAllocs.filter(a => a.startDate <= weekEnd && a.endDate >= monday)
                    return activeAllocs.map((alloc, stackIdx) => {
                        const isSoft = alloc.type === "SOFT"
                        const isAllocTentativeProject = !!alloc.project.isTentative
                        // Compute bar bounds from actual allocation dates, clamped to this Mon–Fri and range
                        const allocStartMs = new Date(alloc.startDate + "T00:00:00").getTime()
                        const allocEndMs = new Date(alloc.endDate + "T00:00:00").getTime() + DAY_MS
                        const barStart = Math.max(allocStartMs, monMs, range.start)
                        const barEnd = Math.min(allocEndMs, friEndMs, range.end)
                        if (barStart >= barEnd) return null
                        const left = valueToPixels(barStart - range.start)
                        const width = valueToPixels(barEnd - barStart)
                        const weekWorkDays = countWorkingDays(
                            alloc.startDate > monday ? alloc.startDate : monday,
                            alloc.endDate < weekEnd ? alloc.endDate : weekEnd,
                        )
                        const weekHours = parseFloat((weekWorkDays * alloc.hoursPerDay).toFixed(1))
                        return (
                            <Tooltip key={`${monday}-${alloc.id}`}>
                                <TooltipTrigger asChild>
                                    <div
                                        data-bar
                                        className={`absolute border pointer-events-none rounded flex items-center justify-center select-none text-[10px] font-semibold
                                            ${isSoft || isAllocTentativeProject ? "border-dashed" : "border-solid"}
                                            ${isAllocTentativeProject ? "opacity-60" : ""}`}
                                        style={{
                                            left: left + 2 + "px",
                                            width: width - 4 + "px",
                                            top: PROJ_ROW_PAD + stackIdx * (BAR_HEIGHT + BAR_GAP),
                                            height: BAR_HEIGHT - 2,
                                            ...barStyle(alloc.project.color, isSoft),
                                        }}
                                    >
                                        <span className="truncate px-1.5 pointer-events-none">
                                            {parseFloat(alloc.hoursPerDay.toFixed(2))}h/d
                                            {weekHours > 0 ? ` · ${weekHours}h` : ""}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                    <div className="space-y-1">
                                        <p className="font-semibold">{alloc.project.name}</p>
                                        <p className="text-xs text-muted-foreground">{alloc.startDate} → {alloc.endDate}</p>
                                        <p className="text-xs">{parseFloat(alloc.hoursPerDay.toFixed(2))}h/d · {isSoft ? "Tentative" : "Confirmed"}</p>
                                        {alloc.notes && <p className="text-xs text-muted-foreground">{alloc.notes}</p>}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })
                })}

                {/* Full-span resize overlays — one per unique allocation */}
                {canManage && (() => {
                    // Deduplicate by alloc.id — one overlay per allocation regardless of week segments
                    const seen = new Set<string>()
                    return mondays.flatMap(monday => {
                        const weekEnd = format(addDays(new Date(monday + "T00:00:00"), 6), "yyyy-MM-dd")
                        const activeAllocs = effectiveAllocs.filter(a => a.startDate <= weekEnd && a.endDate >= monday)
                        return activeAllocs.map((alloc, stackIdx) => {
                            if (seen.has(alloc.id)) return null
                            seen.add(alloc.id)
                            return (
                                <AllocationResizeOverlay
                                    key={`overlay-${alloc.id}`}
                                    alloc={alloc}
                                    stackIdx={stackIdx}
                                    range={range}
                                    canManage={canManage}
                                    containerRef={containerRef}
                                    onEditAlloc={onEditAlloc}
                                    onResizeEnd={handleResizeEnd}
                                    onDelete={handleDelete}
                                />
                            )
                        })
                    })
                })()}

                {effectiveAllocs.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-start pl-3 text-xs text-muted-foreground/20 pointer-events-none">
                        {canManage ? "Drag to add" : ""}
                    </div>
                )}

                {/* Ghost bar for drag-to-create */}
                {ghostBar && ghostBar.width > 2 && (
                    <div
                        className="absolute z-30 opacity-60 bg-primary/40 border-2 border-primary border-dashed rounded flex items-center justify-center pointer-events-none select-none"
                        style={{ left: ghostBar.left + "px", width: ghostBar.width + "px", top: PROJ_ROW_PAD, height: BAR_HEIGHT - 2 }}
                    >
                        <span className="text-[10px] font-medium text-primary truncate px-1">{ghostBar.label}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
