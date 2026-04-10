"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, RefreshCw, Loader2 } from "lucide-react"
import { batchSyncSessionEstimates, updateSessionStatus } from "@/app/actions/estimation"
import { toast } from "sonner"

interface Round {
    id: string
    title: string
    finalEstimate: string | null
    taskId: string | null
    status: string
}

interface SessionSummaryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sessionId: string
    rounds: Round[]
}

export function SessionSummaryDialog({ open, onOpenChange, sessionId, rounds }: SessionSummaryDialogProps) {
    const [synced, setSynced] = useState(false)
    const [syncPending, startSyncTransition] = useTransition()
    const [endPending, startEndTransition] = useTransition()

    const syncableCount = rounds.filter(
        (r) => r.taskId && r.finalEstimate !== null && !isNaN(parseInt(r.finalEstimate, 10))
    ).length

    function handleSync() {
        startSyncTransition(async () => {
            const result = await batchSyncSessionEstimates(sessionId)
            setSynced(true)
            toast.success(`Synced ${result.synced} estimate${result.synced !== 1 ? "s" : ""} to task story points`)
        })
    }

    function handleEnd() {
        startEndTransition(async () => {
            await updateSessionStatus(sessionId, "COMPLETED")
            onOpenChange(false)
        })
    }

    const completedRounds = rounds.filter((r) => r.status === "COMPLETE")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>End session</DialogTitle>
                    <DialogDescription>
                        {completedRounds.length} of {rounds.length} issue{rounds.length !== 1 ? "s" : ""} estimated
                    </DialogDescription>
                </DialogHeader>

                {rounds.length > 0 && (
                    <div className="max-h-60 overflow-y-auto space-y-1 rounded-md border border-border bg-muted/30 p-2">
                        {rounds.map((r) => (
                            <div key={r.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm">
                                <span className="truncate text-sm min-w-0">{r.title}</span>
                                {r.finalEstimate ? (
                                    <Badge variant="secondary" className="font-mono shrink-0">
                                        {r.finalEstimate}
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground shrink-0">—</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {syncableCount > 0 && !synced && (
                    <div className="flex items-start gap-2 rounded-md border-l-2 border-l-blue-400 border border-border/50 bg-muted/30 px-3 py-2">
                        <RefreshCw className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-xs font-medium text-foreground/80">
                                {syncableCount} estimate{syncableCount !== 1 ? "s" : ""} can be synced to task story points
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-1.5 h-7 text-xs border-blue-300 dark:border-blue-800"
                                onClick={handleSync}
                                disabled={syncPending}
                            >
                                {syncPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                                Sync estimates to tasks
                            </Button>
                        </div>
                    </div>
                )}

                {synced && (
                    <div className="flex items-center gap-2 rounded-md border-l-2 border-l-green-400 border border-border/50 bg-muted/30 px-3 py-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <p className="text-xs text-foreground/80 font-medium">Story points synced to tasks</p>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={endPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleEnd} disabled={endPending}>
                        {endPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        End session
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
