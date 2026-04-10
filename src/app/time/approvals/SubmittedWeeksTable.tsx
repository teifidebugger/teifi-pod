"use client"

import { useTransition, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { avatarBg } from "@/lib/avatar-color"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Check, X, Loader2 } from "lucide-react"
import { approveWeek, rejectWeek } from "@/app/actions/timesheets"
import { format, parseISO, addDays } from "date-fns"
import { toast } from "sonner"

function initials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

function fmtHM(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}:${String(m).padStart(2, "0")}`
}

export interface SubmittedWeekRow {
    id: string
    userId: string
    memberName: string
    memberEmail: string
    memberImage: string | null
    weekStart: string  // yyyy-MM-dd
    submittedAt: string
    entryCount: number
    totalSeconds: number
}

interface RowProps {
    row: SubmittedWeekRow
    canApprove: boolean
}

function WeekRow({ row, canApprove }: RowProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [showReject, setShowReject] = useState(false)
    const [rejectNote, setRejectNote] = useState("")

    const weekEnd = format(addDays(parseISO(row.weekStart), 6), "MMM d")
    const weekStartLabel = format(parseISO(row.weekStart), "MMM d")
    const submittedLabel = format(new Date(row.submittedAt), "MMM d, h:mm a")

    function handleApprove() {
        setError(null)
        startTransition(async () => {
            try {
                await approveWeek(row.id)
                toast.success(`${row.memberName}'s week approved`)
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Failed to approve week"
                setError(msg)
                toast.error(msg)
            }
        })
    }

    function handleReject() {
        setError(null)
        startTransition(async () => {
            try {
                await rejectWeek(row.id, rejectNote.trim() || undefined)
                setShowReject(false)
                setRejectNote("")
                toast.success(`${row.memberName}'s week sent back for changes`)
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Failed to reject week"
                setError(msg)
                toast.error(msg)
            }
        })
    }

    return (
        <div className="px-4 py-3 hover:bg-sidebar/20 transition-colors">
            <div className="flex items-center gap-4">
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={`text-xs text-white ${avatarBg(row.memberName)}`}>{initials(row.memberName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{row.memberName}</div>
                    <div className="text-xs text-muted-foreground">
                        {weekStartLabel} – {weekEnd} · Submitted {submittedLabel}
                    </div>
                </div>
                <div className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {row.entryCount} {row.entryCount === 1 ? "entry" : "entries"} · {fmtHM(row.totalSeconds)}
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-500/50 text-[10px] shrink-0">
                    Pending review
                </Badge>
                {canApprove && (
                    <div className="flex items-center gap-1 shrink-0">
                        {error && <span className="text-xs text-destructive">{error}</span>}
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={handleApprove}
                            className="text-emerald-600 border-emerald-600/30 hover:bg-emerald-600/10 text-xs h-7 px-2"
                        >
                            {isPending && !showReject ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Approve</>}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => setShowReject(v => !v)}
                            className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-7 px-2"
                        >
                            <X className="h-3 w-3 mr-1" />Reject
                        </Button>
                    </div>
                )}
            </div>

            {showReject && (
                <div className="mt-3 ml-12 flex items-center gap-2">
                    <Input
                        placeholder="Optional rejection note…"
                        value={rejectNote}
                        onChange={e => setRejectNote(e.target.value)}
                        className="h-8 text-xs flex-1 max-w-sm"
                        onKeyDown={e => { if (e.key === "Enter") handleReject(); if (e.key === "Escape") setShowReject(false) }}
                        autoFocus
                    />
                    <Button size="sm" variant="destructive" disabled={isPending} onClick={handleReject} className="h-8 text-xs">
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowReject(false)} className="h-8 text-xs">
                        Cancel
                    </Button>
                </div>
            )}
        </div>
    )
}

interface Props {
    weeks: SubmittedWeekRow[]
    canApprove: boolean
}

export function SubmittedWeeksTable({ weeks, canApprove }: Props) {
    if (weeks.length === 0) return null

    return (
        <div className="rounded-lg border border-border/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground/80">
                    Submitted weeks awaiting review ({weeks.length})
                </span>
            </div>
            <div className="divide-y divide-sidebar-border/50">
                {weeks.map(row => (
                    <WeekRow key={row.id} row={row} canApprove={canApprove} />
                ))}
            </div>
        </div>
    )
}
