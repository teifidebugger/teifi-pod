"use client"

import { format, isWeekend, isSameDay } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import { upsertWeekEntry } from "@/app/actions/timesheets"
import { AddRowCombobox, type ProjectWithTasks, type AddedRow } from "./AddRowCombobox"
import { Lock, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Entry {
    id: string
    projectId: string
    taskId: string | null
    date: string
    timerStartedAt: Date | null
    durationSeconds: number
    isBillable: boolean
    project: { name: string; client: { name: string } | null }
    task: { name: string } | null
}

interface Props {
    entries: Entry[]
    days: Date[]
    weekStart: string
    memberId?: string
    timesheetStatus?: "OPEN" | "SUBMITTED" | "APPROVED" | "REJECTED" | null
    projectsWithTasks?: ProjectWithTasks[]
}

function fmtDuration(seconds: number): string {
    if (seconds === 0) return ""
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}:${String(m).padStart(2, "0")}`
}

function fmtHm(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
}

/** Parse "h:mm" or decimal hours → seconds. Null = invalid, 0 = empty/zero. */
function parseInput(val: string): number | null {
    const v = val.trim()
    if (!v) return 0
    if (v.includes(":")) {
        const parts = v.split(":")
        const h = parseInt(parts[0] ?? "0", 10)
        const m = parseInt(parts[1] ?? "0", 10)
        if (isNaN(h) || isNaN(m) || m < 0 || m >= 60 || h < 0) return null
        return (h * 60 + m) * 60
    }
    const hours = parseFloat(v)
    if (isNaN(hours) || hours < 0) return null
    return Math.round(hours * 3600)
}

type GridRow = {
    key: string
    projectId: string
    projectName: string
    clientName: string | null
    taskId: string | null
    taskName: string | null
    dailySeconds: number[]
    dailyEntryCount: number[]
    totalSeconds: number
    billableSeconds: number
}

type EditingCell = { rowKey: string; dayIndex: number }

// cellKey format: "rowKey|dayIndex"
function makeCellKey(rowKey: string, di: number) { return `${rowKey}|${di}` }

export function WeekGridView({ entries, days, weekStart, memberId, timesheetStatus, projectsWithTasks = [] }: Props) {
    const today = new Date()
    const isLocked = timesheetStatus === "SUBMITTED" || timesheetStatus === "APPROVED"

    // optimistic: cellKey → seconds (new target value, shown while server round-trip in flight)
    const [optimistic, setOptimistic] = useState<Record<string, number>>({})
    // saving: cellKey → true (spinner visible)
    const [saving, setSaving] = useState<Record<string, boolean>>({})
    const [extraRows, setExtraRows] = useState<AddedRow[]>([])
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
    const [editValue, setEditValue] = useState("")
    const [inputError, setInputError] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // When new entries arrive from the server, prune optimistic values whose server value
    // has caught up — prevents stale overrides after revalidation.
    useEffect(() => {
        setOptimistic(prev => {
            const pruned: Record<string, number> = {}
            for (const [cellKey, optSecs] of Object.entries(prev)) {
                const [rowKey, diStr] = cellKey.split("|")
                const di = parseInt(diStr ?? "0", 10)
                // Recompute server seconds for this cell
                let serverSecs = 0
                for (const entry of entries) {
                    if (entry.timerStartedAt !== null) continue
                    const key = `${entry.projectId}:${entry.taskId ?? ""}`
                    if (key !== rowKey) continue
                    const entryDi = days.findIndex(d => format(d, "yyyy-MM-dd") === entry.date)
                    if (entryDi === di) serverSecs += entry.durationSeconds
                }
                // Keep optimistic only if server hasn't reflected the change yet
                if (serverSecs !== optSecs) pruned[cellKey] = optSecs
            }
            return pruned
        })
    }, [entries, days])

    // ─── Build row map ─────────────────────────────────────────────────────────
    const rowMap = new Map<string, GridRow>()
    for (const entry of entries) {
        if (entry.timerStartedAt !== null) continue
        const key = `${entry.projectId}:${entry.taskId ?? ""}`
        if (!rowMap.has(key)) {
            rowMap.set(key, {
                key, projectId: entry.projectId, projectName: entry.project.name,
                clientName: entry.project.client?.name ?? null,
                taskId: entry.taskId, taskName: entry.task?.name ?? null,
                dailySeconds: Array(7).fill(0), dailyEntryCount: Array(7).fill(0),
                totalSeconds: 0, billableSeconds: 0,
            })
        }
        const row = rowMap.get(key)!
        const di = days.findIndex(d => format(d, "yyyy-MM-dd") === entry.date)
        if (di >= 0) { row.dailySeconds[di] += entry.durationSeconds; row.dailyEntryCount[di]++ }
        row.totalSeconds += entry.durationSeconds
        if (entry.isBillable) row.billableSeconds += entry.durationSeconds
    }
    for (const extra of extraRows) {
        const key = `${extra.projectId}:${extra.taskId ?? ""}`
        if (!rowMap.has(key)) {
            rowMap.set(key, {
                key, projectId: extra.projectId, projectName: extra.projectName,
                clientName: extra.clientName ?? null,
                taskId: extra.taskId, taskName: extra.taskName,
                dailySeconds: Array(7).fill(0), dailyEntryCount: Array(7).fill(0),
                totalSeconds: 0, billableSeconds: 0,
            })
        }
    }
    // Apply optimistic overrides on top of server data
    for (const [cellKey, secs] of Object.entries(optimistic)) {
        const [rowKey, diStr] = cellKey.split("|")
        const di = parseInt(diStr ?? "0", 10)
        const row = rowMap.get(rowKey!)
        if (!row) continue
        const prev = row.dailySeconds[di]
        row.dailySeconds[di] = secs
        row.totalSeconds = row.totalSeconds - prev + secs
    }

    const rows = Array.from(rowMap.values()).sort((a, b) => {
        const pc = a.projectName.localeCompare(b.projectName)
        return pc !== 0 ? pc : (a.taskName ?? "").localeCompare(b.taskName ?? "")
    })
    const dayTotals = Array(7).fill(0) as number[]
    for (const row of rows) for (let i = 0; i < 7; i++) dayTotals[i] += row.dailySeconds[i]
    const grandTotal = rows.reduce((s, r) => s + r.totalSeconds, 0)

    // ─── Cell edit handlers ────────────────────────────────────────────────────
    function startEdit(rowKey: string, di: number, currentSecs: number) {
        if (isLocked || memberId) return
        setEditingCell({ rowKey, dayIndex: di })
        setInputError(false)
        const h = Math.floor(currentSecs / 3600)
        const m = Math.floor((currentSecs % 3600) / 60)
        setEditValue(currentSecs > 0 ? (m === 0 ? `${h}` : `${h}:${String(m).padStart(2, "0")}`) : "")
    }

    function cancelEdit() {
        setEditingCell(null)
        setEditValue("")
        setInputError(false)
    }

    async function commitEdit(row: GridRow, di: number) {
        const seconds = parseInput(editValue)
        if (seconds === null) {
            setInputError(true)
            inputRef.current?.focus()
            toast.error("Invalid format — use h:mm (e.g. 1:30) or decimal hours (e.g. 1.5)")
            return
        }

        const currentSecs = row.dailySeconds[di]
        const cellKey = makeCellKey(row.key, di)
        setEditingCell(null)
        setEditValue("")
        setInputError(false)

        if (seconds === currentSecs) return // no change

        const date = format(days[di], "yyyy-MM-dd")
        const hours = seconds / 3600

        // Show optimistic value and saving spinner immediately
        setOptimistic(prev => ({ ...prev, [cellKey]: seconds }))
        setSaving(prev => ({ ...prev, [cellKey]: true }))

        const toastId = toast.loading(
            seconds === 0
                ? `Deleting entry for ${row.projectName}…`
                : `Saving ${fmtDuration(seconds)} for ${row.projectName}…`
        )

        try {
            await upsertWeekEntry({ projectId: row.projectId, taskId: row.taskId, date, hours, weekStart })
            toast.success(
                seconds === 0 ? "Entry removed" : `Saved ${fmtDuration(seconds)}`,
                { id: toastId }
            )
        } catch (e) {
            // Revert optimistic on error
            setOptimistic(prev => { const n = { ...prev }; delete n[cellKey]; return n })
            toast.error(e instanceof Error ? e.message : "Failed to save", { id: toastId })
        } finally {
            setSaving(prev => { const n = { ...prev }; delete n[cellKey]; return n })
        }
    }

    function handleAddRow(added: AddedRow) {
        const key = `${added.projectId}:${added.taskId ?? ""}`
        if (rowMap.has(key)) {
            toast.info(`${added.projectName} is already in the grid`)
            return
        }
        setExtraRows(prev => [...prev, added])
        toast.success(`Added ${added.projectName}${added.taskName ? ` · ${added.taskName}` : ""}`)
    }

    return (
        <div className="space-y-2">
            {isLocked && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                    <Lock className="h-3 w-3" />
                    {timesheetStatus === "SUBMITTED"
                        ? "Week submitted — entries are read-only until reviewed"
                        : "Week approved — entries are locked"}
                </div>
            )}
            <div className="rounded-lg border border-sidebar-border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-sidebar/50 border-b border-sidebar-border">
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wide w-[260px]">
                                Project / Task
                            </th>
                            {days.map((d) => {
                                const isToday = isSameDay(d, today)
                                const weekend = isWeekend(d)
                                const dayParam = format(d, "yyyy-MM-dd")
                                const href = `/time?view=day&day=${dayParam}&week=${weekStart}${memberId ? `&memberId=${memberId}` : ""}`
                                return (
                                    <th
                                        key={format(d, "yyyy-MM-dd")}
                                        className={`text-center px-2 py-2 w-[80px]
                                            ${weekend ? "bg-muted/20" : ""}
                                            ${isToday ? "bg-primary/5" : ""}`}
                                    >
                                        <Link href={href} className="block hover:opacity-80 transition-opacity">
                                            <span className={`text-[11px] block font-medium uppercase tracking-wide leading-none ${isToday ? "text-primary" : weekend ? "text-muted-foreground/50" : "text-muted-foreground/70"}`}>
                                                {format(d, "EEE")}
                                            </span>
                                            <span className={`text-sm font-semibold mt-0.5 block ${isToday ? "text-primary" : weekend ? "text-muted-foreground/60" : "text-foreground/80"}`}>
                                                {format(d, "d")}
                                            </span>
                                        </Link>
                                        {isToday && <div className="h-0.5 w-5 bg-primary rounded-full mx-auto mt-1" />}
                                    </th>
                                )
                            })}
                            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wide w-[70px]">Total</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-sidebar-border/50">
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                    No time tracked this week.
                                </td>
                            </tr>
                        )}

                        {rows.map(row => (
                            <tr key={row.key} className="hover:bg-sidebar/20 transition-colors group">
                                <td className="px-4 py-2.5">
                                    {row.clientName && (
                                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground/60 leading-none mb-0.5">{row.clientName}</div>
                                    )}
                                    <div className="text-sm font-semibold text-foreground leading-tight">{row.projectName}</div>
                                    {row.taskName && (
                                        <div className="text-xs text-muted-foreground mt-0.5">{row.taskName}</div>
                                    )}
                                    {row.billableSeconds > 0 && row.billableSeconds < row.totalSeconds && (
                                        <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1 text-emerald-600 border-emerald-600/30">
                                            {fmtHm(row.billableSeconds)} billable
                                        </Badge>
                                    )}
                                </td>

                                {row.dailySeconds.map((secs, di) => {
                                    const d = days[di]
                                    const weekend = isWeekend(d)
                                    const isToday = isSameDay(d, today)
                                    const isEditing = editingCell?.rowKey === row.key && editingCell?.dayIndex === di
                                    const multipleEntries = row.dailyEntryCount[di] > 1
                                    const canEdit = !isLocked && !memberId && !multipleEntries
                                    const cellKey = makeCellKey(row.key, di)
                                    const isSavingCell = !!saving[cellKey]
                                    const isOptimistic = cellKey in optimistic
                                    const dayParam = format(d, "yyyy-MM-dd")
                                    const href = `/time?view=day&day=${dayParam}&week=${weekStart}${memberId ? `&memberId=${memberId}` : ""}`

                                    return (
                                        <td
                                            key={di}
                                            className={`px-1 py-1 tabular-nums ${weekend ? "bg-muted/20" : ""} ${isToday ? "font-medium" : ""}`}
                                            style={{ minWidth: 72 }}
                                        >
                                            {isEditing ? (
                                                <Input
                                                    ref={inputRef}
                                                    value={editValue}
                                                    autoFocus
                                                    onChange={e => { setEditValue(e.target.value); setInputError(false) }}
                                                    onBlur={() => commitEdit(row, di)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter") { e.preventDefault(); void commitEdit(row, di) }
                                                        if (e.key === "Escape") { e.preventDefault(); cancelEdit() }
                                                    }}
                                                    className={`h-7 text-xs text-center px-1 w-full ${inputError ? "border-destructive ring-destructive" : ""}`}
                                                    placeholder="0"
                                                />
                                            ) : isSavingCell ? (
                                                // Saving indicator — show optimistic value with spinner
                                                <div className="flex items-center justify-center h-7 gap-1 text-muted-foreground">
                                                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                                    <span className="text-xs tabular-nums">{secs > 0 ? fmtDuration(secs) : ""}</span>
                                                </div>
                                            ) : secs > 0 ? (
                                                multipleEntries ? (
                                                    <Link href={href} className="flex items-center justify-center w-full h-7 hover:text-primary hover:underline">
                                                        {fmtDuration(secs)}
                                                    </Link>
                                                ) : canEdit ? (
                                                    <button
                                                        className={`flex items-center justify-center w-full h-7 rounded px-1 transition-colors cursor-text
                                                            ${isOptimistic ? "text-muted-foreground" : "text-foreground"}
                                                            hover:bg-primary/10 hover:text-primary`}
                                                        onClick={() => startEdit(row.key, di, secs)}
                                                    >
                                                        {fmtDuration(secs)}
                                                    </button>
                                                ) : (
                                                    <span className="flex items-center justify-center h-7">{fmtDuration(secs)}</span>
                                                )
                                            ) : (
                                                canEdit ? (
                                                    <button
                                                        className="flex items-center justify-center w-full h-7 rounded transition-colors text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/30 cursor-text opacity-0 group-hover:opacity-100"
                                                        onClick={() => startEdit(row.key, di, 0)}
                                                    >
                                                        +
                                                    </button>
                                                ) : (
                                                    <span className="flex items-center justify-center h-7 text-muted-foreground/25 text-xs select-none">—</span>
                                                )
                                            )}
                                        </td>
                                    )
                                })}

                                <td className="text-right px-4 py-2.5 tabular-nums text-sm font-semibold text-foreground">
                                    {fmtDuration(row.totalSeconds)}
                                </td>
                            </tr>
                        ))}
                    </tbody>

                    <tfoot>
                        <tr className="border-t border-sidebar-border bg-muted/40">
                            <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wide">
                                {!isLocked && !memberId && projectsWithTasks.length > 0 ? (
                                    <AddRowCombobox projects={projectsWithTasks} onAdd={handleAddRow} />
                                ) : (
                                    "Total"
                                )}
                            </td>
                            {dayTotals.map((secs, di) => {
                                const weekend = isWeekend(days[di])
                                return (
                                    <td key={di} className={`text-center px-2 py-2.5 tabular-nums text-sm font-semibold ${weekend ? "bg-muted/20" : ""} ${secs === 0 ? "text-muted-foreground/30" : "text-foreground"}`}>
                                        {secs > 0 ? fmtDuration(secs) : <span className="font-normal text-muted-foreground/30">—</span>}
                                    </td>
                                )
                            })}
                            <td className={`text-right px-4 py-2.5 tabular-nums text-sm font-bold ${grandTotal === 0 ? "text-muted-foreground/30" : "text-foreground"}`}>
                                {grandTotal > 0 ? fmtDuration(grandTotal) : "—"}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}
