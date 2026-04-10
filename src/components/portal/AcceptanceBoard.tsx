"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { PortalIssue, PortalModuleLabel } from "@/app/actions/portal/types"
import { UAT_COLUMNS, type UATColumn, type AllowedTransitions } from "@/lib/uat-mapping"
import {
    DONE_COLOR, BLOCKED_COLOR, PENDING_COLOR,
    PRIORITY_CONFIG,
    getIssueUATColumn, getIssueTransitions, getAssigneeInitials,
    separateIssues, computeIssueStats, getSubIssueApprovalBlock,
} from "@/components/portal/portal-issue-utils"
import { PortalIssueActions } from "@/components/portal/PortalIssueActions"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
    ChevronDown, ChevronRight, RefreshCw,
    CheckCircle2, Clock, AlertTriangle, Bug, Eye,
    ChevronsDownUp, ChevronsUpDown,
} from "lucide-react"
import { ReportIssueTrigger } from "@/components/portal/ReportIssueTrigger"
import { ReportIssueModal } from "@/components/portal/ReportIssueModal"

const TERMINAL_COLS: readonly UATColumn[] = ["done", "released", "archived", "canceled"]

// ─── Sub-issue row (indented, no expand toggle) ───────────────────────────────

function SubIssueRow({
    issue,
    teamId,
    allowedTransitions,
    onActionComplete,
    onIssueClick,
}: {
    issue: PortalIssue
    teamId: string
    allowedTransitions: AllowedTransitions
    onActionComplete?: () => void
    onIssueClick?: (issue: PortalIssue) => void
}) {
    const router = useRouter()
    const col = getIssueUATColumn(issue)
    const transitions = getIssueTransitions(issue, allowedTransitions)
    const initials = getAssigneeInitials(issue.assignee?.name)
    const isTerminal = col !== null && TERMINAL_COLS.includes(col)

    return (
        <div className={cn(
            "flex items-center gap-3 pl-12 pr-4 py-2 bg-muted/20 hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0",
            isTerminal && "opacity-50",
        )}>
            {/* Indent indicator */}
            <span className="h-3 w-px bg-border/60 shrink-0" />

            {/* Priority dot */}
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_CONFIG[issue.priority]?.colorClass ?? "bg-muted-foreground/30")} />

            {/* Identifier */}
            <span
                className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded w-16 shrink-0 truncate cursor-pointer hover:text-foreground transition-colors"
                onClick={() => onIssueClick ? onIssueClick(issue) : router.push(`/uat/${teamId}/${issue.id}`)}
            >
                {issue.identifier}
            </span>

            {/* Title */}
            <span
                className={cn(
                    "text-sm flex-1 truncate cursor-pointer hover:text-foreground/80 transition-colors text-muted-foreground",
                    isTerminal && "line-through",
                )}
                onClick={() => onIssueClick ? onIssueClick(issue) : router.push(`/uat/${teamId}/${issue.id}`)}
            >
                {issue.title}
            </span>

            {/* Assignee */}
            {issue.assignee ? (
                <Avatar className="h-5 w-5 shrink-0">
                    <AvatarImage src={issue.assignee.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
                </Avatar>
            ) : (
                <span className="h-5 w-5 shrink-0" />
            )}

            {/* Actions — hidden for terminal issues */}
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {!isTerminal && col && transitions.length > 0 && (
                    <PortalIssueActions
                        issueId={issue.id}
                        currentCol={col}
                        allowedTransitions={transitions}
                        onSuccess={() => { router.refresh(); onActionComplete?.() }}
                        layout="pill"
                    />
                )}
                <button
                    onClick={() => onIssueClick ? onIssueClick(issue) : router.push(`/uat/${teamId}/${issue.id}`)}
                    title="View Details"
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
                >
                    <Eye className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    )
}

// ─── Issue Row (top-level, with collapsible sub-issues) ───────────────────────

function IssueRow({
    issue,
    subIssues,
    teamId,
    allowedTransitions,
    onReportBug,
    onActionComplete,
    onIssueClick,
    forceExpanded,
}: {
    issue: PortalIssue
    subIssues: PortalIssue[]
    teamId: string
    allowedTransitions: AllowedTransitions
    onReportBug: (issue: PortalIssue) => void
    onActionComplete?: () => void
    onIssueClick?: (issue: PortalIssue) => void
    forceExpanded: boolean | null
}) {
    const router = useRouter()
    const [localExpanded, setLocalExpanded] = useState(false)
    const isExpanded = forceExpanded !== null ? forceExpanded : localExpanded

    const col = getIssueUATColumn(issue)
    const transitions = getIssueTransitions(issue, allowedTransitions)
    const initials = getAssigneeInitials(issue.assignee?.name)
    const hasSubIssues = subIssues.length > 0

    const pendingSubCount = subIssues.filter(s => {
        const c = getIssueUATColumn(s)
        return c === null || !TERMINAL_COLS.includes(c)
    }).length
    const doneSubCount = subIssues.length - pendingSubCount

    const { blocked: approveBlocked, pendingCount } = getSubIssueApprovalBlock(subIssues)
    const disabledTargets = approveBlocked
        ? { done: `${pendingCount} sub-issue${pendingCount > 1 ? "s" : ""} not yet approved`, released: `${pendingCount} sub-issue${pendingCount > 1 ? "s" : ""} not yet approved` }
        : undefined

    return (
        <>
            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors border-b border-border/40">
                {/* Expand toggle (always reserve space for alignment) */}
                <button
                    className={cn(
                        "h-4 w-4 shrink-0 flex items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors rounded",
                        !hasSubIssues && "invisible pointer-events-none",
                    )}
                    onClick={() => setLocalExpanded(v => !v)}
                >
                    {isExpanded
                        ? <ChevronDown className="h-3 w-3" />
                        : <ChevronRight className="h-3 w-3" />
                    }
                </button>

                {/* Priority dot */}
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_CONFIG[issue.priority]?.colorClass ?? "bg-muted-foreground/30")} />

                {/* Identifier */}
                <span
                    className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded w-16 shrink-0 truncate cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => onIssueClick ? onIssueClick(issue) : router.push(`/uat/${teamId}/${issue.id}`)}
                >
                    {issue.identifier}
                </span>

                {/* Title */}
                <span
                    className="text-sm flex-1 truncate cursor-pointer hover:text-foreground/80 transition-colors"
                    onClick={() => onIssueClick ? onIssueClick(issue) : router.push(`/uat/${teamId}/${issue.id}`)}
                >
                    {issue.title}
                </span>

                {/* Sub-issue count badge */}
                {hasSubIssues && (
                    <button
                        className="hidden sm:flex items-center gap-1 text-[10px] bg-muted/60 px-1.5 py-0.5 rounded-full shrink-0 hover:bg-muted transition-colors"
                        onClick={() => setLocalExpanded(v => !v)}
                    >
                        {doneSubCount > 0 ? (
                            <>
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{doneSubCount}✓</span>
                                {pendingSubCount > 0 && <span className="text-muted-foreground ml-0.5">{pendingSubCount}</span>}
                            </>
                        ) : (
                            <span className="text-muted-foreground">{subIssues.length} sub</span>
                        )}
                    </button>
                )}

                {/* Assignee */}
                {issue.assignee ? (
                    <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={issue.assignee.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
                    </Avatar>
                ) : (
                    <span className="h-5 w-5 shrink-0" />
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {col && transitions.length > 0 && (
                        <PortalIssueActions
                            issueId={issue.id}
                            currentCol={col}
                            allowedTransitions={transitions}
                            disabledTargets={disabledTargets}
                            onSuccess={() => { router.refresh(); onActionComplete?.() }}
                            layout="pill"
                        />
                    )}
                    <button
                        onClick={() => onReportBug(issue)}
                        title="Report Bug"
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground/60 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/40 dark:hover:text-orange-400 transition-colors"
                    >
                        <Bug className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={() => onIssueClick ? onIssueClick(issue) : router.push(`/uat/${teamId}/${issue.id}`)}
                        title="View Details"
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Sub-issues (collapsible) */}
            {isExpanded && subIssues.map(sub => (
                <SubIssueRow
                    key={sub.id}
                    issue={sub}
                    teamId={teamId}
                    allowedTransitions={allowedTransitions}
                    onActionComplete={onActionComplete}
                    onIssueClick={onIssueClick}
                />
            ))}
        </>
    )
}

// ─── Main AcceptanceBoard ─────────────────────────────────────────────────────

interface AcceptanceBoardProps {
    teamId: string
    issues: PortalIssue[]
    /**
     * Full unfiltered issue list for building the sub-issue map.
     * When provided, sub-issues that were filtered out of `issues` (e.g. approved
     * sub-issues hidden by the "needs-review" scope filter) are still shown inline
     * under their parent — but rendered as de-emphasized / completed rows.
     */
    allIssues?: PortalIssue[]
    /** Still forwarded to ReportIssueModal for label pre-fill */
    moduleLabels?: PortalModuleLabel[]
    allowedTransitions?: AllowedTransitions
    onActionComplete?: () => void
    onIssueClick?: (issue: PortalIssue) => void
}

export function AcceptanceBoard({
    teamId,
    issues,
    allIssues,
    moduleLabels = [],
    allowedTransitions = {},
    onActionComplete,
    onIssueClick,
}: AcceptanceBoardProps) {
    const router = useRouter()

    const [reportTarget, setReportTarget] = useState<{
        open: boolean
        parent: { id: string; identifier: string; title: string } | null
    }>({ open: false, parent: null })

    // null = each row controls itself; true/false = force all
    const [forceExpanded, setForceExpanded] = useState<boolean | null>(null)

    // Collapsed group IDs
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

    // Top-level issues from the filtered list
    const { topLevel: topLevelIssues } = useMemo(() => separateIssues(issues), [issues])

    // Sub-issue map built from the full unfiltered list so approved sub-issues
    // (filtered out by scope) are still visible when a parent is expanded.
    const { subIssueMap } = useMemo(
        () => separateIssues(allIssues ?? issues),
        [allIssues, issues],
    )

    // ─── Overall stats (top-level issues only) ────────────────────────────────
    const overall = useMemo(() => computeIssueStats(topLevelIssues), [topLevelIssues])

    const totalSubIssues = useMemo(
        () => [...subIssueMap.values()].reduce((s, a) => s + a.length, 0),
        [subIssueMap],
    )

    // Group top-level issues by UAT column, in UAT_COLUMNS order, only non-empty groups
    const groupedTopLevel = useMemo(() => {
        return UAT_COLUMNS
            .map(colDef => ({
                colDef,
                issues: topLevelIssues.filter(i => getIssueUATColumn(i) === colDef.id),
            }))
            .filter(g => g.issues.length > 0)
    }, [topLevelIssues])

    function openBugReport(issue: PortalIssue) {
        setReportTarget({ open: true, parent: { id: issue.id, identifier: issue.identifier, title: issue.title } })
    }

    return (
        <div className="flex flex-col h-full gap-0">
            {/* ── Summary bar ─────────────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card overflow-hidden mb-4 shrink-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/60">
                    {/* Approval % */}
                    <div className="px-4 py-3 flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </span>
                        <div>
                            <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 leading-none">{overall.pct}%</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">Approved</p>
                        </div>
                    </div>

                    {/* Done count */}
                    <div className="px-4 py-3 flex items-center gap-2">
                        <div>
                            <p className="text-lg font-bold tabular-nums">
                                {overall.done} <span className="text-xs font-normal text-muted-foreground">/ {overall.active}</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">Items Done</p>
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="px-4 py-3 flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                            <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </span>
                        <div>
                            <p className="text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">{overall.pending}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">Pending Review</p>
                        </div>
                    </div>

                    {/* Blocked + action buttons */}
                    <div className="px-4 py-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            {overall.blocked > 0 && (
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                </span>
                            )}
                            <div>
                                <p className={cn(
                                    "text-lg font-bold tabular-nums",
                                    overall.blocked > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
                                )}>{overall.blocked}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">Blocked</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <ReportIssueTrigger teamId={teamId} moduleLabels={moduleLabels} />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => router.refresh()} title="Refresh">
                                <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Overall progress bar */}
                <div className="h-1 w-full bg-muted flex">
                    {overall.done > 0 && overall.active > 0 && (
                        <div className="h-full transition-all" style={{ width: `${Math.round((overall.done / overall.active) * 100)}%`, backgroundColor: DONE_COLOR }} />
                    )}
                    {overall.pending > 0 && overall.active > 0 && (
                        <div className="h-full transition-all" style={{ width: `${Math.round((overall.pending / overall.active) * 100)}%`, backgroundColor: PENDING_COLOR }} />
                    )}
                    {overall.blocked > 0 && overall.active > 0 && (
                        <div className="h-full transition-all" style={{ width: `${Math.round((overall.blocked / overall.active) * 100)}%`, backgroundColor: BLOCKED_COLOR }} />
                    )}
                </div>
            </div>

            {/* ── Issue list ──────────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-0 rounded-xl border border-border overflow-hidden bg-card flex-col">
                {/* Controls bar */}
                <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-border/60 shrink-0">
                    <span className="text-xs text-muted-foreground mr-auto tabular-nums">
                        {topLevelIssues.length} issue{topLevelIssues.length !== 1 ? "s" : ""}
                        {totalSubIssues > 0 && (
                            <span className="ml-1 opacity-60">
                                · {totalSubIssues} sub-issue{totalSubIssues !== 1 ? "s" : ""}
                            </span>
                        )}
                        {collapsedGroups.size > 0 && (
                            <span className="ml-1 opacity-60">
                                · {collapsedGroups.size} group{collapsedGroups.size !== 1 ? "s" : ""} collapsed
                            </span>
                        )}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs"
                        onClick={() => setForceExpanded(true)} title="Expand all sub-issues">
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Expand all</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs"
                        onClick={() => setForceExpanded(false)} title="Collapse all sub-issues">
                        <ChevronsDownUp className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Collapse all</span>
                    </Button>
                </div>

                {/* Issue rows grouped by UAT column */}
                <div className="flex-1 overflow-y-auto">
                    {groupedTopLevel.length === 0 ? (
                        <div className="py-16 text-center">
                            <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground/60">No acceptance issues found.</p>
                        </div>
                    ) : (
                        groupedTopLevel.map(({ colDef, issues: groupIssues }) => {
                            const isCollapsed = collapsedGroups.has(colDef.id)
                            return (
                                <div key={colDef.id}>
                                    {/* Group header */}
                                    <button
                                        className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-muted/30 transition-colors border-b border-border/40 sticky top-0 z-10 bg-card/95 backdrop-blur-sm"
                                        onClick={() => setCollapsedGroups(prev => {
                                            const next = new Set(prev)
                                            if (next.has(colDef.id)) next.delete(colDef.id)
                                            else next.add(colDef.id)
                                            return next
                                        })}
                                    >
                                        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-transform shrink-0", isCollapsed && "-rotate-90")} />
                                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colDef.color }} />
                                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colDef.color }}>
                                            {colDef.title}
                                        </span>
                                        <span
                                            className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full ml-1"
                                            style={{ backgroundColor: colDef.color + "20", color: colDef.color }}
                                        >
                                            {groupIssues.length}
                                        </span>
                                    </button>
                                    {/* Issue rows */}
                                    {!isCollapsed && groupIssues.map(issue => (
                                        <IssueRow
                                            key={issue.id}
                                            issue={issue}
                                            subIssues={subIssueMap.get(issue.id) ?? []}
                                            teamId={teamId}
                                            allowedTransitions={allowedTransitions}
                                            onReportBug={openBugReport}
                                            onActionComplete={onActionComplete}
                                            onIssueClick={onIssueClick}
                                            forceExpanded={forceExpanded}
                                        />
                                    ))}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Modal for row-level bug reports (with parent issue context) */}
            <ReportIssueModal
                open={reportTarget.open}
                onOpenChange={(open: boolean) => setReportTarget(v => ({ ...v, open }))}
                teamId={teamId}
                parentIssue={reportTarget.parent}
                moduleLabels={moduleLabels}
                onCreated={() => router.refresh()}
            />
        </div>
    )
}
