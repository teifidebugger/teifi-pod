"use client"

import React, { useState } from "react"
import { addDays } from "date-fns"
import { useTimelineContext, type Range } from "dnd-timeline"
import { updateProjectStatus, deleteProject } from "@/app/actions/projects"
import { shiftProjectAllocations } from "@/app/actions/allocations"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ChevronDown, ChevronRight, Plus, UserPlus, Pencil, Trash2, MoreHorizontal, Archive, CalendarRange, ExternalLink } from "lucide-react"
import { ProjectForm } from "@/app/projects/ProjectForm"
import {
    GanttAllocation, GanttProject, ClientOption, ManagerOption,
    SIDEBAR_WIDTH, DAY_MS,
    getAvatarColors, projectHex, buildDates, groupByPerson,
} from "./GanttTypes"
import { GanttPersonRow } from "./GanttPersonRow"

// ─── GanttProjectSection ─────────────────────────────────────────────────────

type GanttProjectSectionProps = {
    project: GanttProject
    isExpanded: boolean
    onToggle: () => void
    today: string
    range: Range
    canManage: boolean
    holidays: { date: string; name: string }[]
    onEditAlloc: (alloc: GanttAllocation) => void
    onNewAlloc: (projectId: string, startDate?: string, endDate?: string, rowId?: string) => void
    applyOptimistic: (alloc: GanttAllocation) => GanttAllocation
    clients: ClientOption[]
    managers: ManagerOption[]
}

export function GanttProjectSection({
    project, isExpanded, onToggle, today, range, canManage, holidays,
    onEditAlloc, onNewAlloc, applyOptimistic, clients, managers,
}: GanttProjectSectionProps) {
    const allAllocs = project.allocations.map(applyOptimistic)
    const personGroups = isExpanded
        ? groupByPerson(allAllocs.filter((a) => a.endDate >= today))
        : []

    return (
        <>
            <GanttProjectHeaderRow
                project={project}
                isExpanded={isExpanded}
                onToggle={onToggle}
                today={today}
                range={range}
                canManage={canManage}
                holidays={holidays}
                onNewAlloc={onNewAlloc}
                allAllocs={allAllocs}
                clients={clients}
                managers={managers}
            />
            {isExpanded && personGroups.map(({ personId, personName, image, isPlaceholder, allocs }) => (
                <GanttPersonRow
                    key={`${project.id}::${personId}`}
                    rowId={`${project.id}::${personId}`}
                    personId={personId}
                    personName={personName}
                    personImage={image}
                    isPlaceholder={isPlaceholder}
                    allocs={allocs}
                    project={project}
                    today={today}
                    range={range}
                    canManage={canManage}
                    holidays={holidays}
                    onEditAlloc={onEditAlloc}
                    onNewAlloc={onNewAlloc}
                />
            ))}
            {isExpanded && canManage && (
                <GanttProjectFooter project={project} onNewAlloc={onNewAlloc} />
            )}
        </>
    )
}

// ─── GanttProjectHeaderRow ───────────────────────────────────────────────────

type GanttProjectHeaderRowProps = {
    project: GanttProject
    isExpanded: boolean
    onToggle: () => void
    today: string
    range: Range
    canManage: boolean
    holidays: { date: string; name: string }[]
    onNewAlloc: (projectId: string, startDate?: string, endDate?: string, rowId?: string) => void
    allAllocs: GanttAllocation[]
    clients: ClientOption[]
    managers: ManagerOption[]
}

function GanttProjectHeaderRow({
    project, isExpanded, onToggle, today, range, canManage, holidays, onNewAlloc, allAllocs,
    clients, managers,
}: GanttProjectHeaderRowProps) {
    const { valueToPixels } = useTimelineContext()
    const hex = projectHex(project.color)
    const todayMs = new Date(today + "T00:00:00").getTime()
    const todayInRange = todayMs >= range.start && todayMs < range.end
    const holidaySet = new Set(holidays.map((h) => h.date))
    const dates = buildDates(range)

    const personGroups = groupByPerson(allAllocs)
    const peopleCount = personGroups.length
    const totalHpd = personGroups.reduce((s, g) => {
        const avg = g.allocs.reduce((a, b) => a + b.hoursPerDay, 0) / g.allocs.length
        return s + avg
    }, 0)

    const summaryBar = allAllocs.length > 0 ? (() => {
        const minStart = allAllocs.reduce((m, a) => a.startDate < m ? a.startDate : m, allAllocs[0].startDate)
        const maxEnd = allAllocs.reduce((m, a) => a.endDate > m ? a.endDate : m, allAllocs[0].endDate)
        const startMs = Math.max(new Date(minStart + "T00:00:00").getTime(), range.start)
        const endMs = Math.min(addDays(new Date(maxEnd + "T00:00:00"), 1).getTime(), range.end)
        if (startMs >= endMs) return null
        return {
            left: valueToPixels(startMs - range.start),
            width: valueToPixels(endMs - startMs),
        }
    })() : null

    // Actions state
    const [editOpen, setEditOpen] = useState(false)
    const [shiftOpen, setShiftOpen] = useState(false)
    const [shiftDays, setShiftDays] = useState("7")
    const [shifting, setShifting] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    async function handleShift() {
        const d = parseInt(shiftDays, 10)
        if (!d || isNaN(d)) return
        setShifting(true)
        try {
            await shiftProjectAllocations(project.id, d)
            toast.success(`Timeline shifted ${d > 0 ? "+" : ""}${d} days`)
            setShiftOpen(false)
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to shift timeline")
        } finally {
            setShifting(false)
        }
    }

    async function handleArchive() {
        try {
            await updateProjectStatus(project.id, "ARCHIVED")
            toast.success("Project archived")
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to archive project")
        }
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            const fd = new FormData()
            fd.append("id", project.id)
            await deleteProject(fd)
            toast.success("Project deleted")
            setDeleteOpen(false)
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to delete project")
            setDeleteOpen(false)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <>
        <div className={`flex group transition-colors ${isExpanded ? "bg-sidebar/20" : "hover:bg-sidebar/10"}`}>
            {/* Sidebar */}
            <div
                className="flex-shrink-0 px-3 py-2.5 border-r border-sidebar-border flex items-center gap-2 relative"
                style={{ width: SIDEBAR_WIDTH }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r-sm"
                    style={{
                        backgroundColor: hex,
                        ...(project.isTentative ? { backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(255,255,255,0.4) 3px,rgba(255,255,255,0.4) 6px)" } : {}),
                    }}
                />
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
                <div className="min-w-0 flex-1">
                    {project.clientName && (
                        <div className="text-[10px] text-muted-foreground/70 truncate leading-none mb-0.5">{project.clientName}</div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm text-foreground truncate leading-tight">{project.name}</span>
                        {project.isTentative && (
                            <span className="text-[9px] px-1 py-0.5 rounded border border-violet-400/60 text-violet-500 bg-violet-50 dark:bg-violet-950 flex-shrink-0">PIPELINE</span>
                        )}
                    </div>
                    {peopleCount > 0 && (
                        <div className="mt-1 flex items-center gap-1.5">
                            {!isExpanded && (
                                <div className="flex items-center">
                                    {personGroups.slice(0, 4).map((g, i) => (
                                        <Avatar key={g.personId} className="h-4 w-4 ring-1 ring-background" style={{ marginLeft: i === 0 ? 0 : -5 }}>
                                            <AvatarFallback className={`text-[7px] font-bold ${getAvatarColors(g.personName)}`}>
                                                {g.personName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                    {personGroups.length > 4 && (
                                        <span className="text-[10px] text-muted-foreground ml-1">+{personGroups.length - 4}</span>
                                    )}
                                </div>
                            )}
                            <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
                                {peopleCount} {peopleCount === 1 ? "person" : "people"}
                                {totalHpd > 0 && ` · ${parseFloat(totalHpd.toFixed(1))}h/d`}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canManage && (
                        <button
                            onClick={() => onNewAlloc(project.id)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted/60 transition-colors text-muted-foreground"
                            title="Add allocation"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted/60 transition-colors text-muted-foreground" title="Project actions">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                                <a href={`/projects/${project.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View project
                                </a>
                            </DropdownMenuItem>
                            {canManage && (
                                <>
                                    <DropdownMenuItem onSelect={() => setEditOpen(true)} className="flex items-center gap-2">
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => { setShiftDays("7"); setShiftOpen(true) }} className="flex items-center gap-2">
                                        <CalendarRange className="h-3.5 w-3.5" />
                                        Shift timeline
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={handleArchive} className="flex items-center gap-2">
                                        <Archive className="h-3.5 w-3.5" />
                                        Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="flex items-center gap-2 text-destructive focus:text-destructive">
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Edit project dialog — triggered programmatically via hidden span */}
            {canManage && (
                <ProjectForm mode="edit" project={project} clients={clients} managers={managers}>
                    <span
                        ref={(el) => { if (el && editOpen) { el.click(); setEditOpen(false) } }}
                        className="hidden"
                    />
                </ProjectForm>
            )}

            {/* Timeline: summary bar + day columns */}
            <div className="flex-1 relative min-h-[48px] overflow-hidden cursor-default bg-sidebar/5">
                {dates.map((dateStr) => {
                    const d = new Date(dateStr + "T00:00:00")
                    const dow = d.getDay()
                    const isWeekend = dow === 0 || dow === 6
                    const isHoliday = holidaySet.has(dateStr)
                    const left = valueToPixels(d.getTime() - range.start)
                    const width = valueToPixels(DAY_MS)
                    return (
                        <div key={dateStr}
                            className="absolute top-0 bottom-0 border-r border-sidebar-border/10 pointer-events-none"
                            style={{
                                left: left + "px", width: width + "px",
                                ...(isHoliday || isWeekend ? { backgroundColor: "rgba(0,0,0,0.03)" } : {}),
                            }}
                        />
                    )
                })}
                {todayInRange && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-primary/40 z-10 pointer-events-none"
                        style={{ left: valueToPixels(todayMs - range.start) + "px" }} />
                )}
                {summaryBar && (
                    <div
                        className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full opacity-60 pointer-events-none"
                        style={{ left: summaryBar.left + "px", width: summaryBar.width + "px", backgroundColor: `${hex}80` }}
                    />
                )}
                {allAllocs.length === 0 && canManage && (
                    <div className="absolute inset-0 flex items-center pl-4 text-xs text-muted-foreground/40 pointer-events-none italic">
                        No allocations — click + to add
                    </div>
                )}
            </div>
        </div>

        {/* Shift timeline dialog */}
        <AlertDialog open={shiftOpen} onOpenChange={setShiftOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Shift timeline</AlertDialogTitle>
                    <AlertDialogDescription>
                        Move all allocations for <strong>{project.name}</strong> by a number of days.
                        Use a negative number to shift backward.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex items-center gap-2 py-2">
                    <Input
                        type="number"
                        value={shiftDays}
                        onChange={(e) => setShiftDays(e.target.value)}
                        className="w-28"
                        placeholder="e.g. 7"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleShift} disabled={shifting}>
                        {shifting ? "Shifting…" : "Shift"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Delete confirmation */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete project</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>{project.name}</strong>? This cannot be undone.
                        Projects with time entries or tasks cannot be deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {deleting ? "Deleting…" : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}

// ─── GanttProjectFooter ──────────────────────────────────────────────────────

type GanttProjectFooterProps = {
    project: GanttProject
    onNewAlloc: (projectId: string, startDate?: string, endDate?: string, rowId?: string) => void
}

function GanttProjectFooter({ project, onNewAlloc }: GanttProjectFooterProps) {
    return (
        <div className="flex border-t border-sidebar-border/10 items-center gap-2 px-3 py-1.5">
            <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground gap-1 px-2 ml-7"
                onClick={() => onNewAlloc(project.id)}
            >
                <UserPlus className="h-3 w-3" />
                Assign person...
            </Button>
        </div>
    )
}
