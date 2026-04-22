"use client"

import { useState, useTransition } from "react"
import { movePortalIssueToUATColumn } from "@/app/actions/portal"
import { UAT_COLUMNS, type UATColumn } from "@/lib/uat-mapping"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { RichTextEditor } from "@/components/portal/RichTextEditor"
import { Button } from "@/components/ui/button"
import { ClipboardCheck, MessageSquareWarning, Loader2, XCircle, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface ActionTargetConfig {
    label: (fromCol: UATColumn) => string
    icon: React.ComponentType<{ className?: string }>
    pillClass: string
    primaryClass: string
    isPrimary: boolean
    requiresComment: boolean
    dialogTitle: (fromCol: UATColumn) => string
    dialogLabel: string
    dialogPlaceholder: string
}

export const ACTION_TARGET_CONFIG: Partial<Record<UATColumn, ActionTargetConfig>> = {
    done: {
        label: () => "Approve",
        icon: ClipboardCheck,
        pillClass: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400",
        primaryClass: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 border-0",
        isPrimary: true,
        requiresComment: false,
        dialogTitle: () => "Approve",
        dialogLabel: "Comment (optional)",
        dialogPlaceholder: "Add a note…",
    },
    submitted: {
        label: () => "Send Back for Fixes",
        icon: MessageSquareWarning,
        pillClass: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400",
        primaryClass: "bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 dark:text-amber-400 border border-amber-500/30",
        isPrimary: false,
        requiresComment: true,
        dialogTitle: () => "Send Back for Fixes",
        dialogLabel: "What needs to be changed?",
        dialogPlaceholder: "Describe the problem, what failed, or what you need the team to fix…",
    },
    "client-review": {
        label: () => "Send for Review",
        icon: RotateCcw,
        pillClass: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
        primaryClass: "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40",
        isPrimary: false,
        requiresComment: false,
        dialogTitle: () => "Send for Review",
        dialogLabel: "Comment (optional)",
        dialogPlaceholder: "Add a note for the team…",
    },
    archived: {
        label: () => "Cancel Issue",
        icon: XCircle,
        pillClass: "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400",
        primaryClass: "border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40",
        isPrimary: false,
        requiresComment: false,
        dialogTitle: () => "Cancel Issue",
        dialogLabel: "Reason (optional)",
        dialogPlaceholder: "Explain why this issue is being canceled…",
    },
}

interface PortalIssueActionsProps {
    issueId: string
    currentCol: UATColumn
    /** Which target columns the user can transition to */
    allowedTransitions: UATColumn[]
    onSuccess: () => void
    /**
     * Disable specific target buttons. Key = target column, value = tooltip reason shown to user.
     * Used to enforce the sub-issue approval gate (parent can't be approved until all sub-issues are done).
     */
    disabledTargets?: Partial<Record<UATColumn, string>>
    /**
     * pill (default) = horizontal rounded-pill buttons, for use in cards/rows
     * stack = full-width stacked buttons, for use in sidebars/sheets
     */
    layout?: "pill" | "stack"
    className?: string
}

export function PortalIssueActions({
    issueId,
    currentCol,
    allowedTransitions,
    onSuccess,
    disabledTargets = {},
    layout = "pill",
    className,
}: PortalIssueActionsProps) {
    const [isPending, startTransition] = useTransition()
    const [dialog, setDialog] = useState<{ open: boolean; target: UATColumn | null; comment: string }>({
        open: false, target: null, comment: "",
    })

    const buttons = allowedTransitions
        .map(t => ({ target: t, cfg: ACTION_TARGET_CONFIG[t] }))
        .filter((b): b is { target: UATColumn; cfg: ActionTargetConfig } => !!b.cfg)

    if (buttons.length === 0) return null

    function closeDialog() {
        if (isPending) return
        setDialog({ open: false, target: null, comment: "" })
    }

    function handleAction(target: UATColumn) {
        const cfg = ACTION_TARGET_CONFIG[target]
        if (!cfg) return
        if (cfg.requiresComment) {
            setDialog({ open: true, target, comment: "" })
        } else {
            startTransition(async () => {
                try {
                    await movePortalIssueToUATColumn(issueId, target)
                    const colDef = UAT_COLUMNS.find(c => c.id === target)
                    toast.success(target === "done" ? "Issue approved!" : `Moved to ${colDef?.title ?? target}`)
                    onSuccess()
                } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : "Failed")
                }
            })
        }
    }

    function handleDialogSubmit(e: React.FormEvent) {
        e.preventDefault()
        const { target, comment } = dialog
        if (!target) return
        const cfg = ACTION_TARGET_CONFIG[target]
        if (!cfg || (cfg.requiresComment && !comment.trim())) return

        startTransition(async () => {
            try {
                await movePortalIssueToUATColumn(issueId, target, comment.trim() || undefined)
                const colDef = UAT_COLUMNS.find(c => c.id === target)
                toast.success(`${colDef?.title ?? target} — the team has been notified`)
                closeDialog()
                onSuccess()
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to submit")
            }
        })
    }

    const dialogCfg = dialog.target ? (ACTION_TARGET_CONFIG[dialog.target] ?? null) : null
    const isActing = isPending && !dialog.open

    return (
        <>
            <div className={cn(
                layout === "pill" ? "flex items-center gap-1 flex-wrap" : "flex flex-col gap-2",
                className,
            )}>
                {buttons.map(({ target, cfg }) => {
                    const Icon = cfg.icon
                    const disabledReason = disabledTargets[target]
                    const isDisabled = isPending || !!disabledReason
                    if (layout === "stack") {
                        return (
                            <Button
                                key={target}
                                size="sm"
                                variant={cfg.isPrimary ? "default" : "outline"}
                                onClick={e => { e.stopPropagation(); handleAction(target) }}
                                disabled={isDisabled}
                                title={disabledReason}
                                className={cn("w-full gap-1.5 text-xs justify-center", cfg.primaryClass)}
                            >
                                {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                                {cfg.label(currentCol)}
                            </Button>
                        )
                    }
                    return (
                        <button
                            key={target}
                            onClick={e => { e.stopPropagation(); handleAction(target) }}
                            disabled={isDisabled}
                            title={disabledReason}
                            className={cn(
                                "flex items-center justify-center gap-1 h-6 rounded-full text-[11px] font-medium px-2.5 transition-all disabled:opacity-50 disabled:pointer-events-none",
                                cfg.pillClass,
                            )}
                        >
                            {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3 shrink-0" />}
                            {cfg.label(currentCol)}
                        </button>
                    )
                })}
            </div>

            {dialogCfg && (
                <Dialog open={dialog.open} onOpenChange={open => { if (!open) closeDialog() }}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <dialogCfg.icon className="h-4 w-4 text-amber-500" />
                                {dialogCfg.dialogTitle(currentCol)}
                            </DialogTitle>
                            {dialogCfg.requiresComment && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Your comment will be posted to Linear so the team knows exactly what to fix.
                                </p>
                            )}
                        </DialogHeader>
                        <form onSubmit={handleDialogSubmit} className="space-y-4 pt-1">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">{dialogCfg.dialogLabel}</label>
                                <RichTextEditor
                                    value={dialog.comment}
                                    onChange={comment => setDialog(d => ({ ...d, comment }))}
                                    placeholder={dialogCfg.dialogPlaceholder}
                                    minHeight="120px"
                                    disabled={isPending}
                                    autoFocus
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" size="sm" onClick={closeDialog} disabled={isPending}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isPending || (dialogCfg.requiresComment ? !dialog.comment.trim() : false)}
                                >
                                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                    {dialogCfg.dialogTitle(currentCol)}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}
