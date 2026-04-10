"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import { approveTimeEntry, rejectTimeEntry } from "@/app/actions/approvals"
import { toast } from "sonner"

interface ApprovalButtonsProps {
    entryId: string
    currentStatus: string
    canWithdraw?: boolean
}

export function ApprovalButtons({ entryId, currentStatus, canWithdraw = true }: ApprovalButtonsProps) {
    const [isPending, startTransition] = useTransition()

    function handleApprove() {
        startTransition(async () => {
            try {
                await approveTimeEntry(entryId)
                toast.success("Entry approved")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to approve entry")
            }
        })
    }

    function handleReject() {
        startTransition(async () => {
            try {
                await rejectTimeEntry(entryId)
                toast.success(currentStatus === "APPROVED" ? "Approval withdrawn" : "Entry rejected")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to reject entry")
            }
        })
    }

    if (currentStatus === "APPROVED") {
        if (!canWithdraw) return null
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={handleReject}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive text-xs h-7"
            >
                {isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
                Withdraw
            </Button>
        )
    }

    if (currentStatus === "REJECTED") {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={handleApprove}
                disabled={isPending}
                className="text-muted-foreground hover:text-emerald-600 text-xs h-7"
            >
                {isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                Approve
            </Button>
        )
    }

    // PENDING
    return (
        <div className="flex items-center gap-1">
            <Button
                variant="outline"
                size="sm"
                onClick={handleApprove}
                disabled={isPending}
                className="text-emerald-600 border-emerald-600/30 hover:bg-emerald-600/10 text-xs h-7"
            >
                {isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                Approve
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                disabled={isPending}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-7"
            >
                {isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
                Reject
            </Button>
        </div>
    )
}
