"use client"

import React, { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRow, useTimelineContext, type Range } from "dnd-timeline"
import { addDays, format } from "date-fns"
import { updateAllocation, deleteAllocation, duplicateAllocation } from "@/app/actions/allocations"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Pencil, Copy, Trash2, RefreshCw, X } from "lucide-react"
import {
    GanttAllocation, GanttProject,
    SIDEBAR_WIDTH, BAR_HEIGHT, BAR_GAP, PROJ_ROW_PAD, DAY_MS, SIX_HOURS_MS,
    getAvatarColors, projectHex, barStyle, countWorkingDays, buildDates,
} from "./GanttTypes"

// ─── Gantt resize drag hook ───────────────────────────────────────────────────

type GanttResizeDragOptions = {
    allocationId: string
    startDate: string
    endDate: string
    direction: "left" | "right"
    range: Range
    containerRef: React.RefObject<HTMLDivElement | null>
    onResizeEnd: (id: string, newStartDate: string, newEndDate: string) => void
}

function useGanttResizeDrag({
    allocationId, startDate, endDate, direction, range, containerRef, onResizeEnd,
}: GanttResizeDragOptions) {
    const { valueToPixels } = useTimelineContext()
    const dragStateRef = useRef<{ startX: number; origDate: string; otherDate: string } | null>(null)

    function onMouseDown(e: React.MouseEvent) {
        e.stopPropagation()
        e.preventDefault()
        document.body.style.userSelect = "none"
        dragStateRef.current = {
            startX: e.clientX,
            origDate: direction === "left" ? startDate : endDate,
            otherDate: direction === "left" ? endDate : startDate,
        }

        function getPxPerDay() {
            const w = containerRef.current?.getBoundingClientRect().width ?? 1
            return (w / (range.end - range.start)) * DAY_MS
        }

        function handleMouseMove(ev: MouseEvent) {
            const ds = dragStateRef.current
            if (!ds) return
            const pxPerDay = getPxPerDay()
            const daysDelta = Math.round((ev.clientX - ds.startX) / pxPerDay)
            const origMs = new Date(ds.origDate + "T00:00:00").getTime()
            let newMs = origMs + daysDelta * DAY_MS
            const otherMs = new Date(ds.otherDate + "T00:00:00").getTime()
            if (direction === "left") newMs = Math.min(newMs, otherMs)
            else newMs = Math.max(newMs, otherMs)
            const newDate = format(new Date(newMs), "yyyy-MM-dd")
            const newStartDate = direction === "left" ? newDate : startDate
            const newEndDate = direction === "right" ? newDate : endDate
            const newStartMs = new Date(newStartDate + "T00:00:00").getTime()
            const newEndMs = new Date(newEndDate + "T00:00:00").getTime() + DAY_MS
            const newLeft = Math.max(0, valueToPixels(newStartMs - range.start))
            const newWidth = Math.max(4, valueToPixels(newEndMs - newStartMs))
            const container = containerRef.current
            if (container) {
                const overlay = container.querySelector(`[data-gantt-resize-id="${allocationId}"]`) as HTMLElement | null
                if (overlay) {
                    overlay.style.left = newLeft + "px"
                    overlay.style.width = newWidth + "px"
                }
            }
        }

        function handleMouseUp(ev: MouseEvent) {
            document.body.style.userSelect = ""
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
            const ds = dragStateRef.current
            dragStateRef.current = null
            if (!ds) return
            const pxPerDay = getPxPerDay()
            const daysDelta = Math.round((ev.clientX - ds.startX) / pxPerDay)
            if (daysDelta === 0) return
            const origMs = new Date(ds.origDate + "T00:00:00").getTime()
            let newMs = origMs + daysDelta * DAY_MS
            const otherMs = new Date(ds.otherDate + "T00:00:00").getTime()
            if (direction === "left") newMs = Math.min(newMs, otherMs)
            else newMs = Math.max(newMs, otherMs)
            const newDate = format(new Date(newMs), "yyyy-MM-dd")
            const newStartDate = direction === "left" ? newDate : startDate
            const newEndDate = direction === "right" ? newDate : endDate
            onResizeEnd(allocationId, newStartDate, newEndDate)
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
    }

    return { onMouseDown }
}

// ─── GanttAllocationResizeOverlay ─────────────────────────────────────────────

type GanttResizeOverlayProps = {
    alloc: GanttAllocation
    stackIdx: number
    range: Range
    canManage: boolean
    containerRef: React.RefObject<HTMLDivElement | null>
    onEditAlloc: (alloc: GanttAllocation) => void
    onResizeEnd: (id: string, newStart: string, newEnd: string) => void
    onDelete: (id: string) => void
}

function GanttAllocationResizeOverlay({
    alloc, stackIdx, range, canManage, containerRef, onEditAlloc, onResizeEnd, onDelete,
}: GanttResizeOverlayProps) {
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

    const { onMouseDown: onLeftDown } = useGanttResizeDrag({
        allocationId: alloc.id, startDate: alloc.startDate, endDate: alloc.endDate,
        direction: "left", range, containerRef, onResizeEnd,
    })
    const { onMouseDown: onRightDown } = useGanttResizeDrag({
        allocationId: alloc.id, startDate: alloc.startDate, endDate: alloc.endDate,
        direction: "right", range, containerRef, onResizeEnd,
    })

    if (!canManage) return null

    return (
        <div
            data-gantt-resize-id={alloc.id}
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

            {/* Delete button */}
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

// ─── GanttPersonRow ───────────────────────────────────────────────────────────

export type GanttPersonRowProps = {
    rowId: string
    personId: string
    personName: string
    personImage: string | null
    isPlaceholder: boolean
    allocs: GanttAllocation[]
    project: GanttProject
    today: string
    range: Range
    canManage: boolean
    holidays: { date: string; name: string }[]
    onEditAlloc: (alloc: GanttAllocation) => void
    onNewAlloc: (projectId: string, startDate?: string, endDate?: string, rowId?: string) => void
}

export function GanttPersonRow({
    rowId, personId, personName, personImage: _personImage, isPlaceholder, allocs, project,
    today, range, canManage, holidays, onEditAlloc, onNewAlloc,
}: GanttPersonRowProps) {
    const router = useRouter()
    const { setNodeRef, rowStyle } = useRow({ id: rowId })
    const { valueToPixels } = useTimelineContext()
    const containerRef = useRef<HTMLDivElement>(null)
    const [openPopover, setOpenPopover] = useState<string | null>(null)
    const [, startPopoverTransition] = useTransition()
    const [optimisticOverrides, setOptimisticOverrides] = useState<Record<string, { startDate: string; endDate: string }>>({})

    function getEffectiveAlloc(a: GanttAllocation): GanttAllocation {
        const u = optimisticOverrides[a.id]
        return u ? { ...a, ...u } : a
    }

    function handleResizeEnd(id: string, newStart: string, newEnd: string) {
        setOptimisticOverrides((prev) => ({ ...prev, [id]: { startDate: newStart, endDate: newEnd } }))
        startPopoverTransition(async () => {
            try {
                await updateAllocation(id, { startDate: newStart, endDate: newEnd })
            } catch {
                setOptimisticOverrides((prev) => { const n = { ...prev }; delete n[id]; return n })
                toast.error("Failed to resize allocation")
            }
        })
    }

    function handleDelete(id: string) {
        startPopoverTransition(async () => {
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
    const todayMs = new Date(today + "T00:00:00").getTime()
    const todayInRange = todayMs >= range.start && todayMs < range.end
    const holidaySet = new Set(holidays.map((h) => h.date))
    const dates = buildDates(range)

    const avgHpd = effectiveAllocs.length > 0
        ? effectiveAllocs.reduce((s, a) => s + a.hoursPerDay, 0) / effectiveAllocs.length
        : 0

    // Row height based on max concurrent allocations per week
    const mondays = dates.filter((d) => new Date(d + "T00:00:00").getDay() === 1)
    let maxStack = 1
    for (const monday of mondays) {
        const weekEnd = format(addDays(new Date(monday + "T00:00:00"), 6), "yyyy-MM-dd")
        const count = effectiveAllocs.filter((a) => a.startDate <= weekEnd && a.endDate >= monday).length
        if (count > maxStack) maxStack = count
    }
    const rowMinHeight = PROJ_ROW_PAD + maxStack * (BAR_HEIGHT + BAR_GAP) + PROJ_ROW_PAD

    // Drag-to-create
    const [dragCreate, setDragCreate] = useState<{ startMs: number; endMs: number; containerRect: DOMRect } | null>(null)
    const dragCreateRef = useRef(dragCreate)
    dragCreateRef.current = dragCreate

    useEffect(() => {
        if (!dragCreate) return
        function handleMouseMove(e: MouseEvent) {
            const dc = dragCreateRef.current
            if (!dc) return
            const ratio = (e.clientX - dc.containerRect.left) / dc.containerRect.width
            setDragCreate((prev) => prev ? { ...prev, endMs: range.start + ratio * (range.end - range.start) } : null)
        }
        function handleMouseUp() {
            const dc = dragCreateRef.current
            if (!dc) return
            const diff = Math.abs(dc.endMs - dc.startMs)
            if (diff > SIX_HOURS_MS) {
                const minMs = Math.min(dc.startMs, dc.endMs)
                const maxMs = Math.max(dc.startMs, dc.endMs)
                onNewAlloc(project.id, format(new Date(minMs), "yyyy-MM-dd"), format(new Date(maxMs), "yyyy-MM-dd"), personId)
            } else {
                onNewAlloc(project.id, format(new Date(dc.startMs), "yyyy-MM-dd"), undefined, personId)
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
        return {
            left: valueToPixels(clampedMin - range.start),
            width: valueToPixels(clampedMax - clampedMin),
            label: `${format(new Date(clampedMin), "MMM d")} → ${format(new Date(clampedMax), "MMM d")}`,
        }
    })() : null

    return (
        <div className="flex border-t border-sidebar-border/30 hover:bg-sidebar/10 transition-colors">
            {/* Sidebar — indented under project header */}
            <div
                className="flex-shrink-0 py-2 pr-3 border-r border-sidebar-border flex items-center gap-2"
                style={{ width: SIDEBAR_WIDTH, paddingLeft: 28 }}
            >
                {isPlaceholder ? (
                    <Avatar className="h-7 w-7 flex-shrink-0 border border-amber-400/60 bg-amber-50 dark:bg-amber-950">
                        <AvatarFallback className="bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-xs font-bold">?</AvatarFallback>
                    </Avatar>
                ) : (
                    <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className={`text-[10px] font-semibold ${getAvatarColors(personName)}`}>
                            {personName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-foreground truncate leading-tight">{personName}</div>
                    {avgHpd > 0 && (
                        <div className="text-[10px] text-muted-foreground/70">
                            {parseFloat(avgHpd.toFixed(1))}h/d
                        </div>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div
                ref={(el) => { setNodeRef(el); (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el }}
                style={{ ...rowStyle, minHeight: rowMinHeight, overflow: "hidden" }}
                className="flex-1 cursor-default"
                onMouseDown={(e) => {
                    if (!canManage) return
                    if (e.button !== 0) return
                    if ((e.target as HTMLElement).closest("[data-bar]")) return
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                    const ratio = (e.clientX - rect.left) / rect.width
                    const clickedMs = range.start + ratio * (range.end - range.start)
                    const clickedDate = format(new Date(clickedMs), "yyyy-MM-dd")
                    const clickedDow = new Date(clickedDate + "T12:00:00").getDay()
                    if (clickedDow === 0 || clickedDow === 6 || holidaySet.has(clickedDate)) return
                    setDragCreate({ startMs: clickedMs, endMs: clickedMs, containerRect: rect })
                }}
            >
                {/* Day column backgrounds */}
                {dates.map((dateStr) => {
                    const d = new Date(dateStr + "T00:00:00")
                    const dow = d.getDay()
                    const isWeekend = dow === 0 || dow === 6
                    const isHoliday = holidaySet.has(dateStr)
                    const isToday = dateStr === today
                    const left = valueToPixels(d.getTime() - range.start)
                    const width = valueToPixels(DAY_MS)
                    return (
                        <div
                            key={dateStr}
                            className={`absolute top-0 bottom-0 border-r border-sidebar-border/10 ${isHoliday || isWeekend ? "cursor-not-allowed" : "pointer-events-none"} ${isToday ? "outline outline-1 outline-primary/20 outline-inset" : ""}`}
                            style={{
                                left: left + "px", width: width + "px",
                                ...(isHoliday
                                    ? { backgroundColor: "rgba(239,68,68,0.05)", backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(239,68,68,0.12) 4px,rgba(239,68,68,0.12) 8px)" }
                                    : isWeekend
                                    ? { backgroundColor: "rgba(0,0,0,0.03)", backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.05) 4px,rgba(0,0,0,0.05) 8px)" }
                                    : {}),
                            }}
                            onMouseDown={(e) => {
                                if (isHoliday || isWeekend) { e.stopPropagation(); e.preventDefault() }
                            }}
                        />
                    )
                })}

                {todayInRange && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-primary/40 z-10 pointer-events-none"
                        style={{ left: valueToPixels(todayMs - range.start) + "px" }} />
                )}

                {/* Per-week Mon–Fri bars — mirrors PersonProjectRow exactly */}
                {mondays.map((monday) => {
                    const monMs = new Date(monday + "T00:00:00").getTime()
                    if (monMs >= range.end) return null
                    const weekEnd = format(addDays(new Date(monday + "T00:00:00"), 6), "yyyy-MM-dd")
                    const friEndMs = monMs + 5 * DAY_MS
                    const activeAllocs = effectiveAllocs.filter((a) => a.startDate <= weekEnd && a.endDate >= monday)
                    return activeAllocs.map((alloc, stackIdx) => {
                        const allocStartMs = new Date(alloc.startDate + "T00:00:00").getTime()
                        const allocEndMs = new Date(alloc.endDate + "T00:00:00").getTime() + DAY_MS
                        const barStart = Math.max(allocStartMs, monMs, range.start)
                        const barEnd = Math.min(allocEndMs, friEndMs, range.end)
                        if (barStart >= barEnd) return null
                        const left = valueToPixels(barStart - range.start)
                        const width = valueToPixels(barEnd - barStart)
                        const isSoft = alloc.type === "SOFT"
                        const isTentative = !!project.isTentative
                        const weekWorkDays = countWorkingDays(
                            alloc.startDate > monday ? alloc.startDate : monday,
                            alloc.endDate < weekEnd ? alloc.endDate : weekEnd,
                        )
                        const weekHours = parseFloat((weekWorkDays * alloc.hoursPerDay).toFixed(1))
                        const totalWorkDays = countWorkingDays(alloc.startDate, alloc.endDate)
                        const totalAllocHours = parseFloat((totalWorkDays * alloc.hoursPerDay).toFixed(1))
                        const isPopoverOpen = openPopover === alloc.id
                        return (
                            <Popover key={`${monday}-${alloc.id}`} open={isPopoverOpen} onOpenChange={(open) => setOpenPopover(open ? alloc.id : null)}>
                                <PopoverTrigger asChild>
                                    <div
                                        data-bar
                                        className={`absolute border pointer-events-none rounded flex items-center justify-center select-none text-[10px] font-semibold
                                            ${isSoft || isTentative ? "border-dashed" : "border-solid"}
                                            ${isTentative ? "opacity-60" : ""}`}
                                        style={{
                                            left: left + 2 + "px",
                                            width: width - 4 + "px",
                                            top: PROJ_ROW_PAD + stackIdx * (BAR_HEIGHT + BAR_GAP),
                                            height: BAR_HEIGHT - 2,
                                            ...barStyle(project.color, isSoft),
                                        }}
                                    >
                                        <span className="truncate px-1.5 pointer-events-none">
                                            {parseFloat(alloc.hoursPerDay.toFixed(2))}h/d
                                            {weekHours > 0 ? ` · ${weekHours}h` : ""}
                                        </span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="center" className="w-72 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                                    <div className="p-3 space-y-2.5">
                                        {/* Project header */}
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: projectHex(project.color) }} />
                                            <div className="min-w-0">
                                                <div className="font-semibold text-sm truncate">{project.name}</div>
                                                {project.clientName && <div className="text-xs text-muted-foreground truncate">{project.clientName}</div>}
                                            </div>
                                        </div>
                                        {/* Person */}
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6 flex-shrink-0">
                                                <AvatarFallback className={`text-[9px] font-semibold ${getAvatarColors(personName)}`}>
                                                    {personName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium truncate">{personName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {format(new Date(alloc.startDate + "T12:00:00"), "MMM d")} → {format(new Date(alloc.endDate + "T12:00:00"), "MMM d")} · {totalWorkDays} working day{totalWorkDays !== 1 ? "s" : ""}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Hours & type */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-medium">{parseFloat(alloc.hoursPerDay.toFixed(2))}h/d · {totalAllocHours}h total</span>
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                                                isSoft
                                                    ? "border-violet-400 text-violet-600 bg-violet-50 dark:bg-violet-950 dark:text-violet-400"
                                                    : "border-green-400 text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400"
                                            }`}>
                                                {isSoft ? "Tentative" : "Confirmed"}
                                            </span>
                                        </div>
                                        {/* Notes */}
                                        {alloc.notes && (
                                            <p className="text-xs text-muted-foreground italic">{alloc.notes}</p>
                                        )}
                                        {/* Actions */}
                                        {canManage && (
                                            <div className="flex items-center gap-1 pt-1 border-t border-sidebar-border">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 text-xs gap-1 px-2"
                                                    onClick={() => { setOpenPopover(null); onEditAlloc(alloc) }}
                                                >
                                                    <Pencil className="h-3 w-3" /> Edit
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 text-xs gap-1 px-2"
                                                    onClick={() => {
                                                        setOpenPopover(null)
                                                        startPopoverTransition(async () => {
                                                            try {
                                                                await duplicateAllocation(alloc.id)
                                                                toast.success("Allocation duplicated")
                                                            } catch { toast.error("Failed to duplicate allocation") }
                                                        })
                                                    }}
                                                >
                                                    <Copy className="h-3 w-3" /> Duplicate
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 text-xs gap-1 px-2"
                                                    onClick={() => {
                                                        setOpenPopover(null)
                                                        const newType = alloc.type === "SOFT" ? "HARD" : "SOFT"
                                                        startPopoverTransition(async () => {
                                                            try {
                                                                await updateAllocation(alloc.id, { type: newType })
                                                                toast.success(`Changed to ${newType === "SOFT" ? "Tentative" : "Confirmed"}`)
                                                            } catch { toast.error("Failed to update type") }
                                                        })
                                                    }}
                                                >
                                                    <RefreshCw className="h-3 w-3" /> {alloc.type === "SOFT" ? "Confirm" : "Soften"}
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 text-xs gap-1 px-2 text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        setOpenPopover(null)
                                                        startPopoverTransition(async () => {
                                                            try {
                                                                await deleteAllocation(alloc.id)
                                                                toast.success("Allocation deleted")
                                                                router.refresh()
                                                            } catch { toast.error("Failed to delete allocation") }
                                                        })
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3" /> Delete
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )
                    })
                })}

                {/* Full-span resize overlays — one per unique allocation */}
                {canManage && (() => {
                    const seen = new Set<string>()
                    return mondays.flatMap((monday) => {
                        const weekEnd = format(addDays(new Date(monday + "T00:00:00"), 6), "yyyy-MM-dd")
                        const activeAllocs = effectiveAllocs.filter((a) => a.startDate <= weekEnd && a.endDate >= monday)
                        return activeAllocs.map((alloc, stackIdx) => {
                            if (seen.has(alloc.id)) return null
                            seen.add(alloc.id)
                            return (
                                <GanttAllocationResizeOverlay
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
