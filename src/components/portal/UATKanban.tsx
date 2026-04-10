"use client"

import { useState, useTransition, useMemo, useRef, useEffect } from "react"
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    useDraggable,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
} from "@dnd-kit/core"
import { UAT_COLUMNS, type UATColumn, type AllowedTransitions } from "@/lib/uat-mapping"
import { getAssigneeInitials, getIssueUATColumn, getSubIssueApprovalBlock, separateIssues, PRIORITY_CONFIG } from "@/components/portal/portal-issue-utils"
import { PortalIssueActions } from "@/components/portal/PortalIssueActions"
import { movePortalIssueToUATColumn, createPortalIssue } from "@/app/actions/portal"
import type { PortalIssue, PortalWorkflowState, PortalModuleLabel } from "@/app/actions/portal/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/portal/RichTextEditor"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    Loader2, ExternalLink, CheckCircle2, HelpCircle, RotateCcw,
    Plus, Columns3, Eye, EyeOff, Minimize2, Square, Maximize2, TicketPlus,
    GripVertical,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ReportIssueModal } from "@/components/portal/ReportIssueModal"
import { usePortalUser } from "@/components/portal/PortalUserContext"

// ─── Column definitions ───────────────────────────────────────────────────────

// "in-development" is now a first-class UATColumn (see uat-mapping.ts UAT_COLUMNS)
type ExtendedUATColumn = UATColumn



interface ColumnDef {
    id: string
    title: string
    color: string
    allowIssueCreation: boolean
}

/** All columns in display order: Submitted → In Development → UAT flow left → right */
const ALL_COLUMNS: ColumnDef[] = [
    UAT_COLUMNS.find(c => c.id === "backlog")!,
    UAT_COLUMNS.find(c => c.id === "submitted")!,
    UAT_COLUMNS.find(c => c.id === "not-started")!,
    UAT_COLUMNS.find(c => c.id === "in-development")!,
    UAT_COLUMNS.find(c => c.id === "blocked")!,
    UAT_COLUMNS.find(c => c.id === "client-review")!,
    UAT_COLUMNS.find(c => c.id === "done")!,
    UAT_COLUMNS.find(c => c.id === "released")!,
    UAT_COLUMNS.find(c => c.id === "canceled")!,
    UAT_COLUMNS.find(c => c.id === "archived")!,
]

// ─── Width ────────────────────────────────────────────────────────────────────

type ColumnWidth = "compact" | "normal" | "wide"

const WIDTH_CLASSES: Record<ColumnWidth, string> = {
    compact: "min-w-[220px] max-w-[250px]",
    normal:  "min-w-[260px] max-w-[300px]",
    wide:    "min-w-[320px] max-w-[380px]",
}

// ─── Card Options ─────────────────────────────────────────────────────────────

interface CardOptions {
    showStatus: boolean
    showPriority: boolean
    showAssignee: boolean
    showLabels: boolean
    showProject: boolean
    showCycle: boolean
}

const DEFAULT_CARD_OPTIONS: CardOptions = {
    showStatus: false,
    showPriority: true,
    showAssignee: true,
    showLabels: true,
    showProject: true,
    showCycle: false,
}

// ─── Issue type ───────────────────────────────────────────────────────────────

interface UATIssue extends Omit<PortalIssue, "uatColumn"> {
    uatColumn: ExtendedUATColumn
}

/** Returns true if this column's cards are draggable at all (have at least one allowed transition). */
function isColumnDraggable(col: ExtendedUATColumn, transitions: AllowedTransitions): boolean {
    if (col === "in-development") return false
    return (transitions[col as UATColumn]?.length ?? 0) > 0
}

// ─── Draggable Issue Card ─────────────────────────────────────────────────────

function UATIssueCard({ issue, subIssues, teamId, onAction, isDragging = false, dragListeners, dragAttributes, onIssueClick, cardAllowedTransitions, onSuccess, cardOptions, suppressClickRef }: {
    issue: UATIssue
    subIssues: PortalIssue[]
    teamId: string
    onAction: (issueId: string, target: UATColumn) => void
    isDragging?: boolean
    dragListeners?: ReturnType<typeof useDraggable>["listeners"]
    dragAttributes?: ReturnType<typeof useDraggable>["attributes"]
    onIssueClick?: (issue: PortalIssue) => void
    cardAllowedTransitions: UATColumn[]
    onSuccess: () => void
    cardOptions: CardOptions
    suppressClickRef?: React.MutableRefObject<boolean>
}) {
    const router = useRouter()
    const { isStaffOrPreview } = usePortalUser()
    const assigneeInitials = getAssigneeInitials(issue.assignee?.name, "?")
    const draggable = issue.uatColumn !== "in-development" && cardAllowedTransitions.length > 0
    const { blocked: approveBlocked, pendingCount } = getSubIssueApprovalBlock(subIssues)
    const disabledTargets = approveBlocked
        ? { done: `${pendingCount} sub-issue${pendingCount > 1 ? "s" : ""} not yet approved`, released: `${pendingCount} sub-issue${pendingCount > 1 ? "s" : ""} not yet approved` }
        : undefined
    const colDef = UAT_COLUMNS.find(c => c.id === issue.uatColumn)

    return (
        <div
            className={cn(
                "group rounded-lg border border-border/60 bg-card p-3 shadow-sm space-y-2 cursor-pointer hover:border-border/80 hover:shadow-md transition-all",
                isDragging && "opacity-50 shadow-lg ring-2 ring-primary/30",
            )}
            onClick={() => {
                if (suppressClickRef?.current) {
                    suppressClickRef.current = false
                    return
                }
                onIssueClick ? onIssueClick(issue as PortalIssue) : router.push(`/uat/${teamId}/${issue.id}`)
            }}
        >
            {/* Row 1: grip + identifier + priority dot + status badge + link */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                    {draggable && (
                        <span className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0 touch-none" onClick={e => e.stopPropagation()} {...dragListeners} {...dragAttributes}>
                            <GripVertical className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                        {issue.identifier}
                    </span>
                    {cardOptions.showPriority && issue.priority > 0 && (
                        <span
                            className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_CONFIG[issue.priority]?.colorClass ?? "bg-muted-foreground/30")}
                            title={PRIORITY_CONFIG[issue.priority]?.label}
                        />
                    )}
                    {cardOptions.showStatus && colDef && (
                        <span
                            className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: colDef.color + "18", color: colDef.color }}
                        >
                            <span className="h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: colDef.color }} />
                            {colDef.title}
                        </span>
                    )}
                </div>
                {isStaffOrPreview && (
                    <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
                        title="Open in Linear"
                        onClick={e => e.stopPropagation()}
                    >
                        <ExternalLink className="h-3 w-3" />
                    </a>
                )}
            </div>

            {/* Title */}
            <p className="text-[13px] font-medium leading-snug line-clamp-3">{issue.title}</p>

            {/* Project + Cycle metadata */}
            {(cardOptions.showProject && issue.project) || (cardOptions.showCycle && issue.cycle) ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                    {cardOptions.showProject && issue.project && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[140px]" title={issue.project.name}>
                            {issue.project.name}
                        </span>
                    )}
                    {cardOptions.showCycle && issue.cycle && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                            {issue.cycle.name ?? `#${issue.cycle.number}`}
                        </span>
                    )}
                </div>
            ) : null}

            {/* Labels */}
            {cardOptions.showLabels && issue.labels.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                    {issue.labels.map(l => (
                        <span
                            key={l.id}
                            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: l.color + "20", color: l.color }}
                        >
                            {l.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Assignee */}
            {cardOptions.showAssignee && issue.assignee && (
                <div className="flex justify-end">
                    <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={issue.assignee.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[8px]">{assigneeInitials}</AvatarFallback>
                    </Avatar>
                </div>
            )}

            {/* Action buttons — only for actionable columns */}
            {cardAllowedTransitions.length > 0 && issue.uatColumn !== "in-development" && (
                <div className="pt-1.5 border-t border-border/40" onClick={e => e.stopPropagation()}>
                    <PortalIssueActions
                        issueId={issue.id}
                        currentCol={issue.uatColumn as UATColumn}
                        allowedTransitions={cardAllowedTransitions}
                        disabledTargets={disabledTargets}
                        onSuccess={onSuccess}
                        layout="pill"
                    />
                </div>
            )}
        </div>
    )
}

// ─── Draggable wrapper ────────────────────────────────────────────────────────

function DraggableIssueCard({ issue, subIssues, teamId, onAction, onIssueClick, cardAllowedTransitions, onSuccess, allowedTransitions, cardOptions }: {
    issue: UATIssue
    subIssues: PortalIssue[]
    teamId: string
    onAction: (issueId: string, target: UATColumn) => void
    onIssueClick?: (issue: PortalIssue) => void
    cardAllowedTransitions: UATColumn[]
    onSuccess: () => void
    allowedTransitions: AllowedTransitions
    cardOptions: CardOptions
}) {
    const draggable = isColumnDraggable(issue.uatColumn, allowedTransitions)
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: issue.id,
        disabled: !draggable,
        data: { issue },
    })

    // Suppress the synthetic click that fires after a drag release
    const suppressClickRef = useRef(false)
    useEffect(() => {
        if (isDragging) suppressClickRef.current = true
    }, [isDragging])

    return (
        <div ref={setNodeRef} style={{ touchAction: "none" }}>
            <UATIssueCard
                issue={issue}
                subIssues={subIssues}
                teamId={teamId}
                onAction={onAction}
                isDragging={isDragging}
                dragListeners={listeners}
                dragAttributes={attributes}
                onIssueClick={onIssueClick}
                cardAllowedTransitions={cardAllowedTransitions}
                onSuccess={onSuccess}
                cardOptions={cardOptions}
                suppressClickRef={suppressClickRef}
            />
        </div>
    )
}

// ─── Droppable Column Area ────────────────────────────────────────────────────

function DroppableColumnArea({ colId, children, isValidTarget, isOver }: {
    colId: string
    children: React.ReactNode
    isValidTarget: boolean
    isOver: boolean
}) {
    const { setNodeRef } = useDroppable({ id: `col-${colId}` })

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto rounded-lg p-1 transition-all",
                isOver && isValidTarget && "ring-2 ring-primary/50 bg-primary/5",
                isOver && !isValidTarget && "ring-2 ring-destructive/30",
                !isValidTarget && "opacity-30",
            )}
        >
            {children}
        </div>
    )
}

// ─── Column Card ──────────────────────────────────────────────────────────────

function UATColumnCard({ col, issues, subIssueMap, teamId, states, onAction, onCreated, widthClass, activeDragFromCol, activeOverColId, onIssueClick, allowedTransitions, onSuccess, cardOptions }: {
    col: ColumnDef
    issues: UATIssue[]
    subIssueMap: Map<string, PortalIssue[]>
    teamId: string
    states: PortalWorkflowState[]
    onAction: (issueId: string, target: UATColumn) => void
    onCreated: () => void
    widthClass: string
    activeDragFromCol: ExtendedUATColumn | null
    activeOverColId: string | null
    onIssueClick?: (issue: PortalIssue) => void
    allowedTransitions: AllowedTransitions
    onSuccess: () => void
    cardOptions: CardOptions
}) {
    const [showCreate, setShowCreate] = useState(false)
    const [descMd, setDescMd] = useState("")
    const [isPending, startTransition] = useTransition()

    // Is this column a valid drop target for the current drag?
    const isValidTarget = activeDragFromCol !== null
        ? (activeDragFromCol !== "in-development" && (allowedTransitions[activeDragFromCol as UATColumn] ?? []).includes(col.id as UATColumn))
        : true // no drag in progress → normal appearance

    const isOver = activeOverColId === `col-${col.id}`

    function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const title = (fd.get("title") as string).trim()
        if (!title) return
        const description = descMd.trim()
        const targetState = states.find(s => s.uatColumn === "submitted") ?? states.find(s => s.type === "triage")
        startTransition(async () => {
            try {
                const result = await createPortalIssue({
                    teamId,
                    title,
                    description: description || undefined,
                    stateId: targetState?.id,
                })
                toast.success(`Issue created: ${result.identifier}`)
                setShowCreate(false)
                onCreated()
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to create issue")
            }
        })
    }

    return (
        <div className={cn("flex flex-col w-full h-full", widthClass)}>
            {/* Column header */}
            <div
                className="group/header flex items-center gap-2 mb-3 px-2 py-2 rounded-lg"
                style={{ backgroundColor: col.color + "14" }}
            >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                <span className="text-xs font-semibold uppercase tracking-wide truncate flex-1" style={{ color: col.color }}>
                    {col.title}
                </span>
                <span
                    className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: col.color + "25", color: col.color }}
                >
                    {issues.length}
                </span>
                {col.allowIssueCreation && (
                    <button
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground opacity-0 group-hover/header:opacity-100"
                        onClick={() => setShowCreate(true)}
                        title="Create issue"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Issue cards — droppable area */}
            <DroppableColumnArea
                colId={col.id}
                isValidTarget={isValidTarget}
                isOver={isOver}
            >
                {issues.map(issue => (
                    <DraggableIssueCard
                        key={issue.id}
                        issue={issue}
                        subIssues={subIssueMap.get(issue.id) ?? []}
                        teamId={teamId}
                        onAction={onAction}
                        onIssueClick={onIssueClick}
                        cardAllowedTransitions={issue.uatColumn !== "in-development" ? (allowedTransitions[issue.uatColumn as UATColumn] ?? []) : []}
                        onSuccess={onSuccess}
                        allowedTransitions={allowedTransitions}
                        cardOptions={cardOptions}
                    />
                ))}
                {issues.length === 0 && (
                    <p className={cn(
                        "text-xs text-muted-foreground/30 py-8 text-center",
                        isOver && isValidTarget && "text-primary/50",
                    )}>
                        {isOver && isValidTarget ? "Drop here" : "No issues"}
                    </p>
                )}
            </DroppableColumnArea>

            {/* Create issue dialog */}
            {col.allowIssueCreation && (
                <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) setDescMd("") }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create Issue</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-1">
                            <div className="space-y-1.5">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" placeholder="Brief description of the issue" required autoFocus />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="description">
                                    Description <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <RichTextEditor
                                    value={descMd}
                                    onChange={setDescMd}
                                    placeholder="Steps to reproduce, expected vs actual behavior…"
                                    minHeight="80px"
                                    disabled={isPending}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)} disabled={isPending}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={isPending}>
                                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

// ─── Blocked comment dialog ───────────────────────────────────────────────────

function BlockedCommentDialog({ open, onConfirm, onCancel }: {
    open: boolean
    onConfirm: (comment: string) => void
    onCancel: () => void
}) {
    const [comment, setComment] = useState("")

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmed = comment.trim()
        if (!trimmed) return
        onConfirm(trimmed)
        setComment("")
    }

    return (
        <Dialog open={open} onOpenChange={open => { if (!open) onCancel() }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>What input is needed?</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label>Comment</Label>
                        <RichTextEditor
                            value={comment}
                            onChange={setComment}
                            placeholder="Describe what input or clarification is needed…"
                            minHeight="100px"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!comment.trim()}>
                            Confirm
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Drag Overlay Card ────────────────────────────────────────────────────────

function DragOverlayCard({ issue }: { issue: UATIssue }) {
    return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-xl space-y-2 opacity-90 rotate-1 scale-105 pointer-events-none w-[260px]">
            <div className="flex items-center gap-1.5">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {issue.identifier}
                </span>
            </div>
            <p className="text-[13px] font-medium leading-snug line-clamp-2">{issue.title}</p>
        </div>
    )
}

// ─── Main UATKanban ───────────────────────────────────────────────────────────

interface UATKanbanProps {
    teamId: string
    initialIssues: PortalIssue[]
    states: PortalWorkflowState[]
    moduleLabels?: PortalModuleLabel[]
    allowedTransitions: AllowedTransitions
    onActionComplete?: () => void
    onIssueClick?: (issue: PortalIssue) => void
}

export function UATKanban({ teamId, initialIssues, states, moduleLabels = [], allowedTransitions, onActionComplete, onIssueClick }: UATKanbanProps) {
    const router = useRouter()
    const { isStaffOrPreview } = usePortalUser()
    const [movingId, setMovingId] = useState<string | null>(null)
    // Optimistic column overrides — applied immediately on drag/click, cleared after server confirms
    const [optimisticMoves, setOptimisticMoves] = useState<Map<string, ExtendedUATColumn>>(new Map())
    // Canceled and archived are hidden by default — not useful noise for clients
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set(["canceled", "archived"]))
    const [hideEmpty, setHideEmpty] = useState(false)
    const [columnWidth, setColumnWidth] = useState<ColumnWidth>("normal")
    const [colPopoverOpen, setColPopoverOpen] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)
    const [cardOptions, setCardOptions] = useState<CardOptions>(DEFAULT_CARD_OPTIONS)

    // Drag state
    const [activeDragIssue, setActiveDragIssue] = useState<UATIssue | null>(null)
    const [activeOverColId, setActiveOverColId] = useState<string | null>(null)
    // Pending drag-to-blocked (requires comment before executing)
    const [pendingBlockedDrop, setPendingBlockedDrop] = useState<{ issueId: string } | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    )

    /**
     * Map every portal issue to a display column.
     * Issues with null UAT mapping (still in dev) → "in-development" virtual column.
     */
    const { subIssueMap } = useMemo(() => separateIssues(initialIssues), [initialIssues])

    const uatIssues = useMemo<UATIssue[]>(() => {
        // Only show top-level issues — sub-issues (acceptance criteria) are tracked inside their parent
        return initialIssues
            .filter(issue => issue.parent === null)
            .map(issue => ({
                ...issue,
                uatColumn: optimisticMoves.get(issue.id)
                    ?? issue.uatColumn
                    ?? getIssueUATColumn(issue)
                    ?? "in-development",
            }))
    }, [initialIssues, optimisticMoves])

    const byColumn = useMemo(() => {
        const map: Record<ExtendedUATColumn, UATIssue[]> = {
            backlog: [],
            submitted: [],
            "not-started": [],
            "in-development": [],
            "client-review": [],
            blocked: [],
            done: [],
            released: [],
            canceled: [],
            archived: [],
        }
        for (const issue of uatIssues) {
            map[issue.uatColumn].push(issue)
        }
        return map
    }, [uatIssues])

    // ── Action handler (button-based, unchanged) ──────────────────────────────

    async function handleAction(issueId: string, target: UATColumn) {
        const targetCol = UAT_COLUMNS.find(c => c.id === target)
        setMovingId(issueId)
        setOptimisticMoves(prev => new Map(prev).set(issueId, target))
        try {
            await movePortalIssueToUATColumn(issueId, target)
            toast.success(`Moved to ${targetCol?.title ?? target}`)
            router.refresh()
            onActionComplete?.()
        } catch (err: unknown) {
            setOptimisticMoves(prev => { const m = new Map(prev); m.delete(issueId); return m })
            toast.error(err instanceof Error ? err.message : "Failed to move issue")
        } finally {
            setMovingId(null)
        }
    }

    // ── Drag handlers ─────────────────────────────────────────────────────────

    function handleDragStart(event: DragStartEvent) {
        const issue = event.active.data.current?.issue as UATIssue | undefined
        if (issue) setActiveDragIssue(issue)
    }

    function handleDragOver(event: DragOverEvent) {
        setActiveOverColId(event.over?.id as string ?? null)
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveDragIssue(null)
        setActiveOverColId(null)

        if (!over) return

        const issue = active.data.current?.issue as UATIssue | undefined
        if (!issue) return

        // over.id is "col-{colId}"
        const overColId = (over.id as string).replace(/^col-/, "")
        if (issue.uatColumn === "in-development") return
        if (overColId === (issue.uatColumn as string)) return
        if (!(allowedTransitions[issue.uatColumn as UATColumn] ?? []).includes(overColId as UATColumn)) {
            const fromCol = UAT_COLUMNS.find(c => c.id === issue.uatColumn)
            const toCol = UAT_COLUMNS.find(c => c.id === overColId)
            const allowed = allowedTransitions[issue.uatColumn as UATColumn] ?? []
            const allowedNames = allowed
                .map(id => UAT_COLUMNS.find(c => c.id === id)?.title ?? id)
                .join(", ")
            const ruleOwner = isStaffOrPreview ? "staff" : "client"
            toast.error(
                `Cannot move to "${toCol?.title ?? overColId}"`,
                {
                    description: allowed.length > 0
                        ? `The ${ruleOwner} transition rules only allow moving from "${fromCol?.title ?? issue.uatColumn}" to: ${allowedNames}.`
                        : `The ${ruleOwner} transition rules do not allow any moves from "${fromCol?.title ?? issue.uatColumn}".`,
                },
            )
            return
        }

        const target = overColId as UATColumn

        // Sub-issue approval gate: parent cannot be approved until all sub-issues are resolved
        if (target === "done" || target === "released") {
            const subs = subIssueMap.get(issue.id) ?? []
            const { blocked, pendingCount } = getSubIssueApprovalBlock(subs)
            if (blocked) {
                toast.error(`Cannot approve: ${pendingCount} sub-issue${pendingCount > 1 ? "s" : ""} still pending`)
                return
            }
        }

        if (target === "blocked") {
            // Requires a comment — show dialog, defer the action
            // Apply optimistic move so the card visually moves to "blocked" immediately
            setOptimisticMoves(prev => new Map(prev).set(issue.id, "blocked"))
            setPendingBlockedDrop({ issueId: issue.id })
            return
        }

        // Instant transition for done / client-review
        executeMove(issue.id, target)
    }

    async function executeMove(issueId: string, target: UATColumn, comment?: string) {
        const targetCol = UAT_COLUMNS.find(c => c.id === target)
        setMovingId(issueId)
        setOptimisticMoves(prev => new Map(prev).set(issueId, target))
        try {
            await movePortalIssueToUATColumn(issueId, target, comment)
            toast.success(`Moved to ${targetCol?.title ?? target}`)
            router.refresh()
            onActionComplete?.()
        } catch (err: unknown) {
            setOptimisticMoves(prev => { const m = new Map(prev); m.delete(issueId); return m })
            toast.error(err instanceof Error ? err.message : "Failed to move issue")
        } finally {
            setMovingId(null)
        }
    }

    function handleBlockedConfirm(comment: string) {
        if (!pendingBlockedDrop) return
        const { issueId } = pendingBlockedDrop
        setPendingBlockedDrop(null)
        executeMove(issueId, "blocked", comment)
    }

    function handleBlockedCancel() {
        if (pendingBlockedDrop) {
            setOptimisticMoves(prev => { const m = new Map(prev); m.delete(pendingBlockedDrop.issueId); return m })
        }
        setPendingBlockedDrop(null)
    }

    // ── Column visibility ─────────────────────────────────────────────────────

    function toggleColumn(id: string) {
        setHiddenColumns(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const visibleColumns = ALL_COLUMNS.filter(col => {
        if (hiddenColumns.has(col.id)) return false
        if (hideEmpty && byColumn[col.id as ExtendedUATColumn].length === 0) return false
        return true
    })

    const activeDragFromCol = activeDragIssue?.uatColumn ?? null

    return (
        <DndContext
            id="uat-kanban"
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-full">
                {/* Toolbar */}
                <div className="flex items-center gap-2 px-4 md:px-6 pt-2 pb-0 shrink-0">
                    <Button
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => setReportOpen(true)}
                    >
                        <TicketPlus className="h-3.5 w-3.5" />
                        Create a Ticket
                    </Button>

                    <div className="flex-1" />

                    <Popover open={colPopoverOpen} onOpenChange={setColPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                <Columns3 className="h-3.5 w-3.5" />
                                Columns
                                {hiddenColumns.size > 0 && (
                                    <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0 leading-4">
                                        {hiddenColumns.size}/{ALL_COLUMNS.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="start">
                            <div className="px-4 pt-3 pb-1">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Column Visibility
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5 px-4 py-2">
                                <Checkbox
                                    id="hide-empty"
                                    checked={hideEmpty}
                                    onCheckedChange={v => setHideEmpty(Boolean(v))}
                                />
                                <label htmlFor="hide-empty" className="text-sm cursor-pointer select-none">
                                    Hide Empty Columns
                                </label>
                            </div>

                            <div className="flex items-center gap-3 px-4 py-2 border-t border-border/50">
                                <button
                                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setHiddenColumns(new Set())}
                                >
                                    <Eye className="h-3.5 w-3.5" /> Show All
                                </button>
                                <button
                                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
                                    onClick={() => setHiddenColumns(new Set(ALL_COLUMNS.map(c => c.id)))}
                                >
                                    <EyeOff className="h-3.5 w-3.5" /> Hide All
                                </button>
                            </div>

                            {/* Card Fields */}
                            <div className="px-4 py-2 border-t border-border/50">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                    Card Fields
                                </p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2.5">
                                        <Checkbox
                                            id="show-priority"
                                            checked={cardOptions.showPriority}
                                            onCheckedChange={v => setCardOptions(o => ({ ...o, showPriority: Boolean(v) }))}
                                        />
                                        <label htmlFor="show-priority" className="text-sm cursor-pointer select-none">
                                            Show Priority
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <Checkbox
                                            id="show-status"
                                            checked={cardOptions.showStatus}
                                            onCheckedChange={v => setCardOptions(o => ({ ...o, showStatus: Boolean(v) }))}
                                        />
                                        <label htmlFor="show-status" className="text-sm cursor-pointer select-none">
                                            Show Status
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <Checkbox
                                            id="show-assignee"
                                            checked={cardOptions.showAssignee}
                                            onCheckedChange={v => setCardOptions(o => ({ ...o, showAssignee: Boolean(v) }))}
                                        />
                                        <label htmlFor="show-assignee" className="text-sm cursor-pointer select-none">
                                            Show Assignee
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <Checkbox
                                            id="show-labels"
                                            checked={cardOptions.showLabels}
                                            onCheckedChange={v => setCardOptions(o => ({ ...o, showLabels: Boolean(v) }))}
                                        />
                                        <label htmlFor="show-labels" className="text-sm cursor-pointer select-none">
                                            Show Labels
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <Checkbox
                                            id="show-project"
                                            checked={cardOptions.showProject}
                                            onCheckedChange={v => setCardOptions(o => ({ ...o, showProject: Boolean(v) }))}
                                        />
                                        <label htmlFor="show-project" className="text-sm cursor-pointer select-none">
                                            Show Project
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <Checkbox
                                            id="show-cycle"
                                            checked={cardOptions.showCycle}
                                            onCheckedChange={v => setCardOptions(o => ({ ...o, showCycle: Boolean(v) }))}
                                        />
                                        <label htmlFor="show-cycle" className="text-sm cursor-pointer select-none">
                                            Show Cycle
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-2 border-t border-border/50">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                    Column Width
                                </p>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {(["compact", "normal", "wide"] as ColumnWidth[]).map(w => (
                                        <button
                                            key={w}
                                            onClick={() => setColumnWidth(w)}
                                            className={cn(
                                                "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors border",
                                                columnWidth === w
                                                    ? "bg-muted border-border text-foreground"
                                                    : "border-transparent text-muted-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            {w === "compact" && <Minimize2 className="h-3 w-3" />}
                                            {w === "normal" && <Square className="h-3 w-3" />}
                                            {w === "wide" && <Maximize2 className="h-3 w-3" />}
                                            {w.charAt(0).toUpperCase() + w.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="px-4 py-2 border-t border-border/50">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                    Individual Columns ({ALL_COLUMNS.length})
                                </p>
                                <div className="space-y-1">
                                    {ALL_COLUMNS.map(col => {
                                        const isHidden = hiddenColumns.has(col.id)
                                        const count = byColumn[col.id as ExtendedUATColumn].length
                                        return (
                                            <button
                                                key={col.id}
                                                onClick={() => toggleColumn(col.id)}
                                                className="w-full flex items-center gap-2.5 py-1 text-sm hover:bg-muted/40 rounded px-1 transition-colors"
                                            >
                                                {isHidden
                                                    ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                                                    : <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                }
                                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                                                <span className={cn("flex-1 text-left", isHidden && "text-muted-foreground/50")}>
                                                    {col.title}
                                                </span>
                                                <span className={cn(
                                                    "text-xs tabular-nums font-medium",
                                                    count === 0 ? "text-muted-foreground/40" : "text-muted-foreground"
                                                )}>
                                                    {count}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="px-4 py-2.5 border-t border-border/50">
                                <button
                                    className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setColPopoverOpen(false)}
                                >
                                    ✓ Done
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Board — horizontal scroll, columns scroll vertically */}
                <div className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden px-4 md:px-6 py-4">
                    {movingId && (
                        <div className="fixed inset-0 bg-background/20 z-10 pointer-events-none flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                    {visibleColumns.map(col => (
                        <UATColumnCard
                            key={col.id}
                            col={col}
                            issues={byColumn[col.id as ExtendedUATColumn]}
                            subIssueMap={subIssueMap}
                            teamId={teamId}
                            states={states}
                            onAction={handleAction}
                            onCreated={() => router.refresh()}
                            widthClass={WIDTH_CLASSES[columnWidth]}
                            activeDragFromCol={activeDragFromCol}
                            activeOverColId={activeOverColId}
                            onIssueClick={onIssueClick}
                            allowedTransitions={allowedTransitions}
                            onSuccess={() => { router.refresh(); onActionComplete?.() }}
                            cardOptions={cardOptions}
                        />
                    ))}
                </div>

                <ReportIssueModal
                    open={reportOpen}
                    onOpenChange={setReportOpen}
                    teamId={teamId}
                    parentIssue={null}
                    moduleLabels={moduleLabels}
                    onCreated={() => router.refresh()}
                />
            </div>

            {/* Drag overlay — floating card preview */}
            <DragOverlay dropAnimation={null}>
                {activeDragIssue ? <DragOverlayCard issue={activeDragIssue} /> : null}
            </DragOverlay>

            {/* Blocked comment dialog — shown after drop on "blocked" column */}
            <BlockedCommentDialog
                open={pendingBlockedDrop !== null}
                onConfirm={handleBlockedConfirm}
                onCancel={handleBlockedCancel}
            />
        </DndContext>
    )
}
