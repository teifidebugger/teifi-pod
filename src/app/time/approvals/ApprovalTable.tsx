"use client"

import { useTransition, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronDown, ChevronRight, Loader2, X } from "lucide-react"
import { approveWeekForMember, approveWeekForProject, approveWeekForClient, bulkApproveVisible } from "@/app/actions/approvals"
import { approveTimeEntry, rejectTimeEntry } from "@/app/actions/approvals"
import { toast } from "sonner"

function fmtHM(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}:${String(m).padStart(2, "0")}`
}

function initials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

// ─── Billable bar ────────────────────────────────────────────────────────────

function BillableBar({ billable, total }: { billable: number; total: number }) {
    const pct = total > 0 ? Math.round((billable / total) * 100) : 0
    return (
        <div className="flex items-center gap-2 min-w-[160px]">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums w-24 shrink-0">
                {fmtHM(billable)} ({pct}%)
            </span>
        </div>
    )
}

// ─── Entry row (expanded) ─────────────────────────────────────────────────────

interface EntryRowData {
    id: string
    projectName: string
    taskName: string | null
    description: string | null
    date: string
    durationSeconds: number
    isBillable: boolean
    approvalStatus: string
    isLocked: boolean
}

function EntryRow({ entry, canApprove, canWithdraw }: {
    entry: EntryRowData
    canApprove: boolean
    canWithdraw: boolean
}) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function approve() {
        setError(null)
        startTransition(async () => {
            try {
                await approveTimeEntry(entry.id)
                toast.success("Entry approved")
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Failed to approve entry"
                setError(msg)
                toast.error(msg)
            }
        })
    }
    function reject() {
        setError(null)
        startTransition(async () => {
            try {
                await rejectTimeEntry(entry.id)
                toast.success(entry.approvalStatus === "APPROVED" ? "Approval withdrawn" : "Entry rejected")
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Failed to reject entry"
                setError(msg)
                toast.error(msg)
            }
        })
    }


    return (
        <div className="flex items-center gap-3 px-6 py-2.5 bg-sidebar/10 hover:bg-sidebar/20 transition-colors">
            <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{entry.projectName}</span>
                {entry.taskName && <span className="text-xs text-muted-foreground ml-2">{entry.taskName}</span>}
                {entry.description && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{entry.description}</div>
                )}
                <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                    {entry.date}
                </div>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                {fmtHM(entry.durationSeconds)}
            </span>
            {!entry.isBillable && (
                <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground shrink-0">
                    Non-billable
                </Badge>
            )}
            <Badge
                variant={entry.approvalStatus === "APPROVED" ? "default" : entry.approvalStatus === "REJECTED" ? "destructive" : "outline"}
                className={`shrink-0 text-xs ${entry.approvalStatus === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-600 text-white border-transparent" : ""}`}
            >
                {entry.approvalStatus === "APPROVED" ? "Approved" : entry.approvalStatus === "REJECTED" ? "Rejected" : "Pending"}
            </Badge>
            {error && <span className="text-xs text-destructive shrink-0">{error}</span>}
            {canApprove && (
                <div className="flex items-center gap-1 shrink-0">
                    {entry.approvalStatus === "PENDING" && (
                        <>
                            <Button variant="outline" size="sm" disabled={isPending} onClick={approve}
                                className="text-emerald-600 border-emerald-600/30 hover:bg-emerald-600/10 text-xs h-6 px-2">
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Approve</>}
                            </Button>
                            <Button variant="outline" size="sm" disabled={isPending} onClick={reject}
                                className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-6 px-2">
                                <X className="h-3 w-3 mr-1" />Reject
                            </Button>
                        </>
                    )}
                    {entry.approvalStatus === "APPROVED" && canWithdraw && (
                        <Button variant="ghost" size="sm" disabled={isPending} onClick={reject}
                            className="text-muted-foreground hover:text-destructive text-xs h-6">
                            <X className="h-3 w-3 mr-1" />Withdraw
                        </Button>
                    )}
                    {entry.approvalStatus === "REJECTED" && (
                        <Button variant="ghost" size="sm" disabled={isPending} onClick={approve}
                            className="text-muted-foreground hover:text-emerald-600 text-xs h-6">
                            <Check className="h-3 w-3 mr-1" />Approve
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Group row types ──────────────────────────────────────────────────────────

export interface ApprovalGroupRow {
    key: string
    // Person
    userId?: string
    memberName?: string
    memberEmail?: string
    memberImage?: string | null
    // Project
    projectId?: string
    projectName?: string
    clientName?: string | null
    // Client
    clientId?: string | null

    totalSeconds: number
    billableSeconds: number
    pendingCount: number
    approvedCount: number
    rejectedCount: number
    entries: EntryRowData[]
}

// ─── ApprovalTable ────────────────────────────────────────────────────────────

interface Props {
    rows: ApprovalGroupRow[]
    groupBy: "person" | "project" | "client"
    weekStart: string
    weekEnd: string
    canApprove: boolean
    canWithdraw: boolean
}

export function ApprovalTable({ rows, groupBy, weekStart, weekEnd, canApprove, canWithdraw }: Props) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    function toggle(key: string) {
        setExpanded(prev => {
            const n = new Set(prev)
            n.has(key) ? n.delete(key) : n.add(key)
            return n
        })
    }

    if (rows.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-sidebar-border bg-sidebar/20 p-10 text-center text-sm text-muted-foreground">
                No time entries for this period.
            </div>
        )
    }

    return (
        <div className="rounded-lg border border-sidebar-border overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_120px_200px_100px] items-center gap-4 px-4 py-2.5 bg-sidebar/50 border-b border-sidebar-border text-xs font-medium text-muted-foreground">
                <span>{groupBy === "person" ? "Teammate" : groupBy === "project" ? "Project" : "Client"}</span>
                <span>Hours</span>
                <span>Billable Hours</span>
                <span className="text-right">
                    {canApprove ? "Action" : ""}
                </span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-sidebar-border/50">
                {rows.map(row => (
                    <GroupRow
                        key={row.key}
                        row={row}
                        groupBy={groupBy}
                        weekStart={weekStart}
                        weekEnd={weekEnd}
                        canApprove={canApprove}
                        canWithdraw={canWithdraw}
                        isExpanded={expanded.has(row.key)}
                        onToggle={() => toggle(row.key)}
                    />
                ))}
            </div>
        </div>
    )
}

// ─── GroupRow ─────────────────────────────────────────────────────────────────

function GroupRow({
    row,
    groupBy,
    weekStart,
    weekEnd,
    canApprove,
    canWithdraw,
    isExpanded,
    onToggle,
}: {
    row: ApprovalGroupRow
    groupBy: "person" | "project" | "client"
    weekStart: string
    weekEnd: string
    canApprove: boolean
    canWithdraw: boolean
    isExpanded: boolean
    onToggle: () => void
}) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function approveRow() {
        setError(null)
        startTransition(async () => {
            try {
                let count = 0
                if (groupBy === "person" && row.userId) {
                    count = await approveWeekForMember(row.userId, weekStart, weekEnd)
                } else if (groupBy === "project" && row.projectId) {
                    count = await approveWeekForProject(row.projectId, weekStart, weekEnd)
                } else if (groupBy === "client") {
                    count = await approveWeekForClient(row.clientId ?? null, weekStart, weekEnd)
                }
                toast.success(`${count} ${count === 1 ? "entry" : "entries"} approved`)
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Failed to approve entries"
                setError(msg)
                toast.error(msg)
            }
        })
    }

    const label = groupBy === "person"
        ? row.memberName ?? ""
        : groupBy === "project"
            ? row.projectName ?? ""
            : row.clientName ?? "(No client)"

    const sub = groupBy === "project" ? row.clientName : null

    return (
        <>
            <div
                className="grid grid-cols-[1fr_120px_200px_100px] items-center gap-4 px-4 py-3 hover:bg-sidebar/20 transition-colors cursor-pointer"
                onClick={onToggle}
            >
                {/* Identity */}
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-muted-foreground shrink-0">
                        {isExpanded
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                    </span>
                    {groupBy === "person" && (
                        <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className={`text-xs text-white ${avatarBg(row.memberName ?? "?")}`}>{initials(row.memberName ?? "?")}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className="min-w-0">
                        <span className="text-sm font-medium text-foreground truncate block">{label}</span>
                        {sub && <span className="text-xs text-muted-foreground truncate block">{sub}</span>}
                    </div>
                    {/* Status summary chips */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                        {row.pendingCount > 0 && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                {row.pendingCount} pending
                            </Badge>
                        )}
                        {row.approvedCount > 0 && (
                            <Badge className="text-[10px] h-4 px-1.5 bg-emerald-600 hover:bg-emerald-600 text-white border-transparent">
                                {row.approvedCount} approved
                            </Badge>
                        )}
                        {row.rejectedCount > 0 && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                                {row.rejectedCount} rejected
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Total hours */}
                <span className="text-sm tabular-nums font-medium" onClick={e => e.stopPropagation()}>
                    {fmtHM(row.totalSeconds)}
                </span>

                {/* Billable bar */}
                <div onClick={e => e.stopPropagation()}>
                    <BillableBar billable={row.billableSeconds} total={row.totalSeconds} />
                </div>

                {/* Approve action */}
                <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    {error && <span className="text-xs text-destructive">{error}</span>}
                    {canApprove && row.pendingCount > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={approveRow}
                            className="text-xs h-7 text-emerald-600 border-emerald-600/30 hover:bg-emerald-600/10"
                        >
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                        </Button>
                    )}
                    {canApprove && row.pendingCount === 0 && row.approvedCount > 0 && (
                        <span className="text-xs text-emerald-600 font-medium">✓ All approved</span>
                    )}
                </div>
            </div>

            {/* Expanded entry detail */}
            {isExpanded && (
                <div className="divide-y divide-sidebar-border/30 border-t border-sidebar-border/30">
                    {row.entries.map(entry => (
                        <EntryRow
                            key={entry.id}
                            entry={entry}
                            canApprove={canApprove}
                            canWithdraw={canWithdraw}
                        />
                    ))}
                </div>
            )}
        </>
    )
}

// ─── BulkApproveButton ────────────────────────────────────────────────────────

export function BulkApproveButton({
    weekStart,
    weekEnd,
    pendingCount,
}: {
    weekStart: string
    weekEnd: string
    pendingCount: number
}) {
    const [isPending, startTransition] = useTransition()

    function handleApprove() {
        startTransition(async () => {
            try {
                const count = await bulkApproveVisible(weekStart, weekEnd)
                toast.success(`${count} ${count === 1 ? "entry" : "entries"} approved`)
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to approve entries")
            }
        })
    }

    if (pendingCount === 0) return null

    return (
        <Button
            onClick={handleApprove}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
            {isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Approving…</>
                : `Approve all visible timesheets (${pendingCount})`
            }
        </Button>
    )
}
