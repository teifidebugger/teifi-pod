"use client"

import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, RotateCcw, CheckCircle2, XCircle } from "lucide-react"
import { submitWeek, retractWeek } from "@/app/actions/timesheets"
import { toast } from "sonner"

interface Props {
    weekStart: string
    status: "OPEN" | "SUBMITTED" | "APPROVED" | "REJECTED" | null
    reviewNote?: string | null
    hasEntries: boolean
    hasRunningTimer: boolean
    isOwnTimesheet: boolean
}

export function SubmitWeekButton({ weekStart, status, reviewNote, hasEntries, hasRunningTimer, isOwnTimesheet }: Props) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    if (!isOwnTimesheet) return null

    function handleSubmit() {
        setError(null)
        startTransition(async () => {
            try {
                await submitWeek(weekStart)
                toast.success("Week submitted for approval")
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to submit")
            }
        })
    }

    function handleRetract() {
        setError(null)
        startTransition(async () => {
            try {
                await retractWeek(weekStart)
                toast.success("Submission retracted")
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to retract")
            }
        })
    }

    if (status === "APPROVED") {
        return (
            <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent gap-1.5 px-3 py-1.5 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Week Approved
                </Badge>
            </div>
        )
    }

    if (status === "SUBMITTED") {
        return (
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-amber-600 border-amber-500/50 gap-1.5 px-3 py-1.5 text-xs">
                    <Send className="h-3.5 w-3.5" />
                    Submitted for approval
                </Badge>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                    disabled={isPending}
                    onClick={handleRetract}
                >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RotateCcw className="h-3 w-3 mr-1" />Retract</>}
                </Button>
                {error && <span className="text-xs text-destructive">{error}</span>}
            </div>
        )
    }

    if (status === "REJECTED") {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-xs">
                    <XCircle className="h-3.5 w-3.5" />
                    Changes Requested
                </Badge>
                {reviewNote && (
                    <span className="text-xs text-muted-foreground italic">&ldquo;{reviewNote}&rdquo;</span>
                )}
                <Button
                    size="sm"
                    className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isPending || !hasEntries}
                    onClick={handleSubmit}
                >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3 mr-1" />Resubmit</>}
                </Button>
                {error && <span className="text-xs text-destructive">{error}</span>}
            </div>
        )
    }

    // OPEN or null
    const disabled = isPending || !hasEntries || hasRunningTimer
    const tooltip = !hasEntries
        ? "No entries to submit"
        : hasRunningTimer
        ? "Stop running timer first"
        : undefined

    return (
        <div className="flex items-center gap-2">
            <Button
                size="sm"
                className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={disabled}
                onClick={handleSubmit}
                title={tooltip}
            >
                {isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <><Send className="h-3 w-3 mr-1" />Submit week for approval</>}
            </Button>
            {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
    )
}
